package com.depa.consent.service;

import com.depa.consent.entity.Notification;
import com.depa.consent.entity.NotificationType;
import com.depa.consent.entity.User;
import com.depa.consent.repository.NotificationRepository;
import com.depa.consent.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailDeliveryService emailDeliveryService;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               EmailDeliveryService emailDeliveryService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailDeliveryService = emailDeliveryService;
    }

    public Notification sendNotification(String dataPrincipalId, NotificationType type, String title,
                                         String message, String requestingOrgCode, String purpose) {
        String id = "NOTIF_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Notification notification = new Notification(
                id,
                dataPrincipalId.trim().toUpperCase(),
                type,
                title,
                message,
                requestingOrgCode,
                purpose
        );
        Notification saved = notificationRepository.save(notification);

        // Find student email if registered
        String targetEmail = userRepository.findByExternalIdentityId(dataPrincipalId.trim().toUpperCase())
                .map(User::getEmail)
                .orElse(dataPrincipalId.toLowerCase() + "@student.college.edu");

        // Dispatch simulated email notification (DEPA Notice requirement)
        emailDeliveryService.sendNoticeEmail(targetEmail, dataPrincipalId, title, message, requestingOrgCode, purpose);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsForStudent(String dataPrincipalId) {
        if (dataPrincipalId == null || dataPrincipalId.isBlank()) {
            return List.of();
        }
        return notificationRepository.findByDataPrincipalIdOrderByCreatedAtDesc(dataPrincipalId.trim().toUpperCase());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String dataPrincipalId) {
        if (dataPrincipalId == null || dataPrincipalId.isBlank()) {
            return 0;
        }
        return notificationRepository.countByDataPrincipalIdAndReadFalse(dataPrincipalId.trim().toUpperCase());
    }

    public Notification markAsRead(String notificationId, String dataPrincipalId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        
        if (!notification.getDataPrincipalId().equalsIgnoreCase(dataPrincipalId.trim())) {
            throw new SecurityException("Unauthorized: Cannot modify notification for another principal");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
