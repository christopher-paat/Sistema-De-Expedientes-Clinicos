package com.clinica.expedientes.dto.response;

public class ExpedientePendienteResponse {
    private final Long idExpediente;
    private final String nombrePaciente;
    private final boolean faltaEntrevista;
    private final boolean faltaConsentimiento;

    public ExpedientePendienteResponse(Long idExpediente, String nombrePaciente,
                                       boolean faltaEntrevista, boolean faltaConsentimiento) {
        this.idExpediente = idExpediente;
        this.nombrePaciente = nombrePaciente;
        this.faltaEntrevista = faltaEntrevista;
        this.faltaConsentimiento = faltaConsentimiento;
    }

    public Long getIdExpediente() { return idExpediente; }
    public String getNombrePaciente() { return nombrePaciente; }
    public boolean isFaltaEntrevista() { return faltaEntrevista; }
    public boolean isFaltaConsentimiento() { return faltaConsentimiento; }
}
