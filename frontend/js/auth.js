/* ===== AUTH MODULE =====
 * Módulo temporal de autenticación por ID.
 * Para remover: eliminar <script src="js/auth.js"> de cada HTML
 * y <script>auth.guard();</script>, luego restaurar el user-bar.
 */
(function () {
  var BASE   = 'https://sistema-de-expedientes-clinicos-tkck.onrender.com/api/v1';
  var ID_KEY   = 'clinica_user_id';
  var ROLE_KEY = 'clinica_user_role';

  var PROBES = [
    { path: '/terapeutas/mis-pacientes',            role: 'TERAPEUTA',     dest: 'terapeuta.html'    },
    { path: '/supervisores/mis-reportes-pendientes', role: 'SUPERVISOR',   dest: 'supervisor.html'   },
    { path: '/auditoria',                            role: 'ADMINISTRADOR', dest: 'administrador.html' },
  ];

  async function detectRole(id) {
    var headers = { 'Content-Type': 'application/json', 'X-User-Id': String(id) };
    for (var i = 0; i < PROBES.length; i++) {
      var p = PROBES[i];
      try {
        var res = await fetch(BASE + p.path, { method: 'GET', headers: headers });
        if (res.ok || res.status === 200) return p;
      } catch (_) {}
    }
    return null;
  }

  window.auth = {
    guard: function () {
      if (!localStorage.getItem(ID_KEY)) {
        window.location.replace('index.html');
        return false;
      }
      return true;
    },
    logout: function () {
      localStorage.removeItem(ID_KEY);
      localStorage.removeItem(ROLE_KEY);
      window.location.replace('index.html');
    },
    getId:   function () { return localStorage.getItem(ID_KEY)   || ''; },
    getRole: function () { return localStorage.getItem(ROLE_KEY) || ''; },
  };

  /* ===== LOGIN PAGE ===== */
  var loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  if (localStorage.getItem(ID_KEY)) {
    var dest = { TERAPEUTA: 'terapeuta.html', SUPERVISOR: 'supervisor.html', ADMINISTRADOR: 'administrador.html' };
    var saved = localStorage.getItem(ROLE_KEY);
    window.location.replace(dest[saved] || 'terapeuta.html');
    return;
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var idInput = document.getElementById('loginId');
    var btn     = document.getElementById('btnLogin');
    var errorEl = document.getElementById('loginError');
    var id      = (idInput.value || '').trim();

    errorEl.classList.add('hidden');

    if (!id || isNaN(id) || parseInt(id, 10) < 1) {
      errorEl.textContent = 'Ingresa un ID de usuario válido (número mayor a 0).';
      errorEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verificando...';

    var probe = await detectRole(parseInt(id, 10));

    if (probe) {
      localStorage.setItem(ID_KEY,   id);
      localStorage.setItem(ROLE_KEY, probe.role);
      window.location.href = probe.dest;
    } else {
      errorEl.textContent = 'ID no reconocido o sin acceso al sistema. Verifica con tu administrador.';
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Ingresar al sistema';
    }
  });
})();
