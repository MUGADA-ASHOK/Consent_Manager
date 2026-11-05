package com.depa.consent.controller;

import com.depa.consent.dto.BulkOnboardRequest;
import com.depa.consent.dto.BulkOnboardingResponse;
import com.depa.consent.service.OnboardingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @PostMapping("/bulk")
    public ResponseEntity<BulkOnboardingResponse> bulkOnboard(@Valid @RequestBody BulkOnboardRequest request) {
        BulkOnboardingResponse response = onboardingService.bulkOnboard(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/student")
    public ResponseEntity<?> onboardSingleStudent(@RequestBody java.util.Map<String, String> request) {
        String orgCode = request.getOrDefault("organizationCode", "COLLEGE_B");
        String studentId = request.get("studentId");
        String email = request.get("email");
        String name = request.getOrDefault("name", "Student " + studentId);

        if (studentId == null || studentId.isBlank() || email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "studentId and email are required"));
        }

        com.depa.consent.dto.StudentOnboardingItem item = new com.depa.consent.dto.StudentOnboardingItem(studentId.trim().toUpperCase(), email.trim().toLowerCase(), name);
        BulkOnboardRequest bulkReq = new BulkOnboardRequest(orgCode, java.util.List.of(item));
        onboardingService.bulkOnboard(bulkReq);

        return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", "Student onboarded successfully to Consent Manager DB",
                "studentId", studentId.trim().toUpperCase(),
                "email", email.trim().toLowerCase(),
                "defaultPassword", studentId.trim().toUpperCase(),
                "organizationCode", orgCode
        ));
    }
}
