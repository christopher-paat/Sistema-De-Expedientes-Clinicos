package com.clinica.expedientes.dto.response;

public class UsuarioResumenResponse {
    private final Long id;
    private final String nombreCompleto;

    public UsuarioResumenResponse(Long id, String nombreCompleto) {
        this.id = id;
        this.nombreCompleto = nombreCompleto;
    }

    public Long getId() { return id; }
    public String getNombreCompleto() { return nombreCompleto; }
}
