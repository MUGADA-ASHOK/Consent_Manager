package com.depa.consent.config;

import com.depa.consent.entity.*;
import com.depa.consent.repository.OrganizationRepository;
import com.depa.consent.repository.UserRepository;
import com.depa.consent.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(2)
public class BootstrapSuperAdminRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapSuperAdminRunner.class);

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Value("${app.bootstrap.super-admin.email:superadmin@depa.cm}")
    private String superAdminEmail;

    @Value("${app.bootstrap.super-admin.password:SuperAdmin@123}")
    private String superAdminPassword;

    public BootstrapSuperAdminRunner(UserRepository userRepository,
                                     OrganizationRepository organizationRepository,
                                     PasswordEncoder passwordEncoder,
                                     AuditService auditService) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Override
    public void run(String... args) {
        // 1. Bootstrap SUPER_ADMIN
        if (!userRepository.existsByRole(UserRole.SUPER_ADMIN)) {
            String normalizedEmail = superAdminEmail.trim().toLowerCase();
            User superAdmin = new User(
                    "SUPER_ADMIN_001",
                    "Consent Manager Super Admin",
                    normalizedEmail,
                    passwordEncoder.encode(superAdminPassword),
                    null,
                    null,
                    UserRole.SUPER_ADMIN,
                    UserStatus.ACTIVE,
                    true
            );

            userRepository.save(superAdmin);
            auditService.logEvent(
                    AuditEventType.SUPER_ADMIN_BOOTSTRAPPED,
                    superAdmin.getUserId(),
                    UserRole.SUPER_ADMIN.name(),
                    "USER",
                    superAdmin.getUserId(),
                    null,
                    "Initial SUPER_ADMIN account bootstrapped securely"
            );

            log.info("Initialized default SUPER_ADMIN account: {}", normalizedEmail);
        }

        // 2. Bootstrap College A Organization
        Organization collegeA = organizationRepository.findByOrganizationCode("COLLEGE_A")
                .orElseGet(() -> {
                    Organization org = new Organization(
                            "ORG_COLLEGE_A",
                            "COLLEGE_A",
                            "College A University",
                            "admin@collegea.edu",
                            "http://localhost:8081/api/auth/login",
                            "http://localhost:8081/api/provider/onboarding/eligible-students",
                            OrganizationStatus.ACTIVE
                    );
                    log.info("Bootstrapping default Organization: COLLEGE_A");
                    return organizationRepository.save(org);
                });

        // 3. Bootstrap College B Organization
        Organization collegeB = organizationRepository.findByOrganizationCode("COLLEGE_B")
                .orElseGet(() -> {
                    Organization org = new Organization(
                            "ORG_COLLEGE_B",
                            "COLLEGE_B",
                            "College B Institute",
                            "admin@collegeb.edu",
                            null,
                            null,
                            OrganizationStatus.ACTIVE
                    );
                    log.info("Bootstrapping default Organization: COLLEGE_B");
                    return organizationRepository.save(org);
                });

        // 4. Bootstrap Sample Student: Ashok Mugada (S1001)
        if (!userRepository.existsByEmail("student1001@example.com")) {
            User student = new User(
                    "USR_S1001",
                    "Ashok Mugada",
                    "student1001@example.com",
                    passwordEncoder.encode("Password@123"),
                    collegeA.getOrganizationId(),
                    "S1001",
                    UserRole.USER,
                    UserStatus.ACTIVE,
                    true
            );
            userRepository.save(student);
            log.info("Bootstrapped student principal: student1001@example.com (S1001) linked to COLLEGE_A");
        }

        // 5. Bootstrap Org Admins for College A and College B
        if (!userRepository.existsByEmail("admin@collegea.edu")) {
            User orgAdminA = new User(
                    "USR_ORG_ADM_A",
                    "College A Administrator",
                    "admin@collegea.edu",
                    passwordEncoder.encode("OrgAdmin@123"),
                    collegeA.getOrganizationId(),
                    null,
                    UserRole.ORG_ADMIN,
                    UserStatus.ACTIVE,
                    true
            );
            userRepository.save(orgAdminA);
            log.info("Bootstrapped Org Admin: admin@collegea.edu for COLLEGE_A");
        }

        if (!userRepository.existsByEmail("admin@collegeb.edu")) {
            User orgAdminB = new User(
                    "USR_ORG_ADM_B",
                    "College B Administrator",
                    "admin@collegeb.edu",
                    passwordEncoder.encode("OrgAdmin@123"),
                    collegeB.getOrganizationId(),
                    null,
                    UserRole.ORG_ADMIN,
                    UserStatus.ACTIVE,
                    true
            );
            userRepository.save(orgAdminB);
            log.info("Bootstrapped Org Admin: admin@collegeb.edu for COLLEGE_B");
        }
    }
}
