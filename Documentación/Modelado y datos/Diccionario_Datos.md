# Diccionario de datos

### Usuario
Entidad base del sistema de herencia. La identidad del usuario (autenticación) es gestionada por el módulo de agenda. Este módulo clínico recibe la identidad a través del JWT emitido por la agenda y no almacena contraseñas ni datos de autenticación propios.

| Nombre        | Tipo de dato  | Descripción   | Restricciones |
| ------------- |:-------------:| ------------- |:-------------:|
| idUsuario     | Long          | ID del usuario. Corresponde al `users.id` del módulo de agenda (extraído del claim `sub` del JWT) | Único. 19 dígitos máximos. Debe existir |
| nombreCompleto| String        | Primer nombre, segundo nombre (si tiene), apellido paterno y apellido materno del usuario | Solo letras, máximo 100 caracteres y Debe existir |

### Paciente
Hereda de: Usuario
| Nombre              | Tipo de dato  | Descripción   | Restricciones |
| ------------------- |:-------------:| ------------- |:-------------:|
| edad                | int           | Edad del paciente en el momento | Edad no menor a 1 ni mayor a 120 y Debe existir |
| fechaNacimiento     | Date          | Fecha de nacimiento del paciente | Fecha no menor a 1910 ni mayor a la fecha actual |
| correoElectronico   | String        | Correo electrónico del paciente o tutor | Único. Máximo 100 caracteres y formato correo válido (usuario@dominio.com) |
| numeroTelefonico    | String        | Número telefónico del paciente o tutor | Único. Solo dígitos, 20 máximos y Debe existir |

### Terapeuta
Hereda de: Usuario

Relación N:M con Paciente mediante tabla de asociación `terapeuta_paciente`

*Sin atributos propios adicionales*

### terapeuta_paciente
Proyección local de asignaciones activas. Es alimentada y mantenida por el ACL a partir de los datos del módulo de agenda. No es gestionada manualmente por ningún actor del módulo clínico.

| Nombre          | Tipo de dato  | Descripción                                          | Restricciones                      |
| --------------- |:-------------:| ---------------------------------------------------- |:----------------------------------:|
| idTerapeuta     | Long          | ID del terapeuta (coincide con `users.id` en agenda) | FK hacia Terapeuta. NOT NULL       |
| idPaciente      | Long          | ID del paciente (coincide con `patients.id` en agenda)| FK hacia Paciente. NOT NULL        |
| sincronizadoAt  | Timestamp     | Fecha y hora de la última sincronización desde agenda | NOT NULL                           |

*Clave primaria compuesta: (idTerapeuta, idPaciente)*

> **Nota:** Esta tabla es la fuente de verdad para las validaciones ABAC (RNF-02, RNF-03). El ACL la actualiza al recibir webhooks del módulo de agenda o al sincronizar en el primer login del terapeuta.

### Supervisor
Hereda de: Usuario

Relación N:M con Terapeuta mediante tabla de asociación `supervisor_terapeuta`

*Sin atributos propios adicionales*

### supervisor_terapeuta
Tabla de asociación entre Supervisor y Terapeuta

| Nombre       | Tipo de dato  | Descripción                    | Restricciones                      |
| ------------ |:-------------:| ------------------------------ |:----------------------------------:|
| idSupervisor | Long          | Referencia al supervisor       | FK hacia Supervisor. NOT NULL      |
| idTerapeuta  | Long          | Referencia al terapeuta        | FK hacia Terapeuta. NOT NULL       |

*Clave primaria compuesta: (idSupervisor, idTerapeuta)*

### Administrador
Hereda de: Usuario

*Sin atributos propios adicionales*

### Documento
| Nombre      | Tipo de dato  | Descripción   | Restricciones |
| ----------- |:-------------:| ------------- |:-------------:|
| idDocumento | Long          | Número único de identificación por documento | Único. 19 dígitos máximos y Debe existir |
| fecha       | Date          | Fecha de última modificación | Fecha no mayor a la fecha actual y Debe existir |

### Expediente
Entidad independiente. Se asocia con Paciente (1:1) y con Terapeuta (N:1).

| Nombre        | Tipo de dato  | Descripción   | Restricciones |
| ------------- |:-------------:| ------------- |:-------------:|
| idExpediente  | Long          | Número único de identificación del expediente | Único. 19 dígitos máximos y Debe existir |
| idPaciente    | Long          | Referencia al paciente al que pertenece el expediente | FK hacia Paciente. Único. NOT NULL |
| idTerapeuta   | Long          | Referencia al terapeuta asignado al expediente | FK hacia Terapeuta. NOT NULL |
| estado        | ENUM          | Estado actual del expediente | Valores: `ACTIVO`, `ARCHIVADO`. Valor por defecto: `ACTIVO`. NOT NULL |
| fechaProxCita | DateTime      | Fecha de la próxima cita entre paciente y terapeuta | Fecha no menor a la fecha actual |

### ReporteSesion
Hereda de: Documento

| Nombre                | Tipo de dato  | Descripción   | Restricciones |
| --------------------- |:-------------:| ------------- |:-------------:|
| idTerapeuta           | Long          | Referencia al terapeuta que elaboró el reporte | FK hacia Terapeuta. NOT NULL |
| fechaSesion           | Date          | Fecha en que se realizó la sesión clínica | NOT NULL |
| duracionSesion        | Int           | Tiempo total que duró la sesión en minutos | Mayor a cero |
| tipoSesion            | ENUM          | Tipo de sesión clínica realizada | Valores: `EVALUACION_INICIAL`, `SESION_TERAPEUTICA`. NOT NULL |
| observacionesClinicas | String        | Notas clínicas del terapeuta correspondientes a la sesión | NOT NULL |
| estado                | ENUM          | Estado del reporte en su ciclo de vida | Valores: `CREADO`, `PENDIENTE`, `APROBADO`, `RECHAZADO`. NOT NULL |
| comentariosTerapeuta  | String        | Notas adicionales del terapeuta sobre la sesión | Opcional |
| comentariosSupervisor | String        | Comentarios del supervisor al rechazar el reporte | Opcional |
| fechaCreacion         | DateTime      | Fecha y hora de creación del reporte | NOT NULL |
| fechaModificacion     | DateTime      | Fecha y hora de última modificación del reporte | NOT NULL |

### InformeConsentimiento
Hereda de: Documento

| Nombre              | Tipo de dato  | Descripción   | Restricciones |
| ------------------- |:-------------:| ------------- |:-------------:|
| cuerpoDelTexto      | String        | Texto legal completo que indica al paciente los acuerdos que deberá aceptar para recibir tratamiento | NOT NULL |
| acuerdoConfidencial | String        | Texto que contiene el deber ético y la obligación legal del personal de proteger la información privada del paciente | NOT NULL |

### EntrevistaSocioeconomica
Hereda de: Documento

| Nombre              | Tipo de dato  | Descripción   | Restricciones |
| ------------------- |:-------------:| ------------- |:-------------:|
| ingresoFamiliar     | Decimal       | Suma de ingresos de cada integrante de la familia | Valor no menor a 0 y Debe existir |
| gastoAlimentacion   | Decimal       | Parte del ingreso familiar destinado a la comida | Valor no menor a 0 y Debe existir |
| lugarProcedencia    | String        | Área geográfica de residencia del paciente | Máximo 100 caracteres y Debe existir |
| vivienda            | String        | Lugar físico donde habita el paciente y su familia, incluyendo características físicas | Máximo 1000 caracteres |
| estadoSaludFamiliar | String        | Número de enfermos crónicos en la familia al momento de la evaluación | Valor no mayor a 50 y Debe existir |
