package com.clinica.expedientes.service;

import com.clinica.expedientes.dto.request.*;
import com.clinica.expedientes.dto.response.*;
import com.clinica.expedientes.exception.AccesoDenegadoException;
import com.clinica.expedientes.exception.ConflictoException;
import com.clinica.expedientes.exception.RecursoNoEncontradoException;
import com.clinica.expedientes.model.*;
import com.clinica.expedientes.model.enums.*;
import com.clinica.expedientes.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdministradorService {

    private final UsuarioRepository usuarioRepo;
    private final PacienteRepository pacienteRepo;
    private final TerapeutaRepository terapeutaRepo;
    private final SupervisorRepository supervisorRepo;
    private final ExpedienteRepository expedienteRepo;
    private final EntrevistaSocioeconomicaRepository entrevistaRepo;
    private final InformeConsentimientoRepository consentimientoRepo;
    private final AuditoriaService auditoriaService;

    public AdministradorService(UsuarioRepository usuarioRepo, PacienteRepository pacienteRepo,
                                 TerapeutaRepository terapeutaRepo, SupervisorRepository supervisorRepo,
                                 ExpedienteRepository expedienteRepo,
                                 EntrevistaSocioeconomicaRepository entrevistaRepo,
                                 InformeConsentimientoRepository consentimientoRepo,
                                 AuditoriaService auditoriaService) {
        this.usuarioRepo = usuarioRepo;
        this.pacienteRepo = pacienteRepo;
        this.terapeutaRepo = terapeutaRepo;
        this.supervisorRepo = supervisorRepo;
        this.expedienteRepo = expedienteRepo;
        this.entrevistaRepo = entrevistaRepo;
        this.consentimientoRepo = consentimientoRepo;
        this.auditoriaService = auditoriaService;
    }

    private void resolverAdministrador(Long userId) {
        Usuario u = usuarioRepo.findById(userId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado: " + userId));
        if (!(u instanceof Administrador)) {
            throw new AccesoDenegadoException("El usuario no tiene rol ADMINISTRADOR.");
        }
    }

    public List<ExpedientePendienteResponse> getExpedientesPendientes(Long userId) {
        resolverAdministrador(userId);

        List<ExpedientePendienteResponse> resultado = expedienteRepo.findAllConDocumentos().stream()
                .map(e -> new ExpedientePendienteResponse(
                        e.getIdExpediente(),
                        e.getPaciente().getNombreCompleto(),
                        e.getEntrevistaSocioeconomica() == null,
                        e.getInformeConsentimiento() == null))
                .collect(Collectors.toList());

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR,
                AccionAuditoria.CONSULTAR_TODOS_EXPEDIENTES,
                "Expediente", null, ResultadoAuditoria.PERMITIDO);

        return resultado;
    }

    @Transactional(readOnly = true)
    public ExpedienteAdminDetalleResponse getExpedienteDetalleAdmin(Long userId, Long idExpediente) {
        resolverAdministrador(userId);

        Expediente exp = expedienteRepo.findById(idExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Expediente no encontrado: " + idExpediente));

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR, AccionAuditoria.CONSULTAR_TODOS_EXPEDIENTES,
                "Expediente", String.valueOf(idExpediente), ResultadoAuditoria.PERMITIDO);

        EntrevistaResponse entrevista = null;
        if (exp.getEntrevistaSocioeconomica() != null) {
            EntrevistaSocioeconomica e = exp.getEntrevistaSocioeconomica();
            entrevista = new EntrevistaResponse(e.getIdDocumento(), idExpediente, e.getFecha(),
                    e.getIngresoFamiliar(), e.getGastoAlimentacion(),
                    e.getLugarProcedencia(), e.getVivienda(), e.getEstadoSaludFamiliar());
        }

        ConsentimientoResponse consentimiento = null;
        if (exp.getInformeConsentimiento() != null) {
            InformeConsentimiento c = exp.getInformeConsentimiento();
            consentimiento = new ConsentimientoResponse(c.getIdDocumento(), idExpediente, c.getFecha(),
                    c.getCuerpoDelTexto(), c.getAcuerdoConfidencial());
        }

        return new ExpedienteAdminDetalleResponse(exp.getIdExpediente(), exp.getEstado().name(),
                exp.getFechaProxCita(), exp.getPaciente().getNombreCompleto(), entrevista, consentimiento);
    }

    @Transactional
    public EntrevistaResponse actualizarEntrevista(Long userId, Long idExpediente,
                                                    RegistrarEntrevistaRequest req) {
        resolverAdministrador(userId);

        Expediente exp = expedienteRepo.findById(idExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Expediente no encontrado: " + idExpediente));

        EntrevistaSocioeconomica entrevista = exp.getEntrevistaSocioeconomica();
        if (entrevista == null)
            throw new RecursoNoEncontradoException("No existe entrevista para el expediente: " + idExpediente);

        entrevista.setIngresoFamiliar(req.getIngresoFamiliar());
        entrevista.setGastoAlimentacion(req.getGastoAlimentacion());
        entrevista.setLugarProcedencia(req.getLugarProcedencia());
        entrevista.setVivienda(req.getVivienda());
        entrevista.setEstadoSaludFamiliar(req.getEstadoSaludFamiliar());

        EntrevistaSocioeconomica saved = entrevistaRepo.save(entrevista);

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR, AccionAuditoria.REGISTRAR_ENTREVISTA,
                "EntrevistaSocioeconomica", String.valueOf(saved.getIdDocumento()), ResultadoAuditoria.PERMITIDO);

        return new EntrevistaResponse(saved.getIdDocumento(), idExpediente, saved.getFecha(),
                saved.getIngresoFamiliar(), saved.getGastoAlimentacion(),
                saved.getLugarProcedencia(), saved.getVivienda(), saved.getEstadoSaludFamiliar());
    }

    @Transactional
    public ConsentimientoResponse actualizarConsentimiento(Long userId, Long idExpediente,
                                                            RegistrarConsentimientoRequest req) {
        resolverAdministrador(userId);

        Expediente exp = expedienteRepo.findById(idExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Expediente no encontrado: " + idExpediente));

        InformeConsentimiento consentimiento = exp.getInformeConsentimiento();
        if (consentimiento == null)
            throw new RecursoNoEncontradoException("No existe consentimiento para el expediente: " + idExpediente);

        consentimiento.setCuerpoDelTexto(req.getCuerpoDelTexto());
        consentimiento.setAcuerdoConfidencial(req.getAcuerdoConfidencial());

        InformeConsentimiento saved = consentimientoRepo.save(consentimiento);

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR, AccionAuditoria.REGISTRAR_CONSENTIMIENTO,
                "InformeConsentimiento", String.valueOf(saved.getIdDocumento()), ResultadoAuditoria.PERMITIDO);

        return new ConsentimientoResponse(saved.getIdDocumento(), idExpediente, saved.getFecha(),
                saved.getCuerpoDelTexto(), saved.getAcuerdoConfidencial());
    }

    public List<ExpedientePendienteResponse> getTodosExpedientes(Long userId) {
        resolverAdministrador(userId);

        List<ExpedientePendienteResponse> resultado = expedienteRepo.findAllConDocumentos().stream()
                .map(e -> new ExpedientePendienteResponse(
                        e.getIdExpediente(),
                        e.getPaciente().getNombreCompleto(),
                        e.getEntrevistaSocioeconomica() == null,
                        e.getInformeConsentimiento() == null))
                .collect(Collectors.toList());

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR,
                AccionAuditoria.CONSULTAR_EXPEDIENTE,
                "Expediente", null, ResultadoAuditoria.PERMITIDO);

        return resultado;
    }

    public List<UsuarioResumenResponse> getTerapeutas(Long userId) {
        resolverAdministrador(userId);

        List<UsuarioResumenResponse> resultado = terapeutaRepo.findAll().stream()
                .map(t -> new UsuarioResumenResponse(t.getIdUsuario(), t.getNombreCompleto()))
                .collect(Collectors.toList());

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR,
                AccionAuditoria.CONSULTAR_TERAPEUTAS,
                "Terapeuta", null, ResultadoAuditoria.PERMITIDO);

        return resultado;
    }

    public List<UsuarioResumenResponse> getSupervisores(Long userId) {
        resolverAdministrador(userId);

        List<UsuarioResumenResponse> resultado = supervisorRepo.findAll().stream()
                .map(s -> new UsuarioResumenResponse(s.getIdUsuario(), s.getNombreCompleto()))
                .collect(Collectors.toList());

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR,
                AccionAuditoria.CONSULTAR_SUPERVISORES,
                "Supervisor", null, ResultadoAuditoria.PERMITIDO);

        return resultado;
    }

    @Transactional
    public ExpedienteCreadoResponse crearExpediente(Long userId, CrearExpedienteRequest req) {
        resolverAdministrador(userId);

        Paciente paciente = pacienteRepo.findById(req.getIdPaciente())
                .orElseThrow(() -> new RecursoNoEncontradoException("Paciente no encontrado: " + req.getIdPaciente()));

        Terapeuta terapeuta = terapeutaRepo.findById(req.getIdTerapeuta())
                .orElseThrow(() -> new RecursoNoEncontradoException("Terapeuta no encontrado: " + req.getIdTerapeuta()));

        if (expedienteRepo.existsByPaciente(paciente)) {
            throw new ConflictoException("El paciente ya tiene un expediente clínico registrado.");
        }

        Expediente exp = new Expediente();
        exp.setPaciente(paciente);
        exp.setTerapeuta(terapeuta);
        exp.setEstado(EstadoExpediente.ACTIVO);
        exp.setFechaProxCita(req.getFechaProxCita());

        Expediente saved = expedienteRepo.save(exp);

        return new ExpedienteCreadoResponse(
                saved.getIdExpediente(),
                paciente.getIdUsuario(),
                terapeuta.getIdUsuario(),
                saved.getEstado().name(),
                saved.getFechaProxCita()
        );
    }

    @Transactional
    public ExpedienteEstadoResponse cambiarEstado(Long userId, Long idExpediente,
                                                   CambiarEstadoExpedienteRequest req) {
        resolverAdministrador(userId);

        Expediente exp = expedienteRepo.findById(idExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Expediente no encontrado: " + idExpediente));

        EstadoExpediente nuevoEstado;
        try {
            nuevoEstado = EstadoExpediente.valueOf(req.getEstado().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Estado inválido: " + req.getEstado() +
                    ". Valores válidos: ACTIVO, ARCHIVADO");
        }

        exp.setEstado(nuevoEstado);
        expedienteRepo.save(exp);

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR, AccionAuditoria.CAMBIAR_ESTADO_EXPEDIENTE,
                "Expediente", String.valueOf(idExpediente), ResultadoAuditoria.PERMITIDO);

        return new ExpedienteEstadoResponse(exp.getIdExpediente(), exp.getEstado().name());
    }

    @Transactional
    public EntrevistaResponse registrarEntrevista(Long userId, Long idExpediente,
                                                   RegistrarEntrevistaRequest req) {
        resolverAdministrador(userId);

        Expediente exp = expedienteRepo.findById(idExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Expediente no encontrado: " + idExpediente));

        EntrevistaSocioeconomica entrevista = new EntrevistaSocioeconomica();
        entrevista.setExpediente(exp);
        entrevista.setFecha(LocalDate.now());
        entrevista.setIngresoFamiliar(req.getIngresoFamiliar());
        entrevista.setGastoAlimentacion(req.getGastoAlimentacion());
        entrevista.setLugarProcedencia(req.getLugarProcedencia());
        entrevista.setVivienda(req.getVivienda());
        entrevista.setEstadoSaludFamiliar(req.getEstadoSaludFamiliar());

        EntrevistaSocioeconomica saved = entrevistaRepo.save(entrevista);

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR, AccionAuditoria.REGISTRAR_ENTREVISTA,
                "EntrevistaSocioeconomica", String.valueOf(saved.getIdDocumento()), ResultadoAuditoria.PERMITIDO);

        return new EntrevistaResponse(
                saved.getIdDocumento(), idExpediente, saved.getFecha(),
                saved.getIngresoFamiliar(), saved.getGastoAlimentacion(),
                saved.getLugarProcedencia(), saved.getVivienda(), saved.getEstadoSaludFamiliar()
        );
    }

    @Transactional
    public ConsentimientoResponse registrarConsentimiento(Long userId, Long idExpediente,
                                                           RegistrarConsentimientoRequest req) {
        resolverAdministrador(userId);

        Expediente exp = expedienteRepo.findById(idExpediente)
                .orElseThrow(() -> new RecursoNoEncontradoException("Expediente no encontrado: " + idExpediente));

        InformeConsentimiento consentimiento = new InformeConsentimiento();
        consentimiento.setExpediente(exp);
        consentimiento.setFecha(LocalDate.now());
        consentimiento.setCuerpoDelTexto(req.getCuerpoDelTexto());
        consentimiento.setAcuerdoConfidencial(req.getAcuerdoConfidencial());

        InformeConsentimiento saved = consentimientoRepo.save(consentimiento);

        auditoriaService.registrar(userId, RolUsuario.ADMINISTRADOR, AccionAuditoria.REGISTRAR_CONSENTIMIENTO,
                "InformeConsentimiento", String.valueOf(saved.getIdDocumento()), ResultadoAuditoria.PERMITIDO);

        return new ConsentimientoResponse(
                saved.getIdDocumento(), idExpediente, saved.getFecha(),
                saved.getCuerpoDelTexto(), saved.getAcuerdoConfidencial()
        );
    }
}
