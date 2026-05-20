let expedienteActual = null;
let reporteActual = null;
let modoReporte = 'crear'; // 'crear' | 'modificar'
let todosPacientes = [];
let tabActiva = 'info';
let filtroEstadoSesiones = null; // null = todos | 'APROBADO' | 'PENDIENTE' | 'RECHAZADO' | 'CREADO'

function setStatus(msg, type) {
  const el = document.getElementById('statusLeft');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'status-banner' + (type ? ' sb-' + type : '');
}

function setModalStatus(msg, type) {
  const el = document.getElementById('mslReporte');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'modal-status-line' + (type ? ' msl-' + type : '');
}

function sesionBadge(estado) {
  const labels = {
    CREADO: 'Borrador', PENDIENTE: 'Pendiente de Revisión',
    APROBADO: 'Aprobado', RECHAZADO: 'Rechazado',
  };
  const clsMap = { CREADO: 'creado', PENDIENTE: 'pendiente', APROBADO: 'aprobado', RECHAZADO: 'rechazado' };
  const up = estado?.toUpperCase();
  return `<span class="badge badge-${clsMap[up] ?? 'creado'}">${esc(labels[up] ?? estado)}</span>`;
}

/* ===== PACIENTES ===== */
window.addEventListener('DOMContentLoaded', loadPacientes);

async function loadPacientes() {
  showLoadingPanel('Cargando pacientes...');
  try {
    const data = await api.get('/terapeutas/mis-pacientes');
    todosPacientes = data;
    renderPacientesPanel(data);
  } catch (e) {
    toast(e.message, 'error');
    showErrorPanel(e.message);
  }
}

function renderPacientesPanel(lista) {
  const total = todosPacientes.length;
  const panel = document.getElementById('contentPanel');

  panel.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2>Mis Pacientes</h2>
          <span style="font-size:0.8rem;color:#94A3B8;margin-top:0.1rem;display:block;">${total} paciente(s) asignado(s)</span>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <div style="position:relative;">
            <input
              type="text"
              id="buscarPacienteInline"
              placeholder="Buscar por nombre..."
              autocomplete="off"
              oninput="filtrarPacientesInline(this.value)"
              style="width:210px;padding:0.35rem 0.625rem 0.35rem 2rem;border:1px solid #E2E8F0;border-radius:6px;font-size:0.8125rem;font-family:inherit;color:#1E293B;background:white;outline:none;"
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
        ${renderPacientesItems(lista)}
      </div>
    </div>
  `;
}

function renderPacientesItems(lista) {
  if (lista.length === 0) {
    return `<div class="empty-state" style="padding:2.5rem 1.5rem;">
      <div class="empty-icon">
        <svg width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
        </svg>
      </div>
      <p>No hay pacientes que coincidan con la búsqueda</p>
    </div>`;
  }

  return lista.map(p => `
    <div class="patient-item patient-item-full" onclick="selectPaciente(${p.idExpediente}, this)">
      <div class="patient-avatar">${esc(p.nombreCompleto.charAt(0))}</div>
      <div class="patient-info" style="flex:1;">
        <div class="patient-name">${esc(p.nombreCompleto)}</div>
        <div class="patient-meta">Expediente #${esc(p.idExpediente)}</div>
      </div>
      <svg width="16" height="16" fill="none" stroke="#CBD5E1" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `).join('');
}

function filtrarPacientesInline(query) {
  const q = query.trim().toLowerCase();
  const filtrados = q
    ? todosPacientes.filter(p => p.nombreCompleto.toLowerCase().includes(q))
    : todosPacientes;
  const el = document.getElementById('pacientesListInline');
  if (el) el.innerHTML = renderPacientesItems(filtrados);
}

/* ===== EXPEDIENTE ===== */
async function selectPaciente(idExpediente, el) {
  filtroEstadoSesiones = null;
  document.querySelectorAll('.patient-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  showLoadingPanel('Cargando expediente...');

  try {
    const data = await api.get(`/expedientes/${idExpediente}`);
    expedienteActual = data;
    reporteActual = null;
    tabActiva = 'info';
    renderExpediente(data);
  } catch (e) {
    toast(e.message, 'error');
    showErrorPanel(e.message);
  }
}

function renderExpediente(exp, tab) {
  if (tab) tabActiva = tab;
  const p = exp.paciente;
  const panel = document.getElementById('contentPanel');
  const inicial = p.nombreCompleto ? p.nombreCompleto.charAt(0).toUpperCase() : '?';

  panel.innerHTML = `
    <div class="exp-header-card card" style="margin-bottom:1rem;">
      <div class="exp-header-inner">
        <div class="exp-patient-profile">
          <div class="exp-avatar">${esc(inicial)}</div>
          <div>
            <h2 class="exp-patient-name">${esc(p.nombreCompleto)}</h2>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.375rem;flex-wrap:wrap;">
              <span class="exp-id-badge">EXP-${esc(exp.idExpediente)}</span>
              ${badge(exp.estado)}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
          ${exp.fechaProxCita ? `
            <div class="exp-next-appt">
              <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${fDate(exp.fechaProxCita)}
            </div>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="loadPacientes()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Mis Pacientes
          </button>
        </div>
      </div>
    </div>

    <div class="exp-tabs-nav card" style="margin-bottom:1rem;">
      <button class="exp-tab${tabActiva === 'info' ? ' active' : ''}" onclick="switchExpTab('info')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        Información Básica
      </button>
      <button class="exp-tab${tabActiva === 'documentos' ? ' active' : ''}" onclick="switchExpTab('documentos')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Documentos Clínicos
      </button>
      <button class="exp-tab${tabActiva === 'sesiones' ? ' active' : ''}" onclick="switchExpTab('sesiones')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Control de Sesiones
      </button>
    </div>

    <div id="expTabContent">
      ${renderTabContent(exp, tabActiva)}
    </div>
  `;
}

function switchExpTab(tab) {
  if (tab !== 'sesiones') filtroEstadoSesiones = null;
  tabActiva = tab;
  document.querySelectorAll('.exp-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('onclick') === `switchExpTab('${tab}')`);
  });
  const content = document.getElementById('expTabContent');
  if (content && expedienteActual) {
    content.innerHTML = renderTabContent(expedienteActual, tab);
  }
}

function renderTabContent(exp, tab) {
  switch (tab) {
    case 'info':       return renderTabInfoBasica(exp);
    case 'documentos': return renderTabDocumentos(exp);
    case 'sesiones':   return renderTabSesiones(exp);
    default:           return renderTabInfoBasica(exp);
  }
}

/* ===== TAB: INFORMACIÓN BÁSICA ===== */
function renderTabInfoBasica(exp) {
  const p = exp.paciente;
  const reportes = exp.reportesSesion || [];

  return `
    <div class="card" style="margin-bottom:1rem;">
      <div class="exp-section-header" style="border-bottom:1px solid #F1F5F9;">
        <div style="padding:1rem 1.25rem 0.875rem;">
          <h3 style="font-size:1.125rem;font-weight:700;color:#1E293B;">${esc(p.nombreCompleto)}</h3>
          <div class="info-grid" style="margin-top:0.5rem;">
            <div class="info-item">
              <div class="label">EDAD</div>
              <div class="value">${esc(p.edad)} años</div>
            </div>
            <div class="info-item">
              <div class="label">CORREO ELECTRÓNICO</div>
              <div class="value">${esc(p.correoElectronico) || '—'}</div>
            </div>
            <div class="info-item">
              <div class="label">NÚMERO TELEFÓNICO</div>
              <div class="value">${esc(p.numeroTelefonico) || '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="two-col-cards">
      <div class="card">
        <div class="card-body">
          <div class="sub-card-header">
            <div class="sub-card-icon sub-card-icon-blue">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h4>Próxima Cita Programada</h4>
          </div>
          <div style="margin-top:1rem;">
            ${exp.fechaProxCita
              ? `<div class="info-item"><div class="label">FECHA Y HORA</div><div class="value" style="font-weight:600;color:#2563EB;">${fDateTime(exp.fechaProxCita)}</div></div>`
              : `<p style="color:#94A3B8;font-size:0.875rem;">Sin cita programada</p>`}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="sub-card-header">
            <div class="sub-card-icon sub-card-icon-purple">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <h4>Resumen del Expediente</h4>
          </div>
          <div style="margin-top:1rem;display:flex;flex-direction:column;gap:0.5rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.875rem;">
              <span style="color:#64748B;">Total de sesiones</span>
              <span style="font-weight:600;">${reportes.length}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.875rem;">
              <span style="color:#64748B;">Sesiones aprobadas</span>
              <span style="font-weight:600;color:#16A34A;">${reportes.filter(r => r.estado === 'APROBADO').length}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.875rem;">
              <span style="color:#64748B;">Documentos registrados</span>
              <span style="font-weight:600;">${[exp.entrevistaSocioeconomica, exp.informeConsentimiento].filter(Boolean).length} / 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ===== TAB: DOCUMENTOS CLÍNICOS ===== */
function renderTabDocumentos(exp) {
  const registrados = [
    exp.entrevistaSocioeconomica
      ? { nombre: 'Entrevista Socioeconómica', doc: exp.entrevistaSocioeconomica, tipo: 'entrevista' }
      : null,
    exp.informeConsentimiento
      ? { nombre: 'Consentimiento Informado', doc: exp.informeConsentimiento, tipo: 'consentimiento' }
      : null,
  ].filter(Boolean);

  const pendientes = [
    !exp.entrevistaSocioeconomica ? { nombre: 'Entrevista Socioeconómica', desc: 'Evaluación inicial de contexto social, económico y familiar del paciente' } : null,
    !exp.informeConsentimiento    ? { nombre: 'Consentimiento Informado',   desc: 'Documento de autorización para tratamiento psicológico' } : null,
  ].filter(Boolean);

  return `
    <div class="exp-section-header card" style="margin-bottom:1rem;">
      <h3>Documentos Clínicos</h3>
      <p>Documentos oficiales del expediente clínico</p>
    </div>

    <div class="stat-cards-grid stat-cards-3" style="margin-bottom:1rem;">
      <div class="stat-card">
        <div class="stat-card-label">TOTAL DOCUMENTOS</div>
        <div class="stat-card-value">2</div>
      </div>
      <div class="stat-card stat-card-green">
        <div class="stat-card-label">COMPLETOS</div>
        <div class="stat-card-value">${registrados.length}</div>
      </div>
      <div class="stat-card stat-card-yellow">
        <div class="stat-card-label">PENDIENTES</div>
        <div class="stat-card-value">${pendientes.length}</div>
      </div>
    </div>

    ${registrados.map(d => `
      <div class="doc-card card" style="margin-bottom:1rem;">
        <div class="doc-card-body">
          <div class="doc-card-content">
            <div class="doc-card-name">${esc(d.nombre)}</div>
            <div class="doc-card-actions" style="margin-top:0.625rem;">
              <button class="btn btn-secondary btn-sm" onclick="verDocumento('${d.tipo}')">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Ver Documento
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('')}

    ${pendientes.map(d => `
      <div class="doc-card card" style="margin-bottom:1rem;opacity:0.75;">
        <div class="doc-card-body">
          <div class="doc-card-left">
            <div class="doc-card-icon doc-card-icon-gray">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="doc-card-content">
            <div class="doc-card-top">
              <div>
                <div class="doc-card-name" style="color:#94A3B8;">${esc(d.nombre)}</div>
                <div class="doc-card-desc">${esc(d.desc)}</div>
              </div>
              <span class="badge" style="background:#FEF3C7;color:#92400E;">Pendiente</span>
            </div>
            <p style="font-size:0.8125rem;color:#94A3B8;margin-top:0.25rem;">No registrado aún</p>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

/* ===== TAB: CONTROL DE SESIONES ===== */
function filtrarSesiones(estado) {
  filtroEstadoSesiones = filtroEstadoSesiones === estado ? null : estado;
  const content = document.getElementById('expTabContent');
  if (content && expedienteActual) {
    content.innerHTML = renderTabSesiones(expedienteActual);
  }
}

function renderTabSesiones(exp) {
  const reportes   = exp.reportesSesion || [];
  const total      = reportes.length;
  const aprobadas  = reportes.filter(r => r.estado === 'APROBADO').length;
  const pendientes = reportes.filter(r => r.estado === 'PENDIENTE').length;
  const rechazadas = reportes.filter(r => r.estado === 'RECHAZADO').length;
  const borradores = reportes.filter(r => r.estado === 'CREADO').length;

  const filtradas = filtroEstadoSesiones
    ? reportes.filter(r => r.estado === filtroEstadoSesiones)
    : reportes;

  function cardSel(estado) {
    return filtroEstadoSesiones === estado ? ' stat-card-selected' : '';
  }
  const allSel = filtroEstadoSesiones === null ? '' : '';

  return `
    <div class="exp-section-header-row" style="margin-bottom:1rem;">
      <div>
        <h3 style="font-size:1rem;font-weight:700;color:#1E293B;">Control de Sesiones</h3>
        <p style="font-size:0.8125rem;color:#64748B;margin-top:0.125rem;">Haz clic en una tarjeta para filtrar por estado</p>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openModalCrear(${exp.idExpediente})">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nueva Sesión
      </button>
    </div>

    <div class="stat-cards-grid stat-cards-5" style="margin-bottom:1rem;">
      <div class="stat-card stat-card-clickable${filtroEstadoSesiones === null ? ' stat-card-selected' : ''}"
           onclick="filtrarSesiones(null)" title="Mostrar todas">
        <div class="stat-card-label">TOTAL SESIONES</div>
        <div class="stat-card-value">${total}</div>
      </div>
      <div class="stat-card stat-card-green stat-card-clickable${cardSel('APROBADO')}"
           onclick="filtrarSesiones('APROBADO')" title="Filtrar aprobadas">
        <div class="stat-card-label">APROBADAS</div>
        <div class="stat-card-value">${aprobadas}</div>
      </div>
      <div class="stat-card stat-card-yellow stat-card-clickable${cardSel('PENDIENTE')}"
           onclick="filtrarSesiones('PENDIENTE')" title="Filtrar pendientes">
        <div class="stat-card-label">PENDIENTES</div>
        <div class="stat-card-value">${pendientes}</div>
      </div>
      <div class="stat-card stat-card-red stat-card-clickable${cardSel('RECHAZADO')}"
           onclick="filtrarSesiones('RECHAZADO')" title="Filtrar rechazadas">
        <div class="stat-card-label">RECHAZADAS</div>
        <div class="stat-card-value">${rechazadas}</div>
      </div>
      <div class="stat-card stat-card-clickable${cardSel('CREADO')}"
           onclick="filtrarSesiones('CREADO')" title="Filtrar borradores">
        <div class="stat-card-label">BORRADORES</div>
        <div class="stat-card-value">${borradores}</div>
      </div>
    </div>

    <div class="card">
      ${filtradas.length === 0
        ? `<div class="card-body"><div class="empty-state"><p>${total === 0 ? 'No hay sesiones registradas aún' : 'No hay sesiones con ese estado'}</p></div></div>`
        : `<div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SESIÓN #</th>
                  <th>FECHA</th>
                  <th>DURACIÓN</th>
                  <th>ESTADO</th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                ${filtradas.map((r, i) => `
                  <tr>
                    <td><span class="session-num">${total - reportes.indexOf(r)}</span></td>
                    <td>
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color:#94A3B8;vertical-align:middle;margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      ${fDate(r.fechaSesion)}
                    </td>
                    <td style="color:#94A3B8;">—</td>
                    <td>${sesionBadge(r.estado)}</td>
                    <td>
                      <div style="display:flex;gap:0.375rem;align-items:center;">
                        <button class="btn-icon-action" title="Ver detalle" onclick="loadReporte(${r.idDocumento})">
                          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        ${(r.estado === 'CREADO' || r.estado === 'RECHAZADO') ? `
                          <button class="btn-icon-action" title="Editar" onclick="loadAndEdit(${r.idDocumento})">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="table-footer">
            ${filtroEstadoSesiones
              ? `Mostrando ${filtradas.length} de ${total} sesión${total !== 1 ? 'es' : ''}`
              : `Mostrando ${total} sesión${total !== 1 ? 'es' : ''}`}
          </div>`
      }
    </div>
  `;
}

/* ===== REPORTE DETALLE ===== */
async function loadReporte(idReporte) {
  showLoadingPanel('Cargando reporte...');
  try {
    const data = await api.get(`/reportes/${idReporte}`);
    reporteActual = data;
    renderReporte(data);
  } catch (e) {
    toast(e.message, 'error');
    if (expedienteActual) renderExpediente(expedienteActual, tabActiva);
  }
}

async function loadAndEdit(idReporte) {
  try {
    const data = await api.get(`/reportes/${idReporte}`);
    reporteActual = data;
    openModalModificar(idReporte);
  } catch (e) {
    toast(e.message, 'error');
  }
}

function renderReporte(r) {
  const panel = document.getElementById('contentPanel');
  const acciones = buildReporteAcciones(r);

  panel.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 style="font-size:1rem;font-weight:700;">Detalle de Sesión</h2>
          <p style="font-size:0.8125rem;color:#64748B;margin-top:0.125rem;">Reporte #${esc(r.idDocumento)}</p>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          ${sesionBadge(r.estado)}
          <button class="btn btn-secondary btn-sm" onclick="renderExpediente(expedienteActual, tabActiva)">← Volver</button>
        </div>
      </div>
      <div class="card-body">
        <div class="info-grid" style="margin-bottom:1.25rem;">
          <div class="info-item"><div class="label">EXPEDIENTE</div><div class="value">#${esc(r.idExpediente)}</div></div>
          <div class="info-item"><div class="label">FECHA DE SESIÓN</div><div class="value">${fDate(r.fechaSesion)}</div></div>
          <div class="info-item"><div class="label">DURACIÓN</div><div class="value">${r.duracionSesion ? esc(r.duracionSesion) + ' min' : '—'}</div></div>
          <div class="info-item"><div class="label">CREADO</div><div class="value">${fDateTime(r.fechaCreacion)}</div></div>
          <div class="info-item"><div class="label">MODIFICADO</div><div class="value">${fDateTime(r.fechaModificacion)}</div></div>
        </div>

        <div class="report-section">
          <div class="section-title">Observaciones clínicas</div>
          <div class="report-text-block">${esc(r.observacionesClinicas)}</div>
        </div>

        ${r.comentariosTerapeuta ? `
        <div class="report-section">
          <div class="section-title">Comentarios del terapeuta</div>
          <div class="report-text-block">${esc(r.comentariosTerapeuta)}</div>
        </div>` : ''}

        ${r.comentariosSupervisor ? `
        <div class="report-section">
          <div class="section-title">Retroalimentación del supervisor</div>
          <div class="report-text-block" style="border-color:#FECACA;background:#FEF2F2;">${esc(r.comentariosSupervisor)}</div>
        </div>` : ''}

        ${acciones}
      </div>
    </div>
  `;
}

function buildReporteAcciones(r) {
  if (r.estado === 'CREADO') {
    return `<div class="action-bar">
      <button class="btn btn-warning btn-sm" onclick="openModalModificar(${r.idDocumento})">Modificar</button>
      <button class="btn btn-primary" id="btnEnviar" onclick="enviarReporte(${r.idDocumento})">Enviar a revisión</button>
    </div>`;
  }
  if (r.estado === 'RECHAZADO') {
    return `<div class="action-bar">
      <button class="btn btn-warning" onclick="openModalModificar(${r.idDocumento})">Modificar reporte</button>
      <button class="btn btn-primary" id="btnEnviar" onclick="enviarReporte(${r.idDocumento})">Enviar a revisión</button>
    </div>`;
  }
  if (r.estado === 'PENDIENTE') {
    return `<div class="action-bar"><div class="alert alert-info" style="margin:0;">Este reporte está pendiente de revisión por el supervisor.</div></div>`;
  }
  if (r.estado === 'APROBADO') {
    return `<div class="action-bar"><div class="alert alert-success" style="margin:0;">Este reporte fue aprobado por el supervisor.</div></div>`;
  }
  return '';
}

/* ===== ENVIAR REPORTE ===== */
async function enviarReporte(idReporte) {
  const btn = document.getElementById('btnEnviar');
  setLoading(btn, true);
  try {
    const data = await api.patch(`/reportes/${idReporte}/enviar`);
    toast(`Reporte enviado a revisión. Estado: ${data.estado}`, 'success');
    await loadReporte(idReporte);
  } catch (e) {
    toast(e.message, 'error');
    setLoading(btn, false);
  }
}

/* ===== MODAL CREAR / MODIFICAR REPORTE ===== */
let idExpedienteReporte = null;

function openModalCrear(idExpediente) {
  modoReporte = 'crear';
  idExpedienteReporte = idExpediente;
  document.getElementById('modalReporteTitulo').textContent = 'Nueva Sesión';
  document.getElementById('formReporte').reset();
  document.getElementById('rfFechaSesion').valueAsDate = new Date();
  openModal('modalReporte');
}

function openModalModificar(idReporte) {
  if (!reporteActual || reporteActual.idDocumento !== idReporte) return;
  modoReporte = 'modificar';
  document.getElementById('modalReporteTitulo').textContent = 'Modificar Reporte';
  const r = reporteActual;
  document.getElementById('rfFechaSesion').value = r.fechaSesion;
  document.getElementById('rfDuracion').value = r.duracionSesion || '';
  document.getElementById('rfObservaciones').value = r.observacionesClinicas || '';
  document.getElementById('rfComentarios').value = r.comentariosTerapeuta || '';
  openModal('modalReporte');
}

document.getElementById('btnGuardarReporte').addEventListener('click', async () => {
  const btn           = document.getElementById('btnGuardarReporte');
  const fechaSesion   = document.getElementById('rfFechaSesion').value;
  const duracion      = document.getElementById('rfDuracion').value;
  const observaciones = document.getElementById('rfObservaciones').value.trim();
  const comentarios   = document.getElementById('rfComentarios').value.trim();

  if (!fechaSesion)   { setModalStatus('La fecha de sesión es obligatoria', 'error'); return; }
  if (!duracion)      { setModalStatus('La duración de la sesión es obligatoria', 'error'); return; }
  if (!observaciones) { setModalStatus('Las observaciones clínicas son obligatorias', 'error'); return; }

  const body = {
    fechaSesion,
    duracionSesion:        duracion ? parseInt(duracion) : null,
    observacionesClinicas: observaciones,
    comentariosTerapeuta:  comentarios || null,
  };

  setModalStatus('Guardando...', 'loading');
  setLoading(btn, true);
  try {
    if (modoReporte === 'crear') {
      await api.post(`/expedientes/${idExpedienteReporte}/reportes`, body);
      closeModal('modalReporte');
      setModalStatus('');
      toast('Sesión creada exitosamente', 'success');
      const exp = await api.get(`/expedientes/${idExpedienteReporte}`);
      expedienteActual = exp;
      filtroEstadoSesiones = null;
      renderExpediente(exp, 'sesiones');
    } else {
      await api.put(`/reportes/${reporteActual.idDocumento}`, body);
      closeModal('modalReporte');
      setModalStatus('');
      toast('Reporte modificado exitosamente', 'success');
      await loadReporte(reporteActual.idDocumento);
    }
  } catch (e) {
    setModalStatus(e.message, 'error');
  } finally {
    setLoading(btn, false);
  }
});

/* ===== HELPERS ===== */
function showLoadingPanel(msg) {
  document.getElementById('contentPanel').innerHTML = `
    <div class="card"><div class="card-body"><div class="empty-state">
      <span class="spinner"></span>
      <p style="margin-top:1rem;">${esc(msg)}</p>
    </div></div></div>`;
}

function showErrorPanel(msg) {
  document.getElementById('contentPanel').innerHTML = `
    <div class="card"><div class="card-body">
      <div class="alert alert-error">${esc(msg)}</div>
    </div></div>`;
}

/* ===== VER DOCUMENTO ===== */
function verDocumento(tipo) {
  if (!expedienteActual) return;

  let titulo, contenido;

  if (tipo === 'entrevista') {
    const doc = expedienteActual.entrevistaSocioeconomica;
    if (!doc) return;
    titulo = 'Entrevista Socioeconómica';
    contenido = `
      <div class="info-grid">
        <div class="info-item"><div class="label">FECHA</div><div class="value">${fDate(doc.fecha)}</div></div>
        <div class="info-item"><div class="label">ID DOCUMENTO</div><div class="value">#${esc(doc.idDocumento)}</div></div>
      </div>
      <div class="info-grid" style="margin-top:1.25rem;">
        <div class="info-item"><div class="label">INGRESO FAMILIAR</div><div class="value">$${esc(doc.ingresoFamiliar)}</div></div>
        <div class="info-item"><div class="label">GASTO ALIMENTACIÓN</div><div class="value">$${esc(doc.gastoAlimentacion)}</div></div>
        <div class="info-item"><div class="label">LUGAR DE PROCEDENCIA</div><div class="value">${esc(doc.lugarProcedencia)}</div></div>
      </div>
      ${doc.vivienda ? `<div class="report-section" style="margin-top:1.25rem;"><div class="section-title">VIVIENDA</div><div class="report-text-block">${esc(doc.vivienda)}</div></div>` : ''}
      <div class="info-item" style="margin-top:1.25rem;"><div class="label">ESTADO DE SALUD FAMILIAR</div><div class="value">${esc(doc.estadoSaludFamiliar)}</div></div>
    `;
  } else {
    const doc = expedienteActual.informeConsentimiento;
    if (!doc) return;
    titulo = 'Consentimiento Informado';
    contenido = `
      <div class="info-grid">
        <div class="info-item"><div class="label">FECHA</div><div class="value">${fDate(doc.fecha)}</div></div>
        <div class="info-item"><div class="label">ID DOCUMENTO</div><div class="value">#${esc(doc.idDocumento)}</div></div>
      </div>
      <div class="report-section" style="margin-top:1.25rem;"><div class="section-title">CUERPO DEL TEXTO</div><div class="report-text-block">${esc(doc.cuerpoDelTexto)}</div></div>
      <div class="report-section" style="margin-top:1rem;"><div class="section-title">ACUERDO DE CONFIDENCIALIDAD</div><div class="report-text-block">${esc(doc.acuerdoConfidencial)}</div></div>
    `;
  }

  document.getElementById('modalVerDocTitulo').textContent = titulo;
  document.getElementById('modalVerDocCuerpo').innerHTML = contenido;
  openModal('modalVerDocumento');
}
