package com.depa.consent.controller;

import com.depa.consent.dto.DataFlowAuditRequest;
import com.depa.consent.entity.AuditLog;
import com.depa.consent.entity.NotificationType;
import com.depa.consent.security.UserPrincipal;
import com.depa.consent.service.AuditService;
import com.depa.consent.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;
    private final NotificationService notificationService;

    public AuditController(AuditService auditService, NotificationService notificationService) {
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    /**
     * Admin view: System-wide audit logs.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditService.getAllAuditLogs());
    }

    /**
     * Org Admin view: Organization audit logs.
     */
    @GetMapping("/organization/{orgId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN')")
    public ResponseEntity<List<AuditLog>> getOrganizationAuditLogs(@PathVariable("orgId") String orgId) {
        return ResponseEntity.ok(auditService.getAuditLogsForOrganization(orgId));
    }

    /**
     * Student view: Complete personal audit trail.
     * Shows the student who requested access, what was shared, when, and lifecycle changes.
     */
    @GetMapping("/my-logs")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AuditLog>> getMyAuditLogs(
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        String principalId = actor.getExternalIdentityId() != null 
                ? actor.getExternalIdentityId() 
                : actor.getUserId();
        return ResponseEntity.ok(auditService.getAuditLogsForStudent(principalId));
    }

    /**
     * Data Flow Audit Endpoint:
     * Called by Provider when data is prepared/shared and Consumer when data is received.
     */
    @PostMapping("/data-flow")
    public ResponseEntity<Map<String, Object>> logDataFlow(@RequestBody DataFlowAuditRequest request) {
        if (request.getEventType() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "eventType is required"));
        }

        auditService.logEvent(
                request.getEventType(),
                request.getOrganizationCode() != null ? request.getOrganizationCode() : "P2P_PEER",
                "ORGANIZATION",
                "ACCESS_GRANT",
                request.getGrantId(),
                request.getOrganizationCode(),
                request.getDataPrincipalId(),
                request.getDetails() != null ? request.getDetails() : ("Data flow event: " + request.getEventType().name())
        );

        // If data was prepared and shared, trigger student notification
        if (request.getEventType().name().equals("DATA_PREPARED_AND_SHARED") && request.getDataPrincipalId() != null) {
            String fieldsDesc = request.getFields() != null ? String.join(", ", request.getFields()) : "authorized data";
            notificationService.sendNotification(
                    request.getDataPrincipalId(),
                    NotificationType.DATA_SHARED,
                    "Data Shared with " + (request.getOrganizationCode() != null ? request.getOrganizationCode() : "Consumer"),
                    "Your academic attributes (" + fieldsDesc + ") have been securely encrypted and transferred.",
                    request.getOrganizationCode(),
                    "Fulfillment of approved access grant " + request.getGrantId()
            );
        }

        return ResponseEntity.ok(Map.of("status", "LOGGED", "eventType", request.getEventType().name()));
    }
}
