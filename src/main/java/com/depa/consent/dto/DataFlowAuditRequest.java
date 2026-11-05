package com.depa.consent.dto;

import com.depa.consent.entity.AuditEventType;
import java.util.List;

public class DataFlowAuditRequest {
    private String grantId;
    private String dataPrincipalId;
    private AuditEventType eventType;
    private String organizationCode;
    private List<String> fields;
    private String details;

    public DataFlowAuditRequest() {}

    public DataFlowAuditRequest(String grantId, String dataPrincipalId, AuditEventType eventType,
                                String organizationCode, List<String> fields, String details) {
        this.grantId = grantId;
        this.dataPrincipalId = dataPrincipalId;
        this.eventType = eventType;
        this.organizationCode = organizationCode;
        this.fields = fields;
        this.details = details;
    }

    public String getGrantId() { return grantId; }
    public void setGrantId(String grantId) { this.grantId = grantId; }

    public String getDataPrincipalId() { return dataPrincipalId; }
    public void setDataPrincipalId(String dataPrincipalId) { this.dataPrincipalId = dataPrincipalId; }

    public AuditEventType getEventType() { return eventType; }
    public void setEventType(AuditEventType eventType) { this.eventType = eventType; }

    public String getOrganizationCode() { return organizationCode; }
    public void setOrganizationCode(String organizationCode) { this.organizationCode = organizationCode; }

    public List<String> getFields() { return fields; }
    public void setFields(List<String> fields) { this.fields = fields; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
