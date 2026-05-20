let reporteActual = null;
let reporteIdParaRechazar = null;
let todosLosReportes = [];

function setModalStatus(msg, type) {
  const el = document.getElementById('mslRechazar');
  if (!el) return;
  el.textContent = msg || '';
  el.className = 'modal-status-line' + (type ? ' msl-' + type : '');
}

/* ===== AUTO-CARGA ===== */
window.addEventListener('DOMContentLoaded', loadReportesPendientes);

async function loadReportesPendientes() {
  showLoadingPanel('Cargando reportes pendientes...');
  try {
    const data = await api.get('/supervisores/mis-reportes-pendientes');
    todosLosReportes = data;
    renderReportesPanel(data);
  } catch (e) {
    toast(e.message, 'error');
    showErrorPanel(e.message);
  }
}

function renderReportesPanel(lista) {
  const total = todosLosReportes.length;
  const panel = document.getElementById('contentPanel');

  panel.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2>Reportes Pendientes de Revisión</h2>
          <span style="font-size:0.8rem;color:#94A3B8;margin-top:0.1rem;display:block;">${total} reporte(s) encontrado(s)</span>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <div style="position:relative;">
            <input
              type="text"
              id="filtroTerapeutaInline"
              placeholder="Filtrar por terapeuta..."
              autocomplete="off"
              oninput="filtrarTerapeutaInline(this.value)"
              style="width:200px;padding:0.35rem 0.625rem 0.35rem 2rem;border:1px solid #E2E8F0;border-radius:6px;font-size:0.8125rem;font-family:inherit;color:#1E293B;background:white;outline:none;"
              onfocus="this.style.borderColor='#2563EB'" onblur="this.style.borderColor='#E2E8F0'"
            />
            <svg width="13" height="13" fill="none" stroke="#94A3B8" stroke-width="2" viewBox="0 0 24 24"
              style="position:absolute;left:0.5rem;top:50%;transform:translateY(-50%);pointer-events:none;">
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
            </svg>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="loadReportesPendientes()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/></svg>
            Actualizar
          </button>
        </div>
      </div>
      <div id="reportesListInline">
        ${renderReportesItems(lista)}
      </div>
    </div>
  `;
}

function renderReportesItems(lista) {
  if (lista.length === 0) {
    return `<div class="empty-state" style="padding:2.5rem 1.5rem;">
      <div class="empty-icon">
        <svg width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
        </svg>
      </div>
      <p>No hay reportes pendientes de revisión</p>
    </div>`;
  }

  return lista.map(r => `
    <div class="patient-item patient-item-full" onclick="loadReporte(${r.idReporte}, this)">
      <div class="patient-avatar" style="background:#FEF3C7;color:#92400E;">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div class="patient-info" style="flex:1;">
        <div class="patient-name">${esc(r.nombreTerapeuta)}</div>
        <div class="patient-meta">${folioRep(r.idReporte)} · ${fDate(r.fechaSesion)}</div>
      </div>
      <svg width="16" height="16" fill="none" stroke="#CBD5E1" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0;">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>
  `).join('');
}

function filtrarTerapeutaInline(query) {
  const q = query.trim().toLowerCase();
  const filtrados = q
    ? todosLosReportes.filter(r => r.nombreTerapeuta.toLowerCase().includes(q))
    : todosLosReportes;
  const el = document.getElementById('reportesListInline');
  if (el) el.innerHTML = renderReportesItems(filtrados);
}

/* ===== DETALLE DE REPORTE ===== */
async function loadReporte(idReporte, itemEl) {
  if (itemEl) {
    document.querySelectorAll('.patient-item').forEach(i => i.classList.remove('active'));
    itemEl.classList.add('active');
  }
  showLoadingPanel('Cargando reporte...');

  try {
    const data = await api.get(`/reportes/${idReporte}`);
    reporteActual = data;
    renderReporte(data);
  } catch (e) {
    toast(e.message, 'error');
    showErrorPanel(e.message);
  }
}

function renderReporte(r) {
  const panel = document.getElementById('contentPanel');

  panel.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <h2 style="font-size:1rem;font-weight:700;">${folioRep(r.idDocumento)}</h2>
          <p style="font-size:0.8125rem;color:#64748B;margin-top:0.125rem;">${esc(r.nombrePaciente)} · ${fDate(r.fechaSesion)}</p>
        </div>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          ${badge(r.estado)}
          <button class="btn btn-secondary btn-sm" onclick="loadReportesPendientes()">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            Reportes
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="info-grid" style="margin-bottom:1.25rem;">
          <div class="info-item"><div class="label">EXPEDIENTE</div><div class="value">${folioExp(r.idExpediente)}</div></div>
          <div class="info-item"><div class="label">PACIENTE</div><div class="value">${esc(r.nombrePaciente)}</div></div>
          <div class="info-item"><div class="label">TERAPEUTA</div><div class="value">${esc(r.nombreTerapeuta)}</div></div>
          <div class="info-item"><div class="label">FECHA DE SESIÓN</div><div class="value">${fDate(r.fechaSesion)}</div></div>
          <div class="info-item"><div class="label">DURACIÓN</div><div class="value">${r.duracionSesion ? esc(r.duracionSesion) + ' min' : '—'}</div></div>
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
          <div class="section-title">Retroalimentación previa</div>
          <div class="report-text-block" style="border-color:#FECACA;background:#FEF2F2;">${esc(r.comentariosSupervisor)}</div>
        </div>` : ''}

        ${buildAccionesSupervisor(r)}
      </div>
    </div>
  `;
}

function buildAccionesSupervisor(r) {
  if (r.estado === 'PENDIENTE') {
    return `
      <div class="action-bar">
        <button class="btn btn-success" id="btnAprobar" onclick="aprobarReporte(${r.idDocumento})">
          Aprobar reporte
        </button>
        <button class="btn btn-danger" onclick="abrirModalRechazar(${r.idDocumento})">
          Rechazar reporte
        </button>
      </div>`;
  }
  if (r.estado === 'APROBADO') {
    return `<div class="action-bar"><div class="alert alert-success" style="margin:0;">Reporte aprobado.</div></div>`;
  }
  if (r.estado === 'RECHAZADO') {
    return `<div class="action-bar"><div class="alert alert-error" style="margin:0;">Reporte rechazado — el terapeuta puede corregirlo y reenviarlo.</div></div>`;
  }
  return '';
}

/* ===== APROBAR ===== */
async function aprobarReporte(idReporte) {
  const btn = document.getElementById('btnAprobar');
  setLoading(btn, true);
  try {
    const data = await api.patch(`/reportes/${idReporte}/aprobar`);
    toast(`${folioRep(idReporte)} aprobado`, 'success');
    reporteActual = { ...reporteActual, estado: data.estado, fechaModificacion: data.fechaModificacion };
    renderReporte(reporteActual);
  } catch (e) {
    toast(e.message, 'error');
    setLoading(btn, false);
  }
}

/* ===== RECHAZAR ===== */
function abrirModalRechazar(idReporte) {
  reporteIdParaRechazar = idReporte;
  document.getElementById('comentariosRechazo').value = '';
  openModal('modalRechazar');
}

document.getElementById('btnConfirmarRechazo').addEventListener('click', async () => {
  const btn = document.getElementById('btnConfirmarRechazo');
  const comentarios = document.getElementById('comentariosRechazo').value.trim();

  if (!comentarios) {
    setModalStatus('La retroalimentación es obligatoria', 'error');
    return;
  }

  setModalStatus('Enviando rechazo...', 'loading');
  setLoading(btn, true);
  try {
    const data = await api.patch(`/reportes/${reporteIdParaRechazar}/rechazar`, {
      comentariosSupervisor: comentarios,
    });
    closeModal('modalRechazar');
    setModalStatus('');
    toast(`${folioRep(reporteIdParaRechazar)} rechazado`, 'info');
    reporteActual = {
      ...reporteActual,
      estado: data.estado,
      comentariosSupervisor: data.comentariosSupervisor,
      fechaModificacion: data.fechaModificacion,
    };
    renderReporte(reporteActual);
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
