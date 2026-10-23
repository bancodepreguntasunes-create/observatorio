document.addEventListener('DOMContentLoaded', () => {
  const filterRole = document.getElementById('filterRole');
  const filterInstitutionType = document.getElementById('filterInstitutionType');
  const filterShift = document.getElementById('filterShift');
  const filterReason = document.getElementById('filterReason');
  const sampleCountDisplay = document.getElementById('sampleCountDisplay');

  // Elementos de la ficha de detalle
  const detailZoneCode = document.getElementById('detailZoneCode');
  const detailZoneName = document.getElementById('detailZoneName');
  const detailHeatScore = document.getElementById('detailHeatScore');
  const detailHeatCategory = document.getElementById('detailHeatCategory');
  const detailZoneDesc = document.getElementById('detailZoneDesc');
  const detailReportCount = document.getElementById('detailReportCount');
  const detailVictimRatio = document.getElementById('detailVictimRatio');
  const detailLightRatio = document.getElementById('detailLightRatio');
  const detailAreaType = document.getElementById('detailAreaType');
  const detailReasonsList = document.getElementById('detailReasonsList');
  const detailTacticalText = document.getElementById('detailTacticalText');

  let zonesData = [];
  let selectedZoneId = "C1";

  async function fetchHeatMap() {
    const role = filterRole.value;
    const instType = filterInstitutionType ? filterInstitutionType.value : "all";
    const shift = filterShift.value;
    const reason = filterReason.value;

    let url = `/api/zones?role_filter=${encodeURIComponent(role)}&shift_filter=${encodeURIComponent(shift)}&reason_filter=${encodeURIComponent(reason)}&inst_type_filter=${encodeURIComponent(instType)}`;

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Error consultando mapa de calor");
      const data = await resp.json();

      sampleCountDisplay.textContent = data.total_filtered_surveys;
      zonesData = data.zones;

      renderHeatMapPolygons(zonesData);
      updateSelectedZoneDetail(selectedZoneId);

    } catch (err) {
      console.error("Error al cargar datos GIS:", err);
    }
  }

  function renderHeatMapPolygons(zones) {
    zones.forEach(zone => {
      const poly = document.getElementById(`gis-poly-${zone.id}`);
      const labelScore = document.getElementById(`label-score-${zone.id}`);

      if (poly) {
        poly.setAttribute('fill', zone.heat_color);
        // Efecto visual si está seleccionada
        if (zone.id === selectedZoneId) {
          poly.setAttribute('stroke', '#ffffff');
          poly.setAttribute('stroke-width', '4');
        } else {
          poly.setAttribute('stroke', '#090e1f');
          poly.setAttribute('stroke-width', '2');
        }
      }

      if (labelScore) {
        labelScore.textContent = `Calor: ${zone.heat_index} / 100`;
      }
    });
  }

  function updateSelectedZoneDetail(zoneId) {
    const zone = zonesData.find(z => z.id === zoneId);
    if (!zone) return;

    detailZoneCode.textContent = zone.code;
    detailZoneName.textContent = zone.name;
    detailHeatScore.textContent = zone.heat_index;
    detailHeatScore.style.color = zone.heat_color;
    detailHeatCategory.textContent = zone.heat_category;
    detailZoneDesc.textContent = zone.description;
    detailReportCount.textContent = `${zone.reports_count} reportes (${zone.mention_percentage}%)`;
    detailVictimRatio.textContent = `${zone.victim_ratio}%`;
    detailLightRatio.textContent = `${zone.poor_light_ratio}%`;
    detailAreaType.textContent = zone.area_type;

    // Lista de motivos
    detailReasonsList.innerHTML = '';
    if (zone.top_reasons && zone.top_reasons.length > 0) {
      zone.top_reasons.forEach(([reason, count]) => {
        const item = document.createElement('div');
        item.className = 'flex justify-between items-center bg-slate-900 px-2 py-1.5 rounded border border-slate-800';
        item.innerHTML = `
          <span class="text-slate-300 truncate max-w-[200px]" title="${reason}">${reason}</span>
          <span class="text-blue-400 font-bold font-mono ml-2">${count} reps</span>
        `;
        detailReasonsList.appendChild(item);
      });
    } else {
      detailReasonsList.innerHTML = '<p class="text-slate-500 italic">No se han registrado motivos de inseguridad en esta zona.</p>';
    }

    // Recomendación táctica contextual
    let recommendation = "";
    if (zone.heat_index >= 80) {
      recommendation = `ALERTA CRÍTICA: Intervención táctica prioritaria requerida. Incrementar patrullaje preventivo continuo, subsanar puntos ciegos de alumbrado y convocar a las brigadas de convivencia.`;
    } else if (zone.heat_index >= 65) {
      recommendation = `RIESGO ELEVADO: Reorientar cuadrillas de vigilancia en horarios nocturnos (${zone.poor_light_ratio > 40 ? 'urgente revisión de luminarias' : 'control de accesos peatonales'}).`;
    } else if (zone.heat_index >= 45) {
      recommendation = `ATENCIÓN PREVENTIVA: Se observa tensión moderada. Fomentar presencia activa de personal y actividades diurnas para disuadir focos de conflicto.`;
    } else {
      recommendation = `ZONA DE CONVIVENCIA ARMÓNICA: Nivel de calor en rangos óptimos de paz y tranquilidad. Mantener protocolos ordinarios de supervisión.`;
    }
    detailTacticalText.textContent = recommendation;
  }

  // Event Listeners para clics en polígonos
  document.querySelectorAll('#gisHeatMapSvg .zone-polygon').forEach(poly => {
    poly.addEventListener('click', () => {
      selectedZoneId = poly.getAttribute('data-id');
      renderHeatMapPolygons(zonesData);
      updateSelectedZoneDetail(selectedZoneId);
    });
  });

  // Filtros reactivos
  filterRole.addEventListener('change', fetchHeatMap);
  if (filterInstitutionType) filterInstitutionType.addEventListener('change', fetchHeatMap);
  filterShift.addEventListener('change', fetchHeatMap);
  filterReason.addEventListener('change', fetchHeatMap);

  // Carga inicial
  fetchHeatMap();
});
