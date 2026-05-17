# Alcances y limitaciones

## Descripción del sistema 

El  proyecto consiste en un módulo para la gestión de expedientes clínicos en una clínica de psicología. Este módulo forma parte de un sistema más amplio y tiene como finalidad digitalizar el manejo de expedientes de pacientes, los cuales son administrados actualmente de manera física.
El sistema permitirá consultar y gestionar la información relacionada con los pacientes y sus expedientes clínicos, facilitando el acceso a la información por parte del personal autorizado y agilizando los procesos dentro de la clínica.

## Objetivo del sistema

El objetivo del sistema es digitalizar la gestión de expedientes clínicos de los pacientes de la clínica de psicología, permitiendo a los terapeutas y al personal administrativo acceder a la información necesaria de forma rápida, organizada y segura.
Con ello, se busca reemplazar el manejo físico de expedientes y facilitar la consulta y gestión de la información clínica dentro de la clínica.

## Usuarios

Dentro del alcance del sistema se contemplan tres tipos de usuarios, cada uno con responsabilidades y permisos atribuidos a su rol dentro de la plataforma: 

### Terapeuta

Su función principal es la gestión y control de las sesiones con los pacientes. El terapeuta únicamente puede acceder a la información de los pacientes que le han sido asignados. Además, puede generar reportes de sesión, los cuales son enviados al terapeuta supervisor para su revisión.

### Supervisor

Es responsable de supervisar el trabajo de los terapeutas bajo su cargo. Tiene la capacidad de revisar, modificar, aprobar o rechazar los reportes de sesión enviados por los terapeutas asignados. Este rol no genera reportes de sesión nuevos desde cero.

### Administrador

Se encarga de registrar y gestionar la información correspondiente a documentos administrativos del sistema, tales como la entrevista socioeconómica y el acuerdo de consentimiento.

Cada tipo de usuario cuenta con permisos y accesos limitados a las funciones correspondientes a su rol, con el fin de garantizar un adecuado control y gestión de la información dentro del sistema.

## Funcionalidades del sistema

El sistema proporcionará diferentes funcionalidades dependiendo del tipo de usuario que acceda a la plataforma. Cada rol tendrá acceso únicamente a las acciones correspondientes a sus responsabilidades dentro del sistema.

### Terapeuta

- Consultar la lista de pacientes que le han sido asignados.
- Acceder a la información relevante de dichos pacientes.
- Registrar y elaborar reportes de sesión correspondientes a las terapias realizadas.
- Enviar los reportes de sesión para revisión del terapeuta supervisor.
- Consultar el estado de los reportes enviados (pendiente, aprobado o rechazado).

### Supervisor

- Consultar los reportes de sesión enviados por los terapeutas bajo su supervisión.
- Revisar el contenido de los reportes de sesión.
- Modificar los reportes cuando sea necesario.
- Aprobar o rechazar los reportes enviados por los terapeutas.

### Administrador 

- Registrar y gestionar información correspondiente a documentos administrativos.
    - Capturar y almacenar la información de la entrevista socioeconómica.
    - Registrar la información correspondiente al acuerdo de consentimiento.

## Actores y separación de sistemas

El módulo clínico y el módulo de agenda son sistemas independientes con actores distintos. La siguiente tabla define qué actor pertenece a qué sistema y por qué:

| Actor | Sistema | Responsabilidad | Acceso al módulo clínico |
|---|---|---|---|
| Secretario | Módulo de Agenda | Gestión de citas, disponibilidad de terapeutas, recepción del paciente | Ninguno — por diseño y por privacidad de datos de salud |
| Coordinador | Módulo de Agenda | Coordinación operativa de la agenda | Ninguno |
| Terapeuta | Módulo Clínico | Atención clínica, registro de reportes de sesión | Solo sus pacientes asignados |
| Supervisor | Módulo Clínico | Revisión y aprobación de reportes de terapeutas asignados | Solo sus terapeutas asignados |
| Administrador | Módulo Clínico | Documentación legal y clínica, cumplimiento normativo, control de calidad | Gestión de documentos administrativos y auditoría |

La separación entre Secretario y Administrador es una decisión arquitectónica intencional. El Secretario no tiene ni debe tener acceso a expedientes clínicos, garantizando el cumplimiento de la **NOM-024-SSA3-2010** sobre confidencialidad de datos de salud.

## Mecanismo de integración con el módulo de agenda

La comunicación entre el módulo de agenda y el módulo clínico se realiza a través de una **Capa Anti-Corrupción (ACL)**. Este mecanismo:

- Recibe notificaciones (webhooks) del módulo de agenda cuando se agenda una cita de Evaluación Inicial o Sesión Terapéutica.
- Crea automáticamente el expediente clínico cuando se agenda una Evaluación Inicial para un paciente nuevo.
- Mantiene una proyección local de asignaciones terapeuta-paciente para validaciones ABAC sin dependencia de red.
- Traduce el modelo externo de la agenda al modelo interno del módulo clínico, sin acoplar ambos sistemas.

Si la API del módulo de agenda no está disponible, el módulo clínico responde con un error controlado para las operaciones que la requieran, sin afectar las operaciones que solo dependen de datos locales.

## Limitaciones del sistema

- El módulo no implementa un sistema de autenticación o inicio de sesión. Esta funcionalidad pertenece al módulo de agenda, que emite tokens JWT consumidos por el ACL del módulo clínico.
- La asignación de pacientes a terapeutas no se realiza dentro de este módulo. Proviene del módulo de agenda y se sincroniza a través del ACL.
- La creación del expediente clínico es automática (vía ACL) únicamente para citas de Evaluación Inicial. El administrador no crea expedientes manualmente.
- El sistema contempla únicamente tres tipos de usuarios con acceso al módulo clínico: Terapeuta, Supervisor y Administrador.

## Restricciones del sistema

- El acceso a la información y modificación de la misma se encuentra restringido según el rol del usuario dentro del sistema.
- El terapeuta no puede registrar reportes de sesión si el expediente no tiene consentimiento informado registrado (RN-09).
- Una sesión clínica no puede agregarse al expediente del paciente sin haber sido aprobada por el supervisor.
- Los reportes de sesión deben pasar por un estado de revisión antes de ser aceptados o rechazados.
- Los supervisores solo pueden revisar sesiones de los terapeutas que tienen asignados.
- El sistema debe garantizar la confidencialidad de la información clínica de los pacientes.
- Los usuarios con rol `secretaria` o `coordinador` del módulo de agenda reciben acceso denegado (HTTP 401) al intentar autenticarse en el módulo clínico.
