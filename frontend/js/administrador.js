/* ===== STATE ===== */
let todosLosExpedientes = [];
let expedienteActual = null;
let usuariosLoaded = false;

/* ===== INIT ===== */
window.addEventListener('DOMContentLoaded', () => {
  initTabs('#adminTabs');

  document.querySelectorAll('#adminTabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab === 'tabUsuarios' && !usuariosLoaded) {
        usuariosLoaded = true;
        loadUsuarios();
      }
    });
  });

  loadPacientes();
});

/* ===== PANEL HELPERS ===== */
function showPanelLoading(panelId, msg) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.innerHTML = `<div class="card"><div class="card-body"><div class="empty-state">
    <span class="spinner"></span>
    <p style="margin-top:1rem;">${esc(msg)}</p>
  </div></div></div>`;
}

function showPanelError(panelId, msg) {
  const el = document.getElementById(panelId);
  if (!el) return;
  el.innerHTML = `<div class="card"><div class="card-body">
    <div class="alert alert-error">${esc(msg)}</div>
  </div></div>`;
}

/* ===== PACIENTES ===== */
async function loadPacientes() {
  showPanelLoading('panelPacientes', 'Cargando pacientes...');
  try {
    const data = await api.get('/expedientes');
    todosLosExpedientes = data;
    renderListaPacientes(data);
  } catch (e) {
    toast(e.message, 'error');
    showPanelError('panelPacientes', e.message);
  }
}

function tienePendientes(r) {
  return !r.entrevistaSocioeconomica || !r.informeConsentimiento;
}

function renderListaPacientes(lista) {
  const activos = lista.filter(r => r.estado === 'ACTIVO');
  const panel = document.getElementById('panelPacientes');

  panel.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2>Pacientes</h2>
          <span style="font-size:0.8rem;color:#94A3B8;margin-top:0.1rem;display:block;">${activos.length} paciente(s) activo(s)</span>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <div style="position:relative;">
            <input
              type="text"
              id="filtroPacienteInline"
              placeholder="Buscar por nombre..."
              autocomplete="off"
              oninput="filtrarPacienteInline(this.value)"
              style="width:200px;padding:0.35rem 0.625rem 0.35rem 2rem;border:1px solid #E2E8F0;border-radius:6px;font-size:0.8125rem;font-family:inherit;color:#1E293B;background:white;outline:none;"
              onfocus="this.style.borderColor='#2563EB'" onblur="this.style.borderColor='#E2E8F0'"
            />
            <svg width="13" height="13" fill="none" stroke="#94A3B8" stroke-width="2" viewBox="0 0 24 24"
              style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);pointer-events:none;">
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
            </svg>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="loadPacientes()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            Actualizar
          </button>
        </div>
      </div>
      <div id="pacientesListInline">
        ${renderPacientesItems(activos)}
      </div>
    </div>
  `;
}

function renderPacientesItems(lista) {
  if (lista.length === 0) {
    return `<div class="empty-state" style="padding:2.5rem 1.5rem;">
      <div class="empty-icon">
        <svg width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <p>No hay pacientes activos</p>
    </div>`;
  }

  return lista.map(r => {
    const pendiente = tienePendientes(r);
    const nombre = r.nombrePaciente || (r.paciente && r.paciente.nombreCompleto) || ('Paciente #' + r.idPaciente);
    return `
    <div class="patient-item patient-item-full" onclick="selectPaciente(${r.idExpediente}, this)">
      <div class="patient-avatar" style="background:#EFF6FF;color:#1D4ED8;">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <div class="patient-info" style="flex:1;">
        <div class="patient-name">${esc(nombre)}</div>
        <div class="patient-meta">Exp. #${esc(r.idExpediente)} · ${esc(r.estado)}</div>
      </div>
      ${pendiente ? `
      <span style="font-size:0.7rem;font-weight:600;color:#D97706;background:#FEF3C7;border-radius:100px;padding:0.2rem 0.625rem;white-space:nowrap;flex-shrink:0;">
        Docs. pendientes
      </span>` : ''}
      <svg width="16" height="16" fill="none" stroke="#CBD5E1" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;margin-left:0.5rem;">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>`;
  }).join('');
}

function filtrarPacienteInline(query) {
  const q = query.trim().toLowerCase();
  const activos = todosLosExpedientes.filter(r => r.estado === 'ACTIVO');
  const filtrados = q
    ? activos.filter(r => {
        const nombre = (r.nombrePaciente || (r.paciente && r.paciente.nombreCompleto) || '').toLowerCase();
        return nombre.includes(q);
      })
    : activos;
  const el = document.getElementById('pacientesListInline');
  if (el) el.innerHTML = renderPacientesItems(filtrados);
}

async function selectPaciente(idExpediente, itemEl) {
  if (itemEl) {
    document.querySelectorAll('#panelPacientes .patient-item').forEach(i => i.classList.remove('active'));
    itemEl.classList.add('active');
  }
  showPanelLoading('panelPacientes', 'Cargando expediente...');
  try {
    const data = await api.get(`/expedientes/${idExpediente}`);
    expedienteActual = data;
    renderDetallePaciente(data);
  } catch (e) {
    toast(e.message, 'error');
    showPanelError('panelPacientes', e.message);
  }
}

function renderDetallePaciente(data) {
  const panel = document.getElementById('panelPacientes');
  const p = data.paciente || {};
  const nombre = p.nombreCompleto || ('Paciente #' + data.idPaciente);

  const faltaEntrevista     = !data.entrevistaSocioeconomica;
  const faltaConsentimiento = !data.informeConsentimiento;
  const todoOk = !faltaEntrevista && !faltaConsentimiento;

  panel.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 style="font-size:1rem;font-weight:700;">${esc(nombre)}</h2>
          <p style="font-size:0.8125rem;color:#64748B;margin-top:0.125rem;">Expediente #${esc(data.idExpediente)}</p>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          ${badge(data.estado)}
          <button class="btn btn-secondary btn-sm" onclick="loadPacientes()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Pacientes
          </button>
        </div>
      </div>
      <div class="card-body">

        <div class="info-grid" style="margin-bottom:1.25rem;">
          <div class="info-item"><div class="label">PACIENTE</div><div class="value">${esc(nombre)}</div></div>
          ${p.edad != null ? `<div class="info-item"><div class="label">EDAD</div><div class="value">${esc(p.edad)} años</div></div>` : ''}
          ${p.correoElectronico ? `<div class="info-item"><div class="label">CORREO</div><div class="value">${esc(p.correoElectronico)}</div></div>` : ''}
          ${p.numeroTelefonico ? `<div class="info-item"><div class="label">TELÉFONO</div><div class="value">${esc(p.numeroTelefonico)}</div></div>` : ''}
          <div class="info-item"><div class="label">EXPEDIENTE</div><div class="value">#${esc(data.idExpediente)}</div></div>
          ${data.fechaProxCita ? `<div class="info-item"><div class="label">PRÓXIMA CITA</div><div class="value">${fDateTime(data.fechaProxCita)}</div></div>` : ''}
        </div>

        ${todoOk ? `
        <div class="alert alert-success" style="margin-bottom:1rem;">
          Todos los documentos del expediente están registrados.
        </div>` : `
        <div class="report-section">
          <div class="section-title" style="color:#D97706;">Documentos Pendientes</div>
          ${faltaEntrevista ? renderFormEntrevista(data.idExpediente) : ''}
          ${faltaConsentimiento ? renderFormConsentimiento(data.idExpediente) : ''}
        </div>`}

        ${!faltaEntrevista ? `
        <div class="report-section" style="margin-top:0.75rem;">
          <div class="section-title">Entrevista Socioeconómica</div>
          <div class="report-text-block" style="color:#166534;background:#F0FDF4;border-color:#86EFAC;">
            Registrada el ${fDate(data.entrevistaSocioeconomica.fecha)} · Doc. #${esc(data.entrevistaSocioeconomica.idDocumento)}
          </div>
        </div>` : ''}

        ${!faltaConsentimiento ? `
        <div class="report-section" style="margin-top:0.75rem;">
          <div class="section-title">Consentimiento Informado</div>
          <div class="report-text-block" style="color:#166534;background:#F0FDF4;border-color:#86EFAC;">
            Registrado el ${fDate(data.informeConsentimiento.fecha)} · Doc. #${esc(data.informeConsentimiento.idDocumento)}
          </div>
        </div>` : ''}

      </div>
    </div>
  `;
}

function renderFormEntrevista(idExpediente) {
  return `
  <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:1rem;margin-bottom:1rem;">
    <div style="font-size:0.8125rem;font-weight:600;color:#92400E;margin-bottom:0.75rem;">Registrar Entrevista Socioeconómica</div>
    <div class="form-row">
      <div class="form-group" style="margin-bottom:0.5rem;">
        <label style="font-size:0.75rem;">Ingreso familiar <span class="req">*</span></label>
        <input type="number" id="eIngreso_${idExpediente}" min="0" step="0.01" placeholder="Ej. 8500.00" autocomplete="off" />
      </div>
      <div class="form-group" style="margin-bottom:0.5rem;">
        <label style="font-size:0.75rem;">Gasto alimentación <span class="req">*</span></label>
        <input type="number" id="eGasto_${idExpediente}" min="0" step="0.01" placeholder="Ej. 2000.00" autocomplete="off" />
      </div>
    </div>
    <div class="form-group" style="margin-bottom:0.5rem;">
      <label style="font-size:0.75rem;">Lugar de procedencia <span class="req">*</span></label>
      <input type="text" id="eLugar_${idExpediente}" maxlength="100" placeholder="Ciudad, Estado" autocomplete="off" />
    </div>
    <div class="form-group" style="margin-bottom:0.5rem;">
      <label style="font-size:0.75rem;">Vivienda</label>
      <textarea id="eVivienda_${idExpediente}" rows="2" maxlength="1000" placeholder="Tipo, condiciones, número de personas..."></textarea>
    </div>
    <div class="form-group" style="margin-bottom:0.75rem;">
      <label style="font-size:0.75rem;">Estado de salud familiar <span class="req">*</span></label>
      <input type="text" id="eSalud_${idExpediente}" maxlength="50" placeholder="Ej. Sin enfermedades crónicas" autocomplete="off" />
    </div>
    <div id="resEntrevista_${idExpediente}" style="margin-bottom:0.5rem;"></div>
    <button class="btn btn-primary btn-sm" onclick="guardarEntrevista(${idExpediente}, this)">Guardar entrevista</button>
  </div>`;
}

function renderFormConsentimiento(idExpediente) {
  return `
  <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:1rem;margin-bottom:1rem;">
    <div style="font-size:0.8125rem;font-weight:600;color:#92400E;margin-bottom:0.75rem;">Registrar Consentimiento Informado</div>
    <div class="form-group" style="margin-bottom:0.5rem;">
      <label style="font-size:0.75rem;">Cuerpo del texto <span class="req">*</span></label>
      <textarea id="cCuerpo_${idExpediente}" rows="3" placeholder="Texto del acuerdo de tratamiento..."></textarea>
    </div>
    <div class="form-group" style="margin-bottom:0.75rem;">
      <label style="font-size:0.75rem;">Acuerdo de confidencialidad <span class="req">*</span></label>
      <textarea id="cAcuerdo_${idExpediente}" rows="3" placeholder="Cláusulas de confidencialidad..."></textarea>
    </div>
    <div id="resConsentimiento_${idExpediente}" style="margin-bottom:0.5rem;"></div>
    <button class="btn btn-primary btn-sm" onclick="guardarConsentimiento(${idExpediente}, this)">Guardar consentimiento</button>
  </div>`;
}

async function guardarEntrevista(idExpediente, btn) {
  const ingreso  = document.getElementById(`eIngreso_${idExpediente}`)?.value.trim();
  const gasto    = document.getElementById(`eGasto_${idExpediente}`)?.value.trim();
  const lugar    = document.getElementById(`eLugar_${idExpediente}`)?.value.trim();
  const vivienda = document.getElementById(`eVivienda_${idExpediente}`)?.value.trim();
  const salud    = document.getElementById(`eSalud_${idExpediente}`)?.value.trim();

  if (!ingreso || !gasto || !lugar || !salud) {
    toast('Completa todos los campos obligatorios de la entrevista', 'error');
    return;
  }

  setLoading(btn, true);
  const resEl = document.getElementById(`resEntrevista_${idExpediente}`);
  if (resEl) resEl.innerHTML = '';

  try {
    await api.post(`/expedientes/${idExpediente}/entrevista-socioeconomica`, {
      ingresoFamiliar:     parseFloat(ingreso),
      gastoAlimentacion:   parseFloat(gasto),
      lugarProcedencia:    lugar,
      vivienda:            vivienda || null,
      estadoSaludFamiliar: salud,
    });
    toast('Entrevista socioeconómica registrada', 'success');
    const data = await api.get(`/expedientes/${idExpediente}`);
    expedienteActual = data;
    renderDetallePaciente(data);
  } catch (e) {
    toast(e.message, 'error');
    if (resEl) resEl.innerHTML = `<div class="alert alert-error">${esc(e.message)}</div>`;
    setLoading(btn, false);
  }
}

async function guardarConsentimiento(idExpediente, btn) {
  const cuerpo  = document.getElementById(`cCuerpo_${idExpediente}`)?.value.trim();
  const acuerdo = document.getElementById(`cAcuerdo_${idExpediente}`)?.value.trim();

  if (!cuerpo || !acuerdo) {
    toast('El cuerpo del texto y el acuerdo son obligatorios', 'error');
    return;
  }

  setLoading(btn, true);
  const resEl = document.getElementById(`resConsentimiento_${idExpediente}`);
  if (resEl) resEl.innerHTML = '';

  try {
    await api.post(`/expedientes/${idExpediente}/consentimiento`, {
      cuerpoDelTexto:      cuerpo,
      acuerdoConfidencial: acuerdo,
    });
    toast('Consentimiento informado registrado', 'success');
    const data = await api.get(`/expedientes/${idExpediente}`);
    expedienteActual = data;
    renderDetallePaciente(data);
  } catch (e) {
    toast(e.message, 'error');
    if (resEl) resEl.innerHTML = `<div class="alert alert-error">${esc(e.message)}</div>`;
    setLoading(btn, false);
  }
}

/* ===== USUARIOS ===== */
async function loadUsuarios() {
  showPanelLoading('panelUsuarios', 'Cargando usuarios...');
  try {
    const [terapeutas, supervisores] = await Promise.all([
      api.get('/terapeutas'),
      api.get('/supervisores'),
    ]);
    renderUsuarios(terapeutas, supervisores);
  } catch (e) {
    toast(e.message, 'error');
    showPanelError('panelUsuarios', e.message);
  }
}

function renderUsuarios(terapeutas, supervisores) {
  const panel = document.getElementById('panelUsuarios');
  panel.innerHTML = `
    <div class="card" style="margin-bottom:1rem;">
      <div class="card-header">
        <h2>Terapeutas</h2>
        <span style="font-size:0.8rem;color:#94A3B8;">${terapeutas.length} usuario(s)</span>
      </div>
      <div>${renderUsuariosItems(terapeutas, '#EFF6FF', '#1D4ED8')}</div>
    </div>
    <div class="card">
      <div class="card-header">
        <h2>Supervisores</h2>
        <span style="font-size:0.8rem;color:#94A3B8;">${supervisores.length} usuario(s)</span>
      </div>
      <div>${renderUsuariosItems(supervisores, '#F0FDF4', '#166534')}</div>
    </div>
  `;
}

function renderUsuariosItems(lista, avatarBg, avatarColor) {
  if (lista.length === 0) {
    return `<div class="empty-state" style="padding:2rem;">
      <p>No hay usuarios registrados</p>
    </div>`;
  }

  return lista.map(u => {
    const id     = u.idTerapeuta || u.idSupervisor || u.id || '—';
    const nombre = u.nombreCompleto || u.nombre || ('Usuario #' + id);
    const correo = u.correoElectronico || u.email || null;
    return `
    <div class="patient-item" style="border-bottom:1px solid #F1F5F9;cursor:default;">
      <div class="patient-avatar" style="background:${avatarBg};color:${avatarColor};">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </div>
      <div class="patient-info" style="flex:1;">
        <div class="patient-name">${esc(nombre)}</div>
        <div class="patient-meta">ID: ${esc(id)}${correo ? ' · ' + esc(correo) : ''}</div>
      </div>
    </div>`;
  }).join('');
}

/* ===== AUDITORÍA ===== */
document.getElementById('btnBuscarAuditoria').addEventListener('click', buscarAuditoria);

async function buscarAuditoria() {
  const btn = document.getElementById('btnBuscarAuditoria');

  const idUsuario  = document.getElementById('aIdUsuario').value.trim();
  const fechaDesde = document.getElementById('aFechaDesde').value;
  const fechaHasta = document.getElementById('aFechaHasta').value;
  const accion     = document.getElementById('aAccion').value;
  const recurso    = document.getElementById('aRecurso').value.trim();
  const resultado  = document.getElementById('aResultado').value;

  let qs = '?';
  if (idUsuario)  qs += `idUsuario=${idUsuario}&`;
  if (fechaDesde) qs += `fechaDesde=${encodeURIComponent(new Date(fechaDesde).toISOString())}&`;
  if (fechaHasta) qs += `fechaHasta=${encodeURIComponent(new Date(fechaHasta).toISOString())}&`;
  if (accion)     qs += `accion=${encodeURIComponent(accion)}&`;
  if (recurso)    qs += `recurso=${encodeURIComponent(recurso)}&`;
  if (resultado)  qs += `resultado=${encodeURIComponent(resultado)}&`;

  setLoading(btn, true);
  const countEl = document.getElementById('countAuditoria');
  if (countEl) countEl.textContent = '';

  try {
    const data = await api.get(`/auditoria${qs}`);
    renderAuditoria(data);
    if (countEl) countEl.textContent = `${data.length} resultado(s)`;
    toast(`${data.length} registro(s) encontrados`, 'success');
  } catch (e) {
    toast(e.message, 'error');
    document.getElementById('auditoriaResultado').innerHTML =
      `<div class="alert alert-error" style="margin:1rem;">${esc(e.message)}</div>`;
  } finally {
    setLoading(btn, false);
  }
}

function renderAuditoria(lista) {
  const el = document.getElementById('auditoriaResultado');

  if (lista.length === 0) {
    el.innerHTML = `<div class="empty-state" style="padding:2rem;"><p>No se encontraron registros con esos filtros</p></div>`;
    return;
  }

  const rows = lista.map(l => `
    <tr>
      <td>${esc(l.idLog)}</td>
      <td>${esc(l.idUsuario)}</td>
      <td><code style="font-size:0.75rem;">${esc(l.rolUsuario)}</code></td>
      <td style="font-size:0.8125rem;white-space:nowrap;">${esc(l.accion)}</td>
      <td>${esc(l.recurso)}${l.idRecurso ? ` <span style="color:#94A3B8;">#${esc(l.idRecurso)}</span>` : ''}</td>
      <td style="white-space:nowrap;font-size:0.8125rem;">${fDateTime(l.fechaHora)}</td>
      <td>${badge(l.resultado)}</td>
    </tr>
  `).join('');

  el.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID Log</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Accion</th>
            <th>Recurso</th>
            <th>Fecha / Hora</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}
