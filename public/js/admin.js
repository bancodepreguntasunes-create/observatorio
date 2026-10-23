/**
 * OBSERVATORIO DE PAZ Y CONVIVENCIA DEMOCRÁTICA UNIVERSITARIA
 * Lógica del Panel de Control Administrativo y Auditoría (Admin Dashboard)
 */

// Global Chart.js instances
let rolesChart = null;
let factorsChart = null;

// Fallback baseline stats for demo / cold start
const FALLBACK_STATS = {
  total_surveys: 450,
  quotas: {
    estudiantes: { current: 360, target: 400, percentage: 90.0 },
    docentes: { current: 45, target: 50, percentage: 90.0 },
    administrativos: { current: 32, target: 35, percentage: 91.4 },
    obreros: { current: 13, target: 15, percentage: 86.7 },
    nocturno_estudiantes: { current: 148, target: 160, percentage: 92.5 },
    genero_paridad: {
      masculino: 218,
      femenino: 224,
      no_binario: 5,
      prefiero_no_decir: 3,
      pct_masculino: 48.4,
      pct_femenino: 49.8,
      balanced: true
    }
  },
  indicators: {
    indice_paz: 74.6,
    tolerancia_ideologica: 78.2,
    percepcion_seguridad: 6.8,
    tasa_victimizacion: 16.4
  },
  demographics: {
    roles: {
      "Estudiante": 360,
      "Docente": 45,
      "Administrativo": 32,
      "Obrero": 13
    }
  },
  top_problems: [
    { factor: "Iluminación deficiente", count: 284 },
    { factor: "Ausencia de vigilancia", count: 241 },
    { factor: "Zonas aisladas", count: 198 },
    { factor: "Falta de cámaras", count: 172 },
    { factor: "Accesos no vigilados", count: 135 },
    { factor: "Infraestructura deteriorada", count: 104 },
    { factor: "Aglomeraciones", count: 76 }
  ]
};

/**
 * Initialize Dashboard on DOM Load
 */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadStats();
});

/**
 * Register button listeners and modal hooks
 */
function setupEventListeners() {
  // Refresh button
  const btnRefresh = document.getElementById('btn-refresh-stats');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      showToast('Actualizando datos en tiempo real...', 'info');
      loadStats();
    });
  }

  // Export CSV
  const btnCsv = document.getElementById('btn-export-csv');
  if (btnCsv) {
    btnCsv.addEventListener('click', () => exportCSV());
  }

  // Export JSON
  const btnJson = document.getElementById('btn-export-json');
  if (btnJson) {
    btnJson.addEventListener('click', () => exportJSON());
  }

  // Seed sample data
  const btnSeed = document.getElementById('btn-seed');
  if (btnSeed) {
    btnSeed.addEventListener('click', () => seedData(450));
  }

  // Stress test (1000 records)
  const btnStress = document.getElementById('btn-stress-test');
  if (btnStress) {
    btnStress.addEventListener('click', () => stressTest());
  }

  // Reset database modal triggers
  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => showModal());
  }

  const btnCancelReset = document.getElementById('modal-cancel-reset');
  if (btnCancelReset) {
    btnCancelReset.addEventListener('click', () => hideModal());
  }

  const btnConfirmReset = document.getElementById('modal-confirm-reset');
  if (btnConfirmReset) {
    btnConfirmReset.addEventListener('click', () => resetDatabase());
  }

  // Close modal when clicking outside backdrop
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) hideModal();
    });
  }
}

/**
 * Fetch stats from GET /api/stats and refresh the entire dashboard
 */
async function loadStats() {
  setAuditStatus('Consultando telemetría del servidor en /api/stats...', 'info');

  try {
    const res = await fetch('/api/stats');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    // Normalize and apply fetched stats
    applyStatsData(data);
    setAuditStatus(`Datos sincronizados con éxito. Total de encuestas registradas: ${data.total_surveys ?? 0}`, 'success');
  } catch (err) {
    console.warn('[Admin] Fallback a datos simulados por error de conexión:', err);
    applyStatsData(FALLBACK_STATS);
    setAuditStatus('Operando con dataset de respaldo local (modo offline/demostración)', 'warning');
    showToast('Modo de respaldo activo con muestra representativa', 'info');
  }
}

/**
 * Apply the stats data object to DOM, quotas, indicators, and charts
 */
function applyStatsData(stats) {
  if (!stats) return;

  const quotas = stats.quotas || FALLBACK_STATS.quotas;
  const indicators = stats.indicators || FALLBACK_STATS.indicators;
  const demographics = stats.demographics || FALLBACK_STATS.demographics;
  const topProblems = stats.top_problems || FALLBACK_STATS.top_problems;

  // 1. Quotas
  updateQuotas(quotas);

  // 2. Tactical Alerts
  generateAlerts(quotas);

  // 3. Macroindicators
  updateIndicators(indicators);

  // 4. Dynamic Charts
  renderCharts(demographics, topProblems);
}

/**
 * Returns color category based on percentage achieved
 * @param {number} percentage
 * @returns {'green' | 'amber' | 'red'}
 */
function getSemaphoreColor(percentage) {
  const p = Number(percentage) || 0;
  if (p >= 80) return 'green';
  if (p >= 50) return 'amber';
  return 'red';
}

/**
 * Returns CSS class for progress bar
 * @param {number} percentage
 * @returns {'green' | 'amber' | 'red'}
 */
function getProgressBarColor(percentage) {
  return getSemaphoreColor(percentage);
}

/**
 * Update the 6 Quota Cards in Section 1
 * @param {Object} quotas
 */
function updateQuotas(quotas) {
  // 1. Estudiantes (Target 400)
  updateSingleQuotaCard({
    currentElId: 'current-estudiantes',
    badgeElId: 'badge-estudiantes',
    semElId: 'sem-estudiantes',
    progressElId: 'progress-estudiantes',
    pctElId: 'pct-estudiantes',
    current: quotas.estudiantes?.current ?? 0,
    target: quotas.estudiantes?.target ?? 400,
    percentage: quotas.estudiantes?.percentage ?? 0
  });

  // 2. Docentes (Target 50)
  updateSingleQuotaCard({
    currentElId: 'current-docentes',
    badgeElId: 'badge-docentes',
    semElId: 'sem-docentes',
    progressElId: 'progress-docentes',
    pctElId: 'pct-docentes',
    current: quotas.docentes?.current ?? 0,
    target: quotas.docentes?.target ?? 50,
    percentage: quotas.docentes?.percentage ?? 0
  });

  // 3. Administrativos (Target 35)
  updateSingleQuotaCard({
    currentElId: 'current-admin',
    badgeElId: 'badge-admin',
    semElId: 'sem-admin',
    progressElId: 'progress-admin',
    pctElId: 'pct-admin',
    current: quotas.administrativos?.current ?? 0,
    target: quotas.administrativos?.target ?? 35,
    percentage: quotas.administrativos?.percentage ?? 0
  });

  // 4. Obreros (Target 15)
  updateSingleQuotaCard({
    currentElId: 'current-obreros',
    badgeElId: 'badge-obreros',
    semElId: 'sem-obreros',
    progressElId: 'progress-obreros',
    pctElId: 'pct-obreros',
    current: quotas.obreros?.current ?? 0,
    target: quotas.obreros?.target ?? 15,
    percentage: quotas.obreros?.percentage ?? 0
  });

  // 5. Turno Nocturno (Target 160)
  const nocturnoData = quotas.nocturno_estudiantes || quotas.turno_nocturno || { current: 0, target: 160, percentage: 0 };
  updateSingleQuotaCard({
    currentElId: 'current-nocturno',
    badgeElId: 'badge-nocturno',
    semElId: 'sem-nocturno',
    progressElId: 'progress-nocturno',
    pctElId: 'pct-nocturno',
    current: nocturnoData.current ?? 0,
    target: nocturnoData.target ?? 160,
    percentage: nocturnoData.percentage ?? 0
  });

  // 6. Paridad de Género
  const gp = quotas.genero_paridad || {};
  const mCount = gp.masculino ?? 0;
  const fCount = gp.femenino ?? 0;
  const nbCount = (gp.no_binario ?? 0) + (gp.prefiero_no_decir ?? 0);
  const totalGen = mCount + fCount + nbCount || 1;

  const pctM = Math.round((mCount / totalGen) * 100);
  const pctF = Math.round((fCount / totalGen) * 100);

  const isBalanced = gp.balanced ?? (Math.abs(pctM - pctF) <= 15);
  const genColor = isBalanced ? 'green' : 'amber';

  const semGen = document.getElementById('sem-genero');
  const badgeGen = document.getElementById('badge-genero');
  const ratioText = document.getElementById('current-genero-ratio');
  const barMale = document.getElementById('progress-genero-male');

  const detM = document.getElementById('genero-detail-m');
  const detF = document.getElementById('genero-detail-f');
  const detNb = document.getElementById('genero-detail-nb');

  if (semGen) semGen.className = `semaphore-dot ${genColor}`;
  if (badgeGen) {
    badgeGen.className = `badge badge-${genColor}`;
    badgeGen.textContent = isBalanced ? 'Equilibrado' : 'Desviación';
  }
  if (ratioText) ratioText.textContent = `M: ${pctM}% / F: ${pctF}%`;
  if (barMale) barMale.style.width = `${pctM}%`;

  if (detM) detM.innerHTML = `<i class="fa-solid fa-mars text-accent-blue"></i> M: ${mCount}`;
  if (detF) detF.innerHTML = `<i class="fa-solid fa-venus text-accent-purple"></i> F: ${fCount}`;
  if (detNb) detNb.innerHTML = `Otros: ${nbCount}`;
}

/**
 * Helper to update an individual quota card
 */
function updateSingleQuotaCard({ currentElId, badgeElId, semElId, progressElId, pctElId, current, target, percentage }) {
  const currentEl = document.getElementById(currentElId);
  const badgeEl = document.getElementById(badgeElId);
  const semEl = document.getElementById(semElId);
  const progressEl = document.getElementById(progressElId);
  const pctEl = document.getElementById(pctElId);

  const pct = Math.min(100, Math.round(Number(percentage) || ((current / (target || 1)) * 100)));
  const color = getSemaphoreColor(pct);

  if (currentEl) animateNumber(currentEl, current);
  if (badgeEl) {
    badgeEl.className = `badge badge-${color}`;
    badgeEl.textContent = `${pct}%`;
  }
  if (semEl) {
    semEl.className = `semaphore-dot ${color}`;
  }
  if (progressEl) {
    progressEl.className = `progress-bar ${color}`;
    progressEl.style.width = `${pct}%`;
  }
  if (pctEl) {
    pctEl.textContent = `${pct}% alcanzado (${current}/${target})`;
  }
}

/**
 * Generate tactical alerts based on quota deficits and representative sampling rules
 * @param {Object} quotas
 */
function generateAlerts(quotas) {
  const container = document.getElementById('tactical-alerts-container');
  if (!container) return;

  const alerts = [];

  const estPct = quotas.estudiantes?.percentage ?? 0;
  const docPct = quotas.docentes?.percentage ?? 0;
  const admPct = quotas.administrativos?.percentage ?? 0;
  const obrPct = quotas.obreros?.percentage ?? 0;
  const nocData = quotas.nocturno_estudiantes || quotas.turno_nocturno || { percentage: 0 };
  const nocPct = nocData.percentage ?? 0;

  // Personal Obrero deficit
  if (obrPct < 80) {
    alerts.push({
      type: obrPct < 50 ? 'danger' : 'warning',
      icon: 'fa-triangle-exclamation',
      title: 'DÉFICIT CRÍTICO: Personal Obrero',
      desc: 'Enviar Brigada A de inmediato a áreas de mantenimiento, intendencia y talleres para completar cuota mínima representativa.'
    });
  }

  // Turno Nocturno deficit
  if (nocPct < 80) {
    alerts.push({
      type: nocPct < 50 ? 'danger' : 'warning',
      icon: 'fa-moon',
      title: 'ATENCIÓN: Turno Nocturno Sub-representado',
      desc: 'Activar Brigada B en horario de 6:00 PM a 10:00 PM en accesos peatonales, paradas de transporte y Biblioteca Central.'
    });
  }

  // Docentes deficit
  if (docPct < 80) {
    alerts.push({
      type: 'warning',
      icon: 'fa-chalkboard-user',
      title: 'DESVIACIÓN: Personal Docente',
      desc: 'Difundir enlace institucional por correo a facultades y activar abordaje en salas de profesores de Ingeniería y Ciencias.'
    });
  }

  // Estudiantes deficit
  if (estPct < 80) {
    alerts.push({
      type: 'warning',
      icon: 'fa-graduation-cap',
      title: 'RECOLECCIÓN EN CURSO: Estrato Estudiantil',
      desc: 'Desplegar voluntarios en pasillos centrales, cafetines y canchas deportivas durante cambios de hora de clase.'
    });
  }

  // If all quotas met
  if (alerts.length === 0) {
    alerts.push({
      type: 'success',
      icon: 'fa-circle-check',
      title: 'CENSO ESTRATIFICADO COMPLETADO CON ÉXITO',
      desc: 'Todas las cuotas por rol y turno han alcanzado el umbral requerido (>80%). La muestra es estadísticamente representativa y válida para el Consejo Universitario.'
    });
  }

  // Render alerts HTML
  container.innerHTML = alerts.map(a => `
    <div class="alert alert-${a.type} animate-in">
      <i class="fa-solid ${a.icon}" style="font-size: 1.25rem; margin-top: 2px;"></i>
      <div>
        <div class="font-bold" style="letter-spacing: -0.01em;">${a.title}</div>
        <div style="font-size: var(--font-size-xs); opacity: 0.95; margin-top: 2px;">${a.desc}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Update the 4 Macroindicators in Section 3
 * @param {Object} indicators
 */
function updateIndicators(indicators) {
  const paz = Number(indicators.indice_paz) || 0;
  const tol = Number(indicators.tolerancia_ideologica) || 0;
  const seg = Number(indicators.percepcion_seguridad) || 0;
  const vic = Number(indicators.tasa_victimizacion) || 0;

  const elPaz = document.getElementById('ind-paz');
  const elTol = document.getElementById('ind-tolerancia');
  const elSeg = document.getElementById('ind-seguridad');
  const elVic = document.getElementById('ind-victimizacion');

  if (elPaz) animateFloat(elPaz, paz, '/ 100');
  if (elTol) animateFloat(elTol, tol, '/ 100');
  if (elSeg) animateFloat(elSeg, seg, '/ 10');
  if (elVic) animateFloat(elVic, vic, '%');
}

/**
 * Renders Chart.js charts with dark theme aesthetics
 * @param {Object} demographics
 * @param {Array} topProblems
 */
function renderCharts(demographics, topProblems) {
  // Chart 1: Doughnut (Role Distribution)
  const rolesData = demographics?.roles || {};
  const estCount = rolesData["Estudiante"] || 360;
  const docCount = rolesData["Docente"] || 45;
  const admCount = rolesData["Administrativo"] || 32;
  const obrCount = rolesData["Obrero"] || 13;

  const canvasRoles = document.getElementById('chart-roles');
  if (canvasRoles) {
    if (rolesChart) rolesChart.destroy();

    rolesChart = new Chart(canvasRoles, {
      type: 'doughnut',
      data: {
        labels: ['Estudiantes', 'Docentes', 'Administrativos', 'Obreros'],
        datasets: [{
          data: [estCount, docCount, admCount, obrCount],
          backgroundColor: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b'],
          borderColor: '#1e293b',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: { family: 'Inter', size: 12 },
              padding: 14,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        },
        cutout: '68%'
      }
    });
  }

  // Chart 2: Horizontal Bar (Top Risk Factors Ranking)
  const canvasFactors = document.getElementById('chart-factors');
  if (canvasFactors) {
    if (factorsChart) factorsChart.destroy();

    const factors = Array.isArray(topProblems) && topProblems.length > 0 
      ? topProblems.slice(0, 7)
      : FALLBACK_STATS.top_problems;

    const factorNames = factors.map(f => f.factor || f.name || 'Factor');
    const counts = factors.map(f => f.count || 0);

    factorsChart = new Chart(canvasFactors, {
      type: 'bar',
      data: {
        labels: factorNames,
        datasets: [{
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.65)',
          borderColor: '#3b82f6',
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(6, 182, 212, 0.85)'
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
            grid: { color: 'rgba(148, 163, 184, 0.1)' }
          },
          y: {
            ticks: { color: '#f1f5f9', font: { family: 'Inter', size: 11, weight: '500' } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(148, 163, 184, 0.2)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8
          }
        }
      }
    });
  }
}

/**
 * Triggers CSV dataset download
 */
function exportCSV() {
  showToast('Generando archivo CSV con codificación UTF-8 BOM...', 'info');
  setAuditStatus('Iniciando descarga de dataset en formato CSV...', 'info');
  
  // Direct browser navigation triggers file download
  window.location.href = '/api/export_csv';
}

/**
 * Triggers JSON dataset download
 */
function exportJSON() {
  showToast('Generando archivo JSON estructurado...', 'info');
  setAuditStatus('Iniciando descarga de dataset en formato JSON...', 'info');
  
  window.location.href = '/api/export_json';
}

/**
 * Seeds the database with realistic sample surveys (e.g. 450)
 * @param {number} count
 */
async function seedData(count = 450) {
  showToast(`Precargando muestra representativa de ${count} encuestas...`, 'info');
  setAuditStatus(`Ejecutando POST /api/seed?count=${count}...`, 'info');

  const startTime = performance.now();

  try {
    const res = await fetch(`/api/seed?count=${count}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      throw new Error(`Error en servidor: ${res.status}`);
    }

    const result = await res.json();
    showToast(`¡Muestra de ${result.count || count} encuestas cargada con éxito! (${elapsed}ms)`, 'success');
    setAuditStatus(`Operación exitosa: ${result.count || count} registros insertados en ${elapsed} ms.`, 'success');
    
    // Refresh stats
    loadStats();
  } catch (err) {
    console.error('[Admin] Error en seed:', err);
    showToast('Error al conectar con la API de seed', 'error');
    setAuditStatus(`Fallo en seedData: ${err.message}`, 'error');
  }
}

/**
 * Executes a 1000-record stress test and benchmarks response time
 */
async function stressTest() {
  showToast('Iniciando Stress Test con 1,000 registros sintéticos...', 'warning');
  setAuditStatus('STRESS TEST EN CURSO: Inyectando 1,000 transacciones masivas y midiendo latencia...', 'warning');

  const startTime = performance.now();

  try {
    const res = await fetch('/api/seed?count=1000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      throw new Error(`Error en servidor: ${res.status}`);
    }

    const result = await res.json();
    const records = result.count || 1000;
    const throughput = Math.round((records / (elapsed / 1000)));

    showToast(`⚡ Stress Test finalizado: ${records} registros en ${elapsed} ms (${throughput} req/s)`, 'success');
    setAuditStatus(`STRESS TEST EXITOSO: ${records} registros insertados en ${elapsed} ms. Rendimiento: ${throughput} transacciones/segundo.`, 'success');

    // Refresh stats
    loadStats();
  } catch (err) {
    console.error('[Admin] Error en stress test:', err);
    showToast('Fallo en prueba de estrés', 'error');
    setAuditStatus(`Fallo en Stress Test: ${err.message}`, 'error');
  }
}

/**
 * Resets the database after modal confirmation
 */
async function resetDatabase() {
  hideModal();
  showToast('Reiniciando base de datos del observatorio...', 'warning');
  setAuditStatus('Ejecutando POST /api/reset (eliminación de datos y recreación de tablas)...', 'warning');

  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) {
      throw new Error(`Error al reiniciar: ${res.status}`);
    }

    showToast('Base de datos reiniciada con éxito. Tablas limpias.', 'success');
    setAuditStatus('Base de datos reiniciada. Se han purgado todos los registros de encuestas.', 'success');
    
    // Refresh stats (will show 0 or cold baseline)
    loadStats();
  } catch (err) {
    console.error('[Admin] Error en reset:', err);
    showToast('Error al reiniciar la base de datos', 'error');
    setAuditStatus(`Fallo en reinicio: ${err.message}`, 'error');
  }
}

/**
 * Modal visibility controllers
 */
function showModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.classList.add('active');
}

function hideModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (backdrop) backdrop.classList.remove('active');
}

/**
 * Helper to update the audit terminal log display
 * @param {string} text
 * @param {'info' | 'success' | 'warning' | 'error'} type
 */
function setAuditStatus(text, type = 'info') {
  const el = document.getElementById('audit-status-text');
  if (el) {
    const time = new Date().toLocaleTimeString('es-VE');
    el.textContent = `[${time}] ${text}`;
  }
}

/**
 * Animates integer count-up
 */
function animateNumber(element, target) {
  const targetVal = Number(target) || 0;
  let current = 0;
  const step = Math.max(1, Math.ceil(targetVal / 25));
  const timer = setInterval(() => {
    current += step;
    if (current >= targetVal) {
      element.textContent = targetVal.toLocaleString('es-VE');
      clearInterval(timer);
    } else {
      element.textContent = current.toLocaleString('es-VE');
    }
  }, 20);
}

/**
 * Animates float count-up
 */
function animateFloat(element, target, suffix = '') {
  const targetVal = Number(target) || 0;
  let current = 0;
  const step = targetVal / 25;
  const timer = setInterval(() => {
    current += step;
    if (current >= targetVal) {
      element.textContent = `${targetVal.toFixed(1)} ${suffix}`.trim();
      clearInterval(timer);
    } else {
      element.textContent = `${current.toFixed(1)} ${suffix}`.trim();
    }
  }, 20);
}

/**
 * Shows an animated toast notification
 * @param {string} message
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const icon = iconMap[type] || 'fa-bell';
  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="font-size: 1.2rem;"></i>
    <div style="flex: 1; font-weight: 500;">${message}</div>
    <button style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.7;" aria-label="Cerrar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  // Close button listener
  toast.querySelector('button').addEventListener('click', () => {
    dismissToast(toast);
  });

  container.appendChild(toast);

  // Auto-dismiss after 4.5 seconds
  setTimeout(() => {
    dismissToast(toast);
  }, 4500);
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains('toast-exit')) return;
  toast.classList.add('toast-exit');
  setTimeout(() => {
    toast.remove();
  }, 300);
}
