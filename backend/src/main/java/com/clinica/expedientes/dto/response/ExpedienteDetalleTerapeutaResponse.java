package com.clinica.expedientes.dto.response;

import java.time.OffsetDateTime;
import java.util.List;

public class ExpedienteDetalleTerapeutaResponse {
    private final Long idExpediente;
    private final String estado;
    private final OffsetDateTime fechaProxCita;
    private final PacienteDetalleDto paciente;
    private final EntrevistaResponse entrevistaSocioeconomica;
    private final ConsentimientoResponse informeConsentimiento;
    private final List<ReporteResumenDto> reportesSesion;

    public ExpedienteDetalleTerapeutaResponse(Long idExpediente, String estado, OffsetDateTime fechaProxCita,
                                               PacienteDetalleDto paciente,
                                               EntrevistaResponse entrevistaSocioeconomica,
                                               ConsentimientoResponse informeConsentimiento,
                                               List<ReporteResumenDto> reportesSesion) {
        this.idExpediente = idExpediente;
        this.estado = estado;
        this.fechaProxCita = fechaProxCita;
        this.paciente = paciente;
        this.entrevistaSocioeconomica = entrevistaSocioeconomica;
        this.informeConsentimiento = informeConsentimiento;
        this.reportesSesion = reportesSesion;
    }

    public Long getIdExpediente() { return idExpediente; }
    public String getEstado() { return estado; }
    public OffsetDateTime getFechaProxCita() { return fechaProxCita; }
    public PacienteDetalleDto getPaciente() { return paciente; }
    public EntrevistaResponse getEntrevistaSocioeconomica() { return entrevistaSocioeconomica; }
    public ConsentimientoResponse getInformeConsentimiento() { return informeConsentimiento; }
    public List<ReporteResumenDto> getReportesSesion() { return reportesSesion; }
}
