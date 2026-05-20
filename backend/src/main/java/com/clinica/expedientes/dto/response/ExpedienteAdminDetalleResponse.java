package com.clinica.expedientes.dto.response;

import java.time.OffsetDateTime;

public class ExpedienteAdminDetalleResponse {
    private final Long idExpediente;
    private final String estado;
    private final OffsetDateTime fechaProxCita;
    private final String nombrePaciente;
    private final EntrevistaResponse entrevistaSocioeconomica;
    private final ConsentimientoResponse informeConsentimiento;

    public ExpedienteAdminDetalleResponse(Long idExpediente, String estado, OffsetDateTime fechaProxCita,
                                           String nombrePaciente,
                                           EntrevistaResponse entrevistaSocioeconomica,
                                           ConsentimientoResponse informeConsentimiento) {
        this.idExpediente = idExpediente;
        this.estado = estado;
        this.fechaProxCita = fechaProxCita;
        this.nombrePaciente = nombrePaciente;
        this.entrevistaSocioeconomica = entrevistaSocioeconomica;
        this.informeConsentimiento = informeConsentimiento;
    }

    public Long getIdExpediente() { return idExpediente; }
    public String getEstado() { return estado; }
    public OffsetDateTime getFechaProxCita() { return fechaProxCita; }
    public String getNombrePaciente() { return nombrePaciente; }
    public EntrevistaResponse getEntrevistaSocioeconomica() { return entrevistaSocioeconomica; }
    public ConsentimientoResponse getInformeConsentimiento() { return informeConsentimiento; }
}
