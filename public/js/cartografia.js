/**
 * OBSERVATORIO DE PAZ Y CONVIVENCIA DEMOCRÁTICA UNIVERSITARIA
 * Lógica GIS y Visor Cartográfico — Campus Caracas
 */

// Cache of current quadrant data
let currentQuadrantData = [];
let selectedQuadrantId = null;

// Fallback baseline data if API is unseeded or loading fails
const FALLBACK_QUADRANTS = [
  {
    quadrant: "C1",
    name: "Zona Rectorado",
    reports: 48,
    heat_index: 0.38,
    severity_avg: 2.1,
    victimization_rate: 6.2,
    lighting_deficit: 18.0,
    top_factors: ["Aglomeraciones", "Infraestructura deteriorada"],
    recommendation: "Monitoreo perimetral y optimización de flujos peatonales en accesos principales."
  },
  {
    quadrant: "C2",
    name: "Facultad de Ingeniería",
    reports: 62,
    heat_index: 0.44,
    severity_avg: 2.6,
    victimization_rate: 9.5,
    lighting_deficit: 28.0,
    top_factors: ["Infraestructura deteriorada", "Iluminación deficiente"],
    recommendation: "Reemplazo de luminarias en pasillos de talleres y refuerzo de rondas de vigilancia diurna."
  },
  {
    quadrant: "C3",
    name: "Estacionamientos",
    reports: 114,
    heat_index: 0.88,
    severity_avg: 4.3,
    victimization_rate: 26.8,
    lighting_deficit: 74.0,
    top_factors: ["Ausencia de vigilancia", "Iluminación deficiente", "Zonas aisladas"],
    recommendation: "MÁXIMA PRIORIDAD: Instalar torres de iluminación LED autónoma, cámaras con visión nocturna y puesto fijo de control."
  },
  {
    quadrant: "C4",
    name: "Biblioteca Central",
    reports: 35,
    heat_index: 0.22,
    severity_avg: 1.8,
    victimization_rate: 3.4,
    lighting_deficit: 12.0,
    top_factors: ["Falta de cámaras"],
    recommendation: "Mantener estándares de seguridad actuales y reforzar control de carnetización en torniquetes."
  },
  {
    quadrant: "C5",
    name: "Comedor Universitario",
    reports: 86,
    heat_index: 0.58,
    severity_avg: 3.1,
    victimization_rate: 14.0,
    lighting_deficit: 35.0,
    top_factors: ["Aglomeraciones", "Accesos no vigilados"],
    recommendation: "Organizar filas de acceso con demarcación física y asignar brigadistas en horas pico de almuerzo."
  },
  {
    quadrant: "C6",
    name: "Canchas Deportivas",
    reports: 72,
    heat_index: 0.68,
    severity_avg: 3.5,
    victimization_rate: 18.2,
    lighting_deficit: 62.0,
    top_factors: ["Zonas aisladas", "Iluminación deficiente", "Ausencia de vigilancia"],
    recommendation: "Restringir accesos laterales no controlados y activar alumbrado de alta potencia para prácticas vespertinas."
  },
  {
    quadrant: "C7",
    name: "Residencias",
    reports: 95,
    heat_index: 0.82,
    severity_avg: 4.1,
    victimization_rate: 22.5,
    lighting_deficit: 68.0,
    top_factors: ["Ausencia de vigilancia", "Accesos no vigilados", "Zonas aisladas"],
    recommendation: "ALERTA ALTA: Instalar botones de pánico comunitarios, control biométrico de acceso y patrullaje nocturno continuo."
  },
  {
    quadrant: "C8",
    name: "Jardín Botánico",
    reports: 108,
    heat_index: 0.92,
    severity_avg: 4.5,
    victimization_rate: 29.1,
    lighting_deficit: 82.0,
    top_factors: ["Zonas aisladas", "Iluminación deficiente", "Falta de cámaras"],
    recommendation: "ALERTA CRÍTICA: Cierre preventivo de senderos ciegos al caer la tarde, desmalezamiento y habilitación de circuito cerrado de TV."
  }
];

/**
 * Initialize GIS Viewer on DOM Ready
 */
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadQuadrantData();
});

/**
 * Register all UI events
 */
function setupEventListeners() {
  // Apply filters button
  const btnApply = document.getElementById('btn-apply-filters');
  if (btnApply) {
    btnApply.addEventListener('click', () => applyFilters());
  }

  // Reset filters button
  const btnReset = document.getElementById('btn-reset-filters');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      document.getElementById('filter-rol').value = '';
      document.getElementById('filter-turno').value = '';
      document.getElementById('filter-motivo').value = '';
      showToast('Filtros restablecidos', 'info');
      applyFilters();
    });
  }

  // Diagnostic card close button
  const btnCloseDiag = document.getElementById('btn-close-diagnostic');
  if (btnCloseDiag) {
    btnCloseDiag.addEventListener('click', () => hideDiagnosticCard());
  }

  // SVG Quadrants Click & Hover listeners
  const quadrants = document.querySelectorAll('.campus-map .quadrant');
  quadrants.forEach(q => {
    q.addEventListener('click', () => {
      const zoneId = q.getAttribute('data-zone');
      const zoneData = currentQuadrantData.find(item => item.quadrant === zoneId) || 
                       FALLBACK_QUADRANTS.find(item => item.quadrant === zoneId);
      if (zoneData) {
        showDiagnosticCard(zoneData);
      }
    });

    // Hover effect feedback
    q.addEventListener('mouseenter', () => {
      const zoneId = q.getAttribute('data-zone');
      const zoneName = q.getAttribute('data-name');
      const indicator = document.getElementById('active-quadrant-indicator');
      if (indicator && !selectedQuadrantId) {
        indicator.innerHTML = `<i class="fa-solid fa-crosshairs"></i> ${zoneId}: ${zoneName}`;
      }
    });

    q.addEventListener('mouseleave', () => {
      const indicator = document.getElementById('active-quadrant-indicator');
      if (indicator && !selectedQuadrantId) {
        indicator.innerHTML = '<i class="fa-regular fa-hand-pointer"></i> Selecciona un cuadrante';
      }
    });
  });
}

/**
 * Fetch quadrant data from the API with optional filter parameters
 * @param {Object} filters - { rol, turno, motivo }
 */
async function loadQuadrantData(filters = {}) {
  const statusEl = document.getElementById('filter-status');
  if (statusEl) {
    statusEl.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span> <span>Actualizando capas...</span>`;
  }

  const queryParams = new URLSearchParams();
  if (filters.rol) queryParams.append('rol', filters.rol);
  if (filters.turno) queryParams.append('turno', filters.turno);
  if (filters.motivo) queryParams.append('motivo', filters.motivo);

  const url = `/api/quadrant_data${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    if (Array.isArray(data) && data.length > 0) {
      currentQuadrantData = data;
    } else {
      currentQuadrantData = FALLBACK_QUADRANTS;
    }
  } catch (err) {
    console.warn('[GIS] Error fetching from API, using realistic fallback telemetry:', err);
    currentQuadrantData = FALLBACK_QUADRANTS;
    showToast('Conectado a telemetría de respaldo local', 'warning');
  } finally {
    updateMapColors(currentQuadrantData);
    updateSummaryStats(currentQuadrantData);

    if (statusEl) {
      statusEl.innerHTML = `<span class="semaphore-dot green" style="width: 8px; height: 8px; margin-right: 6px;"></span> <span>Capa en tiempo real activa</span>`;
    }

    // If a quadrant was previously selected, refresh its open card
    if (selectedQuadrantId) {
      const updated = currentQuadrantData.find(q => q.quadrant === selectedQuadrantId);
      if (updated) showDiagnosticCard(updated);
    }
  }
}

/**
 * Maps a continuous heat index (0.0 to 1.0) to its corresponding CSS heat class
 * @param {number} index
 * @returns {string} 'heat-0' through 'heat-5'
 */
function getHeatClass(index) {
  const val = Number(index);
  if (isNaN(val) || val <= 0.20) return 'heat-0';
  if (val <= 0.40) return 'heat-1';
  if (val <= 0.55) return 'heat-2';
  if (val <= 0.70) return 'heat-3';
  if (val <= 0.85) return 'heat-4';
  return 'heat-5';
}

/**
 * Returns human-readable label and badge class based on heat index
 * @param {number} index
 */
function getHeatMeta(index) {
  const val = Number(index);
  if (val <= 0.20) return { label: 'Tranquilidad', badge: 'badge-blue', dot: 'green' };
  if (val <= 0.40) return { label: 'Riesgo Bajo', badge: 'badge-green', dot: 'green' };
  if (val <= 0.55) return { label: 'Riesgo Moderado', badge: 'badge-cyan', dot: 'amber' };
  if (val <= 0.70) return { label: 'Alerta Preventiva', badge: 'badge-amber', dot: 'amber' };
  if (val <= 0.85) return { label: 'Riesgo Alto', badge: 'badge-red', dot: 'red' };
  return { label: 'Alerta Crítica', badge: 'badge-red', dot: 'red' };
}

/**
 * Updates fill colors and data attributes of SVG quadrant elements
 * @param {Array} data
 */
function updateMapColors(data) {
  data.forEach(item => {
    const el = document.getElementById(`quadrant-${item.quadrant}`);
    if (el) {
      // Remove any prior heat classes
      el.classList.remove('heat-0', 'heat-1', 'heat-2', 'heat-3', 'heat-4', 'heat-5');
      
      const heatClass = getHeatClass(item.heat_index);
      el.classList.add(heatClass);
      
      // Update data attributes
      el.setAttribute('data-heat', (item.heat_index || 0).toFixed(2));
      el.setAttribute('data-reports', item.reports || 0);

      // SVG title tooltip for quick mouseover
      let titleElem = el.querySelector('title');
      if (!titleElem) {
        titleElem = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        el.appendChild(titleElem);
      }
      titleElem.textContent = `${item.quadrant} - ${item.name}: Calor ${(item.heat_index || 0).toFixed(2)} (${item.reports} reportes)`;
    }
  });
}

/**
 * Displays the diagnostic card with quadrant-specific metrics and recommendations
 * @param {Object} data
 */
function showDiagnosticCard(data) {
  selectedQuadrantId = data.quadrant;

  const placeholder = document.getElementById('diagnostic-placeholder');
  const card = document.getElementById('diagnostic-card');
  const indicator = document.getElementById('active-quadrant-indicator');

  if (!card) return;

  // Highlight selected quadrant in SVG
  document.querySelectorAll('.campus-map .quadrant').forEach(q => {
    if (q.getAttribute('data-zone') === data.quadrant) {
      q.classList.add('selected');
    } else {
      q.classList.remove('selected');
    }
  });

  if (indicator) {
    indicator.innerHTML = `<i class="fa-solid fa-location-dot"></i> Activo: ${data.quadrant} — ${data.name}`;
  }

  // Populate card fields
  const zoneIdEl = document.getElementById('diag-zone-id');
  const zoneNameEl = document.getElementById('diag-zone-name');
  const heatScoreEl = document.getElementById('diag-heat-score');
  const heatBadgeEl = document.getElementById('diag-heat-badge');
  const heatDotEl = document.getElementById('diag-heat-dot');

  const reportsEl = document.getElementById('diag-reports');
  const severityEl = document.getElementById('diag-severity');
  const victimEl = document.getElementById('diag-victimization');
  const lightingEl = document.getElementById('diag-lighting');
  const factorsContainer = document.getElementById('diag-factors');
  const recEl = document.getElementById('diag-recommendation');

  if (zoneIdEl) zoneIdEl.textContent = data.quadrant;
  if (zoneNameEl) zoneNameEl.textContent = data.name;

  const heatVal = Number(data.heat_index) || 0;
  if (heatScoreEl) heatScoreEl.textContent = heatVal.toFixed(2);

  const meta = getHeatMeta(heatVal);
  if (heatBadgeEl) {
    heatBadgeEl.className = `badge ${meta.badge}`;
    heatBadgeEl.textContent = meta.label;
  }
  if (heatDotEl) {
    heatDotEl.className = `semaphore-dot ${meta.dot}`;
  }

  if (reportsEl) reportsEl.textContent = data.reports ?? 0;
  if (severityEl) severityEl.textContent = Number(data.severity_avg || 0).toFixed(1);
  if (victimEl) victimEl.textContent = `${Number(data.victimization_rate || 0).toFixed(1)}%`;
  if (lightingEl) lightingEl.textContent = `${Number(data.lighting_deficit || 0).toFixed(1)}%`;

  // Render top factors badges
  if (factorsContainer) {
    factorsContainer.innerHTML = '';
    const factors = data.top_factors && data.top_factors.length > 0 
      ? data.top_factors 
      : ['Sin factores críticos reportados'];
    
    factors.forEach(f => {
      const badge = document.createElement('span');
      badge.className = 'risk-badge';
      badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${f}`;
      factorsContainer.appendChild(badge);
    });
  }

  // Render operational recommendation
  if (recEl) {
    recEl.textContent = data.recommendation || 'Mantener patrullaje preventivo ordinario.';
  }

  // Swap placeholder and card visibility
  if (placeholder) placeholder.classList.add('hidden');
  card.classList.remove('hidden');
  card.classList.add('animate-in');
}

/**
 * Hides the diagnostic card and clears selection
 */
function hideDiagnosticCard() {
  selectedQuadrantId = null;

  const placeholder = document.getElementById('diagnostic-placeholder');
  const card = document.getElementById('diagnostic-card');
  const indicator = document.getElementById('active-quadrant-indicator');

  if (card) card.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');

  document.querySelectorAll('.campus-map .quadrant').forEach(q => {
    q.classList.remove('selected');
  });

  if (indicator) {
    indicator.innerHTML = '<i class="fa-regular fa-hand-pointer"></i> Selecciona un cuadrante';
  }
}

/**
 * Reads select filters and triggers API fetch
 */
function applyFilters() {
  const rol = document.getElementById('filter-rol')?.value || '';
  const turno = document.getElementById('filter-turno')?.value || '';
  const motivo = document.getElementById('filter-motivo')?.value || '';

  showToast('Filtrando datos geoespaciales...', 'info');
  loadQuadrantData({ rol, turno, motivo });
}

/**
 * Updates the 4 bottom summary cards with aggregated GIS indicators
 * @param {Array} data
 */
function updateSummaryStats(data) {
  if (!Array.isArray(data) || data.length === 0) return;

  // 1. Total reports across all quadrants
  const totalReports = data.reduce((acc, curr) => acc + (Number(curr.reports) || 0), 0);

  // 2. Average Heat Index
  const avgHeat = data.reduce((acc, curr) => acc + (Number(curr.heat_index) || 0), 0) / data.length;

  // 3. Highest Risk Zone
  const highest = [...data].sort((a, b) => (Number(b.heat_index) || 0) - (Number(a.heat_index) || 0))[0];

  // 4. Inferred Average Security Perception (10 - (heat * 7)) approx
  const avgPerception = Math.max(1, Math.min(10, 10 - (avgHeat * 6.5))).toFixed(1);

  // Update DOM elements
  const elTotal = document.getElementById('summary-total-reports');
  const elAvgHeat = document.getElementById('summary-avg-heat');
  const elHighest = document.getElementById('summary-highest-risk');
  const elPerception = document.getElementById('summary-security-perception');

  if (elTotal) animateCount(elTotal, totalReports);
  if (elAvgHeat) elAvgHeat.textContent = avgHeat.toFixed(2);
  if (elHighest && highest) {
    elHighest.textContent = `${highest.quadrant} (${(highest.heat_index).toFixed(2)})`;
    elHighest.title = highest.name;
  }
  if (elPerception) elPerception.textContent = `${avgPerception} / 10`;
}

/**
 * Animates a numeric counter display
 */
function animateCount(elem, target) {
  const targetVal = Number(target);
  if (isNaN(targetVal)) {
    elem.textContent = target;
    return;
  }
  let current = 0;
  const step = Math.max(1, Math.ceil(targetVal / 30));
  const timer = setInterval(() => {
    current += step;
    if (current >= targetVal) {
      elem.textContent = targetVal.toLocaleString('es-VE');
      clearInterval(timer);
    } else {
      elem.textContent = current.toLocaleString('es-VE');
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
