package com.depa.consent.service;

import com.depa.consent.dto.AuthResponse;
import com.depa.consent.dto.LoginRequest;
import com.depa.consent.entity.*;
import com.depa.consent.exception.AuthenticationFailedException;
import com.depa.consent.repository.UserRepository;
import com.depa.consent.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthenticationService {

    private final UserRepository userRepository;
    private final OrganizationService organizationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuditService auditService;

    public AuthenticationService(UserRepository userRepository,
                                 OrganizationService organizationService,
                                 PasswordEncoder passwordEncoder,
                                 JwtUtil jwtUtil,
                                 AuditService auditService) {
        this.userRepository = userRepository;
        this.organizationService = organizationService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.auditService = auditService;
    }

    @Transactional(noRollbackFor = AuthenticationFailedException.class)
    public AuthResponse login(LoginRequest request) {
        String rawIdentifier = request.getEmail() != null ? request.getEmail().trim() : "";
        String normalizedEmail = rawIdentifier.toLowerCase();

        // Support login by email OR by student / identity roll number (e.g., S1001)
        User user = userRepository.findByEmail(normalizedEmail)
                .or(() -> userRepository.findByExternalIdentityId(rawIdentifier.toUpperCase()))
                .orElse(null);

        boolean passwordMatches = false;
        if (user != null) {
            passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
            // Fallback for student accounts whose default password is their UserId / Roll Number
            if (!passwordMatches && user.getExternalIdentityId() != null && request.getPassword().equals(user.getExternalIdentityId())) {
                passwordMatches = true;
            }
        }

        if (user == null || !passwordMatches) {
            auditService.logEvent(
                    AuditEventType.LOGIN_FAILURE,
                    user != null ? user.getUserId() : "UNKNOWN",
                    user != null ? user.getRole().name() : "ANONYMOUS",
                    "USER",
                    user != null ? user.getUserId() : null,
                    user != null ? user.getOrganizationId() : null,
                    "Failed login attempt for identifier: " + rawIdentifier
            );
            throw new AuthenticationFailedException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            auditService.logEvent(
                    AuditEventType.LOGIN_FAILURE,
                    user.getUserId(),
                    user.getRole().name(),
                    "USER",
                    user.getUserId(),
                    user.getOrganizationId(),
                    "Login denied: User account is " + user.getStatus()
            );
            throw new AuthenticationFailedException("User account is " + user.getStatus() + ". Login not permitted.");
        }

        if (!user.isEmailVerified()) {
            auditService.logEvent(
                    AuditEventType.LOGIN_FAILURE,
                    user.getUserId(),
                    user.getRole().name(),
                    "USER",
                    user.getUserId(),
                    user.getOrganizationId(),
                    "Login denied: Email is unverified"
            );
            throw new AuthenticationFailedException("Email is unverified. Please complete OTP verification.");
        }

        // For organization-scoped roles (ORG_ADMIN and USER), verify organization status
        if (user.getRole() == UserRole.ORG_ADMIN || user.getRole() == UserRole.USER) {
            if (user.getOrganizationId() == null) {
                throw new AuthenticationFailedException("User has no associated organization.");
            }
            Organization organization = organizationService.getOrganizationEntityById(user.getOrganizationId());
            if (organization.getStatus() != OrganizationStatus.ACTIVE) {
                auditService.logEvent(
                        AuditEventType.LOGIN_FAILURE,
                        user.getUserId(),
                        user.getRole().name(),
                        "ORGANIZATION",
                        organization.getOrganizationId(),
                        organization.getOrganizationId(),
                        "Login denied: Organization is " + organization.getStatus()
                );
                throw new AuthenticationFailedException(
                        "Organization '" + organization.getOrganizationCode() +
                                "' is " + organization.getStatus() + ". Login not permitted."
                );
            }
        }

        String token = jwtUtil.generateAuthToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole().name(),
                user.getOrganizationId(),
                user.getExternalIdentityId()
        );

        auditService.logEvent(
                AuditEventType.LOGIN_SUCCESS,
                user.getUserId(),
                user.getRole().name(),
                "USER",
                user.getUserId(),
                user.getOrganizationId(),
                "Successful login for user: " + user.getEmail()
        );

        return new AuthResponse(
                token,
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getOrganizationId(),
                user.getRole()
        );
    }
}
