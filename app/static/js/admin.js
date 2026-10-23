document.addEventListener('DOMContentLoaded', () => {
  let rolesChartInstance = null;
  let reasonsChartInstance = null;

  async function loadDashboard() {
    try {
      await Promise.all([
        fetchQuotas(),
        fetchStats()
      ]);
    } catch (err) {
      console.error("Error al cargar tablero administrativo:", err);
    }
  }

  // 1. Cargar Cuotas y Semáforos
  async function fetchQuotas() {
    const resp = await fetch('/api/quotas');
    if (!resp.ok) return;
    const data = await resp.json();

    document.getElementById('periodBadge').textContent = data.active_period;
    const statusBadge = document.getElementById('surveyStatusBadge');
    if (data.survey_status === 'OPEN') {
      statusBadge.className = 'px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200';
      statusBadge.textContent = '● Recolección Abierta';
    } else {
      statusBadge.className = 'px-2.5 py-0.5 rounded-full font-bold text-xs bg-red-100 text-red-800 border border-red-200';
      statusBadge.textContent = '■ Recolección Cerrada';
    }

    // Indicador de cierre
    const closureAlert = document.getElementById('sampleClosureAlert');
    if (data.is_sample_ready_for_closure) {
      closureAlert.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-2 bg-emerald-100 text-emerald-800 border-emerald-300';
      closureAlert.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600"></i><span>¡Muestra Completa! Línea Base Lista para Cierre</span>';
    } else {
      closureAlert.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center space-x-2 bg-slate-100 text-slate-700 border-slate-300';
      closureAlert.innerHTML = '<i class="fa-solid fa-hourglass-half text-amber-500"></i><span>Muestreo en Curso (' + data.overall_progress_pct + '% completado)</span>';
    }

    // Actualizar semáforos individuales
    const keys = ["estudiantes", "docentes", "administrativos", "obreros", "estudiantes_noche"];
    keys.forEach(k => {
      const q = data.quotas[k];
      if (!q) return;

      const actualEl = document.getElementById(`actual-${k}`);
      const barEl = document.getElementById(`bar-${k}`);
      const pctEl = document.getElementById(`pct-${k}`);
      const lightEl = document.getElementById(`light-${k}`);

      if (actualEl) actualEl.textContent = q.actual;
      if (barEl) {
        barEl.style.width = `${Math.min(100, q.pct)}%`;
        barEl.style.backgroundColor = q.color;
      }
      if (pctEl) {
        pctEl.textContent = `${q.pct}% (${q.label})`;
        pctEl.style.color = q.color;
      }
      if (lightEl) {
        lightEl.style.backgroundColor = q.color;
      }
    });

    // Paridad de género
    const gb = data.gender_balance;
    document.getElementById('genderRatioDisplay').textContent = `${gb.pct_female}% F / ${gb.pct_male}% M`;

    // Alertas tácticas de despliegue para brigadas
    const alertsContainer = document.getElementById('tacticalAlertsContainer');
    alertsContainer.innerHTML = '';

    if (data.tactical_alerts && data.tactical_alerts.length > 0) {
      data.tactical_alerts.forEach(alert => {
        const div = document.createElement('div');
        const isCritical = alert.level === 'CRITICAL';
        div.className = `p-3 rounded-xl border text-xs flex items-start space-x-3 ${isCritical ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`;
        div.innerHTML = `
          <i class="fa-solid ${isCritical ? 'fa-triangle-exclamation text-red-600' : 'fa-bullhorn text-amber-600'} text-base mt-0.5 shrink-0"></i>
          <div>
            <span class="font-bold uppercase tracking-wider block">${alert.team}</span>
            <p class="mt-0.5 text-slate-700 leading-snug">${alert.message}</p>
          </div>
        `;
        alertsContainer.appendChild(div);
      });
    } else if (data.is_sample_ready_for_closure) {
      alertsContainer.innerHTML = `
        <div class="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center space-x-2">
          <i class="fa-solid fa-check-double text-emerald-600 text-base"></i>
          <span>Todas las cuotas de estrato han sido alcanzadas satisfactoriamente. Proceder a la generación del informe oficial.</span>
        </div>
      `;
    }
  }

  // 2. Cargar Estadísticas y Gráficos
  async function fetchStats() {
    const resp = await fetch('/api/stats');
    if (!resp.ok) return;
    const data = await resp.json();

    // KPIs
    document.getElementById('kpiPeaceIndex').textContent = data.kpis.peace_index.toFixed(1);
    document.getElementById('kpiToleranceIndex').textContent = `${data.kpis.tolerance_index}%`;
    document.getElementById('kpiAvgSafety').textContent = `${data.kpis.avg_safety_score} / 10`;
    document.getElementById('kpiVictimizationRate').textContent = `${data.kpis.victimization_rate}%`;

    // Renderizar Gráfico de Roles (Doughnut)
    renderRolesChart(data.role_distribution);

    // Renderizar Gráfico de Motivos (Bar)
    renderReasonsChart(data.reasons_summary);

    // Propuestas Cualitativas
    renderProposals(data.recent_suggestions);
  }

  function renderRolesChart(roleDist) {
    const ctx = document.getElementById('rolesChart').getContext('2d');
    const labels = Object.keys(roleDist);
    const counts = Object.values(roleDist);

    if (rolesChartInstance) rolesChartInstance.destroy();

    rolesChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: counts,
          backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  function renderReasonsChart(reasonsSummary) {
    const ctx = document.getElementById('reasonsChart').getContext('2d');
    const topReasons = reasonsSummary.slice(0, 5);
    const labels = topReasons.map(r => r[0].length > 25 ? r[0].substring(0, 25) + '...' : r[0]);
    const counts = topReasons.map(r => r[1]);

    if (reasonsChartInstance) reasonsChartInstance.destroy();

    reasonsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Reportes',
          data: counts,
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  function renderProposals(suggestions) {
    const container = document.getElementById('proposalsContainer');
    container.innerHTML = '';

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 italic p-4 col-span-3">Aún no se han registrado propuestas cualitativas.</p>';
      return;
    }

    suggestions.forEach(item => {
      const card = document.createElement('div');
      card.className = 'p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between';
      card.innerHTML = `
        <p class="text-slate-800 italic mb-2">"${item.text}"</p>
        <div class="flex items-center justify-between text-[10px] text-slate-500 font-medium border-t border-slate-200/60 pt-1.5">
          <span class="font-bold text-blue-700">${item.role}</span>
          <span class="truncate max-w-[140px]">${item.faculty}</span>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 3. Manejadores de Auditoría y Botones
  document.getElementById('btnSeedComplete').addEventListener('click', async () => {
    if (!confirm("¿Deseas precargar 500 registros con cuotas completas del piloto de Caracas?")) return;
    const resp = await fetch('/api/admin/seed?scenario=complete', { method: 'POST' });
    const data = await resp.json();
    alert(data.message);
    loadDashboard();
  });

  document.getElementById('btnSeedDeficit').addEventListener('click', async () => {
    if (!confirm("¿Deseas precargar un escenario con déficit para ver las alertas de brigada en rojo?")) return;
    const resp = await fetch('/api/admin/seed?scenario=in_progress', { method: 'POST' });
    const data = await resp.json();
    alert(data.message);
    loadDashboard();
  });

  document.getElementById('btnStressTest').addEventListener('click', async () => {
    const btn = document.getElementById('btnStressTest');
    btn.disabled = true;
    btn.innerHTML = '<span>Ejecutando Stress Test...</span>';

    try {
      const resp = await fetch('/api/admin/simulate-stress?total_submissions=500', { method: 'POST' });
      const res = await resp.json();
      
      const card = document.getElementById('benchmarkOutputCard');
      const content = document.getElementById('benchmarkContent');
      const timeEl = document.getElementById('benchmarkTime');

      card.classList.remove('hidden');
      timeEl.textContent = `${res.benchmark.elapsed_seconds} s`;
      content.textContent = JSON.stringify(res.benchmark, null, 2);

      loadDashboard();
    } catch (err) {
      alert("Error en prueba de estrés: " + err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<div><div class="text-purple-800 font-bold text-sm mb-1 flex items-center space-x-1.5"><i class="fa-solid fa-bolt"></i><span>Simulacro Masivo (Stress)</span></div><p class="text-xs text-slate-600 leading-snug">Auditoría de concurrencia: inyecta 500 encuestas masivas midiendo tiempo y rendimiento de servidor.</p></div><span class="text-[11px] font-bold text-purple-700 mt-3 inline-block">Iniciar Benchmark &rarr;</span>';
    }
  });

  document.getElementById('btnResetDb').addEventListener('click', async () => {
    if (!confirm("ATENCIÓN: ¿Está seguro de reiniciar la base de datos para un nuevo periodo académico? Todas las encuestas actuales se eliminarán.")) return;
    const resp = await fetch('/api/admin/reset', { method: 'POST' });
    const data = await resp.json();
    alert(data.message);
    loadDashboard();
  });

  document.getElementById('toggleSurveyStatusBtn').addEventListener('click', async () => {
    const resp = await fetch('/api/admin/toggle-status', { method: 'POST' });
    const data = await resp.json();
    fetchQuotas();
  });

  // Inicializar carga
  loadDashboard();
});
