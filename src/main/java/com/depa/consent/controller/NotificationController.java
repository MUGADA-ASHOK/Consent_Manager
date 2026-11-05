package com.depa.consent.controller;

import com.depa.consent.entity.Notification;
import com.depa.consent.security.UserPrincipal;
import com.depa.consent.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Data Principal views their in-app notification feed.
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        String principalId = actor.getExternalIdentityId() != null 
                ? actor.getExternalIdentityId() 
                : actor.getUserId();
        return ResponseEntity.ok(notificationService.getNotificationsForStudent(principalId));
    }

    /**
     * Get count of unread notifications.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        String principalId = actor.getExternalIdentityId() != null 
                ? actor.getExternalIdentityId() 
                : actor.getUserId();
        long count = notificationService.getUnreadCount(principalId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * Mark an in-app notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal actor
    ) {
        String principalId = actor.getExternalIdentityId() != null 
                ? actor.getExternalIdentityId() 
                : actor.getUserId();
        return ResponseEntity.ok(notificationService.markAsRead(id, principalId));
    }
}
