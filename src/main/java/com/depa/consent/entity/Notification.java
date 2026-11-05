package com.depa.consent.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @Column(name = "notification_id", length = 64, nullable = false, updatable = false)
    private String id;

    @Column(name = "data_principal_id", length = 64, nullable = false)
    private String dataPrincipalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 32, nullable = false)
    private NotificationType type;

    @Column(name = "title", length = 128, nullable = false)
    private String title;

    @Column(name = "message", length = 1000, nullable = false)
    private String message;

    @Column(name = "requesting_org_code", length = 64)
    private String requestingOrgCode;

    @Column(name = "purpose", length = 255)
    private String purpose;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Notification() {}

    public Notification(String id, String dataPrincipalId, NotificationType type, String title,
                        String message, String requestingOrgCode, String purpose) {
        this.id = id;
        this.dataPrincipalId = dataPrincipalId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.requestingOrgCode = requestingOrgCode;
        this.purpose = purpose;
        this.read = false;
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getId() { return id; }
    public String getDataPrincipalId() { return dataPrincipalId; }
    public NotificationType getType() { return type; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public String getRequestingOrgCode() { return requestingOrgCode; }
    public String getPurpose() { return purpose; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public Instant getCreatedAt() { return createdAt; }
}

