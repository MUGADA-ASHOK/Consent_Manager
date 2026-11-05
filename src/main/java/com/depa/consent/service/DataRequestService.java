package com.depa.consent.service;

import com.depa.consent.dto.CreateDataRequest;
import com.depa.consent.dto.DataRequestResponse;
import com.depa.consent.entity.*;
import com.depa.consent.exception.ForbiddenOperationException;
import com.depa.consent.exception.InvalidLifecycleTransitionException;
import com.depa.consent.exception.ResourceNotFoundException;
import com.depa.consent.repository.DataRequestRepository;
import com.depa.consent.repository.UserRepository;
import com.depa.consent.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class DataRequestService {

    private final DataRequestRepository dataRequestRepository;
    private final OrganizationService organizationService;
    private final ConsentService consentService;
    private final AuditService auditService;
    private final UserRepository userRepository;

    public DataRequestService(DataRequestRepository dataRequestRepository,
                              OrganizationService organizationService,
                              ConsentService consentService,
                              AuditService auditService,
                              UserRepository userRepository) {
        this.dataRequestRepository = dataRequestRepository;
        this.organizationService = organizationService;
        this.consentService = consentService;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    public DataRequestResponse createDataRequest(CreateDataRequest request, UserPrincipal actor) {
        if (actor == null || actor.getOrganizationId() == null || actor.getOrganizationId().isBlank()) {
            throw new ForbiddenOperationException("Access Denied: Authenticated user has no organization scope");
        }

        // 1. Resolve & Validate Requester Organization from CM JWT (never trusted from request body)
        Organization requesterOrg = organizationService.getOrganizationEntityById(actor.getOrganizationId());
        if (requesterOrg.getStatus() != OrganizationStatus.ACTIVE) {
            throw new InvalidLifecycleTransitionException(
                    "Requester organization '" + requesterOrg.getOrganizationCode() + "' is " +
                            requesterOrg.getStatus() + ". Only ACTIVE organizations can initiate data requests."
            );
        }

        // 2. Resolve & Validate Provider Organization (by ID or Code)
        Organization providerOrg = organizationService.getOrganizationEntityByIdOrCode(request.getProviderOrganizationId());

        if (providerOrg.getStatus() != OrganizationStatus.ACTIVE) {
            throw new InvalidLifecycleTransitionException(
                    "Provider organization '" + providerOrg.getOrganizationCode() + "' is " +
                            providerOrg.getStatus() + ". Data cannot be requested from inactive organizations."
            );
        }

        if (requesterOrg.getOrganizationId().equals(providerOrg.getOrganizationId()) ||
            requesterOrg.getOrganizationCode().equalsIgnoreCase(providerOrg.getOrganizationCode())) {
            throw new IllegalArgumentException(
                    String.format("Self-Request Prohibited: Requester organization '%s' and provider organization cannot be the same entity.",
                            requesterOrg.getOrganizationCode())
            );
        }

        String dataPrincipalId = request.getDataPrincipalId().trim().toUpperCase();

        // 3. Strong Validation: An organization cannot request or consume data belonging to its own student
        boolean studentBelongsToRequester = userRepository.existsByOrganizationIdAndExternalIdentityId(
                requesterOrg.getOrganizationId(), dataPrincipalId
        );

        if (studentBelongsToRequester) {
            throw new ForbiddenOperationException(
                    String.format("Self-Consumption Prohibited: Organization '%s' cannot request or consume academic records for student '%s' because this student is registered under / belongs to '%s'. Internal institutional records must not be routed via external DEPA consent mechanisms.",
                            requesterOrg.getOrganizationCode(), dataPrincipalId, requesterOrg.getOrganizationCode())
            );
        }

        // 4. Validate that the student actually belongs to the target Provider organization
        java.util.Optional<User> studentUserOpt = userRepository.findByExternalIdentityId(dataPrincipalId);
        if (studentUserOpt.isPresent()) {
            User studentUser = studentUserOpt.get();
            if (studentUser.getOrganizationId() != null && !studentUser.getOrganizationId().equals(providerOrg.getOrganizationId())) {
                Organization studentActualHome = organizationService.getOrganizationEntityById(studentUser.getOrganizationId());
                throw new IllegalArgumentException(
                        String.format("Institutional Boundary Mismatch: Student '%s' is registered under custodian organization '%s', not '%s'. Requests for this student must be directed to '%s'.",
                                dataPrincipalId, studentActualHome.getOrganizationCode(), providerOrg.getOrganizationCode(), studentActualHome.getOrganizationCode())
                );
            }
        }

        String requestId = "DREQ_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Instant expiresAt = Instant.now().plus(7, ChronoUnit.DAYS);

        DataRequest dataRequest = new DataRequest(
                requestId,
                requesterOrg.getOrganizationId(),
                actor.getUserId(),
                providerOrg.getOrganizationId(),
                dataPrincipalId,
                request.getPurpose().trim(),
                request.getRequestedFields(),
                DataRequestStatus.PENDING,
                expiresAt
        );

        DataRequest saved = dataRequestRepository.save(dataRequest);

        // 3. Automatically generate ConsentRequest for Data Principal
        consentService.createConsentRequest(saved);

        auditService.logEvent(
                AuditEventType.DATA_REQUEST_CREATED,
                actor.getUserId(),
                actor.getRole().name(),
                "DATA_REQUEST",
                saved.getId(),
                requesterOrg.getOrganizationId(),
                String.format("Data request created: Principal=%s, Provider=%s, Requester=%s, Fields=%s",
                        dataPrincipalId, providerOrg.getOrganizationCode(), requesterOrg.getOrganizationCode(), request.getRequestedFields())
        );

        return new DataRequestResponse(saved, requesterOrg.getOrganizationCode(), providerOrg.getOrganizationCode());
    }

    @Transactional(readOnly = true)
    public DataRequestResponse getDataRequestById(String id, UserPrincipal actor) {
        DataRequest request = dataRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data request not found with ID: " + id));

        // Enforce boundary: Super admin / Admin or users from requester / provider orgs can view
        if (actor.getRole() != UserRole.SUPER_ADMIN && actor.getRole() != UserRole.ADMIN) {
            if (!actor.getOrganizationId().equals(request.getRequesterOrganizationId()) &&
                !actor.getOrganizationId().equals(request.getProviderOrganizationId())) {
                throw new ForbiddenOperationException("Access Denied: You do not have permission to view this data request");
            }
        }

        Organization requesterOrg = organizationService.getOrganizationEntityById(request.getRequesterOrganizationId());
        Organization providerOrg = organizationService.getOrganizationEntityById(request.getProviderOrganizationId());

        return new DataRequestResponse(request, requesterOrg.getOrganizationCode(), providerOrg.getOrganizationCode());
    }

    @Transactional(readOnly = true)
    public List<DataRequestResponse> getOutgoingDataRequests(UserPrincipal actor) {
        if (actor == null || actor.getOrganizationId() == null) {
            throw new ForbiddenOperationException("Access Denied: No organization scope");
        }

        Organization requesterOrg = organizationService.getOrganizationEntityById(actor.getOrganizationId());
        List<DataRequest> requests = dataRequestRepository.findByRequesterOrganizationId(actor.getOrganizationId());

        return requests.stream()
                .map(req -> {
                    Organization prov = organizationService.getOrganizationEntityById(req.getProviderOrganizationId());
                    return new DataRequestResponse(req, requesterOrg.getOrganizationCode(), prov.getOrganizationCode());
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DataRequest getEntityById(String id) {
        return dataRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data request not found with ID: " + id));
    }
}
