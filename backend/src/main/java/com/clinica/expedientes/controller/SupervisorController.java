package com.clinica.expedientes.controller;

import com.clinica.expedientes.dto.response.ReportePendienteResponse;
import com.clinica.expedientes.dto.response.UsuarioResumenResponse;
import com.clinica.expedientes.service.AdministradorService;
import com.clinica.expedientes.service.SupervisorService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/supervisores")
public class SupervisorController {

    private final SupervisorService supervisorService;
    private final AdministradorService administradorService;

    public SupervisorController(SupervisorService supervisorService, AdministradorService administradorService) {
        this.supervisorService = supervisorService;
        this.administradorService = administradorService;
    }

    // Admin: listar todos los supervisores
    @GetMapping
    public ResponseEntity<List<UsuarioResumenResponse>> getSupervisores(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(administradorService.getSupervisores(userId));
    }

    // CU-06: Visualizar reportes pendientes de revisión
    @GetMapping("/mis-reportes-pendientes")
    public ResponseEntity<List<ReportePendienteResponse>> getMisReportesPendientes(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false) Long idTerapeuta,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        return ResponseEntity.ok(supervisorService.getMisReportesPendientes(userId, idTerapeuta,
                fechaDesde, fechaHasta));
    }
}
