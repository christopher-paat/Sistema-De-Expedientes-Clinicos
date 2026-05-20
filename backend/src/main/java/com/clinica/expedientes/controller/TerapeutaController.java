package com.clinica.expedientes.controller;

import com.clinica.expedientes.dto.response.PacienteResumenResponse;
import com.clinica.expedientes.dto.response.UsuarioResumenResponse;
import com.clinica.expedientes.service.AdministradorService;
import com.clinica.expedientes.service.TerapeutaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/terapeutas")
public class TerapeutaController {

    private final TerapeutaService terapeutaService;
    private final AdministradorService administradorService;

    public TerapeutaController(TerapeutaService terapeutaService, AdministradorService administradorService) {
        this.terapeutaService = terapeutaService;
        this.administradorService = administradorService;
    }

    // Admin: listar todos los terapeutas (debe ir antes de /mis-pacientes para evitar conflictos)
    @GetMapping
    public ResponseEntity<List<UsuarioResumenResponse>> getTerapeutas(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(administradorService.getTerapeutas(userId));
    }

    // CU-01: Visualizar pacientes asignados
    @GetMapping("/mis-pacientes")
    public ResponseEntity<List<PacienteResumenResponse>> getMisPacientes(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(terapeutaService.getMisPacientes(userId));
    }
}
