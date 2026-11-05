package com.depa.consent.repository;

import com.depa.consent.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByDataPrincipalIdOrderByCreatedAtDesc(String dataPrincipalId);
    long countByDataPrincipalIdAndReadFalse(String dataPrincipalId);
}
