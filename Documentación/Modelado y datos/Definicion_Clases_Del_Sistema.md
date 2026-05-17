## Definición de clases del sistema

### *Usuario*
+ idUsuario: Long
+ nombreCompleto: String

### Paciente (hereda de Usuario)
Posee **Expediente**
+ edad: int
+ fechaNacimiento: Date
+ correoElectronico: String
+ numeroTelefonico: String

### Terapeuta (hereda de Usuario)
Atiende a múltiples **Paciente** (relación N:M) y elabora **ReporteSesion**
+ pacientesAsignados: List\<Long\>
---
+ visualizarLista()
+ seleccionarExpediente()
+ editarExpediente()

### Supervisor (hereda de Usuario)
Supervisa a múltiples **Terapeuta** (relación N:M) y revisa **ReporteSesion**
+ terapeutasAsignados: List\<Long\>
---
+ aceptarReporte()
+ rechazarReporte()
+ reenviarReporte()
+ agregarNotaCorrectiva()
+ seleccionarReporte()

### Administrador (hereda de Usuario)
Registra **InformeConsentimiento** y **EntrevistaSocioEconomica**
---
+ anexarEntrevista()
+ anexarConsentimiento()
+ anexarExpediente()

### *Documento*
+ idDocumento: Long
+ fecha: Date
---
+ almacenar()

### Expediente
Pertenece a **Paciente** (relación 1:1). Asignado a **Terapeuta** (relación N:1).
Contiene **ReporteSesion**, **InformeConsentimiento** y **EntrevistaSocioEconomica**
+ idExpediente: Long
+ idPaciente: Long
+ idTerapeuta: Long
+ estado: String  // ACTIVO | ARCHIVADO
+ fechaProxCita: DateTime

### ReporteSesion (hereda de Documento)
+ idTerapeuta: Long
+ fechaSesion: Date
+ duracionSesion: Int
+ tipoSesion: String  // EVALUACION_INICIAL | SESION_TERAPEUTICA
+ observacionesClinicas: String
+ estado: String  // CREADO | PENDIENTE | APROBADO | RECHAZADO
+ comentariosTerapeuta: String
+ comentariosSupervisor: String
+ fechaCreacion: DateTime
+ fechaModificacion: DateTime

### InformeConsentimiento (hereda de Documento)
+ cuerpoDelTexto: String
+ acuerdoConfidencial: String

### EntrevistaSocioeconomica (hereda de Documento)
+ ingresoFamiliar: double
+ gastoAlimentacion: double
+ lugarProcedencia: String
+ vivienda: String
+ estadoSaludFamiliar: String

## Clases de la Capa Anti-Corrupción (ACL)

Estas clases pertenecen al ACL del módulo clínico. Actúan como intermediarias entre los sistemas externos (módulo de agenda) y el dominio interno. Ninguna clase del dominio ni del Service las conoce directamente — el ACL las encapsula.

### *UsuarioContexto* (value object inmutable)
Representa la identidad del usuario autenticado, extraída del JWT.
+ idUsuario: Long        // claim "sub" del JWT, parseado a Long
+ rol: RolEnum           // TERAPEUTA | SUPERVISOR | ADMINISTRADOR
+ nombreCompleto: String // claim "name" del JWT

### *RolEnum* (enumeración interna)
+ TERAPEUTA
+ SUPERVISOR
+ ADMINISTRADOR

### JwtContextAdapter
Extrae la identidad del usuario del token JWT emitido por el módulo de agenda.
---
+ extraerContexto(token: String): UsuarioContexto

### AgendaModuleClient
Cliente HTTP que llama a la API REST del módulo de agenda. Devuelve DTOs externos crudos.
---
+ getPaciente(idPacienteExterno: Long): ExternalPacienteDTO
+ getTerapeutaDeUsuario(userId: Long): ExternalTerapeutaDTO
+ getActivePacientes(therapistId: Long): List\<ExternalPacienteDTO\>

### *ExternalPacienteDTO* (value object)
Contrato con la API de la agenda. Si la agenda cambia su modelo, solo este DTO cambia.
+ id: Long
+ folio: String
+ fullName: String
+ phone: String
+ email: String
+ birthDate: LocalDate

### *ExternalTerapeutaDTO* (value object)
+ therapistId: Long   // therapists.id en la agenda
+ userId: Long        // therapists.user_id = users.id = claim "sub" del JWT
+ fullName: String

### PacienteTranslator
Convierte ExternalPacienteDTO → Paciente del dominio interno.
---
+ traducir(dto: ExternalPacienteDTO): Paciente

### TerapeutaTranslator
Convierte ExternalTerapeutaDTO → Terapeuta del dominio interno.
---
+ traducir(dto: ExternalTerapeutaDTO): Terapeuta

## Diagrama de relación de clases

![Diagrama](/Documentación/Diagramas/DCDS.jpg)
