package com.depa.consent.service;

import com.depa.consent.entity.AuditEventType;
import com.depa.consent.entity.AuditLog;
import com.depa.consent.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final com.depa.consent.repository.OrganizationRepository organizationRepository;

    public AuditService(AuditLogRepository auditLogRepository,
                        com.depa.consent.repository.OrganizationRepository organizationRepository) {
        this.auditLogRepository = auditLogRepository;
        this.organizationRepository = organizationRepository;
    }

    public void logEvent(AuditEventType eventType, String actorUserId, String actorRole,
                         String targetEntityType, String targetEntityId, String organizationId, String details) {
        logEvent(eventType, actorUserId, actorRole, targetEntityType, targetEntityId, organizationId, null, details);
    }

    public void logEvent(AuditEventType eventType, String actorUserId, String actorRole,
                         String targetEntityType, String targetEntityId, String organizationId,
                         String dataPrincipalId, String details) {
        String logId = "AUD_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        AuditLog auditLog = new AuditLog(
                logId,
                eventType,
                actorUserId,
                actorRole,
                targetEntityType,
                targetEntityId,
                organizationId,
                dataPrincipalId,
                details
        );
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAllAuditLogs() {
        // Privacy Guard: Super Admin / CM Admin cannot view student-sovereign consent decisions (Approvals & Denials)
        return auditLogRepository.findAllByOrderByTimestampDesc()
                .stream()
                .filter(log -> log.getEventType() != AuditEventType.CONSENT_APPROVED &&
                               log.getEventType() != AuditEventType.CONSENT_REJECTED &&
                               log.getEventType() != AuditEventType.DATA_ACCESS_DENIED)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsForOrganization(String orgIdentifier) {
        if (orgIdentifier == null || orgIdentifier.isBlank()) {
            return List.of();
        }
        String cleanId = orgIdentifier.trim();
        String actualOrgId = cleanId;

        // Resolve by organization code if passed like ORG_COLLEGE_B or COLLEGE_B
        String possibleCode = cleanId.replaceFirst("^ORG_", "");
        var orgOpt = organizationRepository.findByOrganizationCode(possibleCode);
        if (orgOpt.isEmpty()) {
            orgOpt = organizationRepository.findByOrganizationCode(cleanId);
        }
        if (orgOpt.isPresent()) {
            actualOrgId = orgOpt.get().getOrganizationId();
        }

        List<AuditLog> logs = auditLogRepository.findByOrganizationIdOrderByTimestampDesc(actualOrgId);
        if (logs.isEmpty() && !actualOrgId.equals(cleanId)) {
            logs = auditLogRepository.findByOrganizationIdOrderByTimestampDesc(cleanId);
        }
        return logs;
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogsForStudent(String dataPrincipalId) {
        if (dataPrincipalId == null || dataPrincipalId.isBlank()) {
            return List.of();
        }
        return auditLogRepository.findByDataPrincipalIdOrderByTimestampDesc(dataPrincipalId.trim().toUpperCase());
    }
}
