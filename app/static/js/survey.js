document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('observatorioSurveyForm');
  const userRoleSelect = document.getElementById('userRole');
  const userInstitutionType = document.getElementById('userInstitutionType');
  const userInstitutionName = document.getElementById('userInstitutionName');
  const studentConditionalQuestion = document.getElementById('studentConditionalQuestion');
  const safetyScoreInput = document.getElementById('safetyScore');
  const safetyScoreDisplay = document.getElementById('safetyScoreDisplay');
  const selectedCountBadge = document.getElementById('selectedCountBadge');
  const successModal = document.getElementById('successModal');
  const closeSuccessModalBtn = document.getElementById('closeSuccessModal');
  const fieldSurveyToggle = document.getElementById('fieldSurveyToggle');

  // Catálogo Oficial de Instituciones Universitarias Venezolanas
  const INSTITUTIONS_DATA = {
    "Universidades Públicas Nacionales y Experimentales": [
      "Universidad Bolivariana de Venezuela (UBV)",
      "Universidad de los Pueblos del Sur (UNISUR)",
      "Universidad Indígena de Venezuela (UIV)",
      "Universidad Militar Bolivariana de Venezuela (UMBV)",
      "Universidad Nacional Experimental de la Gran Caracas (UNEXCA)",
      "Universidad Nacional Experimental de la Seguridad (UNES)",
      "Universidad Nacional Experimental de Guayana (UNEG)",
      "Universidad Nacional Experimental del Magisterio Samuel Robinson (UNEM)",
      "Universidad Nacional Experimental del Táchira (UNET)",
      "Universidad Nacional Experimental Francisco de Miranda (UNEFM)",
      "Universidad Nacional Experimental de los Llanos Occidentales Ezequiel Zamora (UNELLEZ)",
      "Universidad Nacional Experimental de las Artes (UNEARTE)",
      "Universidad Pedagógica Experimental Libertador (UPEL)",
      "Universidad Nacional Experimental Politécnica Antonio José de Sucre (UNEXPO)",
      "Universidad Nacional Experimental Rafael María Baralt (UNERMB)",
      "Universidad Nacional Experimental de los Llanos Centrales Rómulo Gallegos (UNERG)",
      "Universidad Nacional Experimental Simón Rodríguez (UNESR)",
      "Universidad Nacional Experimental Politécnica de la Fuerza Armada Nacional (UNEFA)",
      "Universidad de las Ciencias de la Salud Hugo Chávez Frías (UCS)",
      "Universidad Deportiva del Sur (UDS)",
      "Universidad Internacional de las Comunicaciones (LAUICOM)",
      "Universidad Nacional Abierta (UNA)",
      "Universidad del Zulia (LUZ)",
      "Universidad de Oriente (UDO)",
      "Universidad de Carabobo (UC)",
      "Universidad Simón Bolívar (USB)",
      "Universidad de Los Andes (ULA)",
      "Universidad Central de Venezuela (UCV)",
      "Universidad Centro Occidental Lisandro Alvarado (UCLA)"
    ],
    "Universidades Politécnicas Territoriales": [
      "UPT de Falcón Alonso Gamero (UPTAG)",
      "UPT del Norte de Monagas Ludovico Silva (UMLS)",
      "UPT del estado Portuguesa Juan de Jesús Montilla (UPJM)",
      "UPT del Oeste de Sucre Clodosbaldo Russián (UPTO)",
      "UPT de Paria Luis Mariano Rivera (UPTP)",
      "UPT del estado Mérida Kléber Ramírez (UPTM)",
      "UPT de Yaracuy Arístides Bastidas (UPTYAB)",
      "UPT José Antonio Anzoátegui (UPTJAA)",
      "UPT del Zulia (UPTZ)",
      "UPT de Maracaibo (UPTMA)",
      "UPT del estado Trujillo Mario Briceño Iragorry (UPTTMBI)",
      "UPT de Puerto Cabello (UPTPC)",
      "Universidad Territorial Deltaica Francisco Tamayo (UTDFT)"
    ],
    "Universidades Privadas": [
      "Universidad Gran Mariscal de Ayacucho (UGMA)",
      "Universidad Alejandro de Humboldt (UAH)",
      "Universidad Alonso de Ojeda (UNIOJEDA)",
      "Universidad Católica Andrés Bello (UCAB)",
      "Universidad Metropolitana (UNIMET)",
      "Universidad Monteávila (UMA)",
      "Universidad Nueva Esparta (UNE)",
      "Universidad Santa María (USM)",
      "Universidad Tecnológica del Centro (UNITEC)",
      "Universidad José María Vargas (UJMV)",
      "Universidad Rafael Urdaneta (URU)",
      "Universidad Rafael Belloso Chacín (URBE)",
      "Universidad Bicentenaria de Aragua (UBA)",
      "Universidad Fermín Toro (UFT)",
      "Universidad de Falcón (UDEFA)",
      "Universidad Católica del Táchira (UCAT)",
      "Universidad Católica Cecilio Acosta",
      "Universidad de Margarita (UNIMAR)",
      "Universidad José Antonio Páez (UJAP)",
      "Universidad Privada Arturo Michelena (UAM)",
      "Universidad Panamericana del Puerto (UNIPAP)",
      "Universidad Santa Inés (USI)",
      "Universidad Valle del Momboy (UVM)",
      "Universidad Yacambú (UNY)",
      "Universidad Tecnológica Sucre"
    ],
    "Institutos Universitarios y Colegios Universitarios (Selección)": [
      "Instituto Universitario Politécnico Santiago Mariño (IUPSM)",
      "Instituto Universitario de Tecnología Industrial (IUTI)",
      "Instituto Universitario de Tecnología Juan Pablo Pérez Alfonso (IUTEPAL)",
      "Instituto Universitario de Tecnología Readic (UNIR)",
      "Instituto Universitario de Tecnología Antonio José de Sucre",
      "Instituto Universitario de Tecnología de Administración Industrial (IUTA)",
      "Instituto Universitario de Tecnología Industrial Rodolfo Loero Arismendi (IUTIRLA)",
      "Instituto Universitario de Mercadotecnia (ISUM)",
      "Instituto Universitario de Nuevas Profesiones (IUNP)",
      "Instituto Universitario de Tecnología Amazonas (IUTAMA)",
      "Instituto Universitario Adventista de Venezuela (IUNAV)",
      "Colegio Universitario Monseñor de Talavera (CUMT)",
      "Instituto Universitario Eclesiástico Santo Tomás de Aquino (IUESTA)",
      "Instituto Universitario de Tecnología de Valencia (IUTVAL)",
      "Instituto Universitario Tecnológico Américo Vespucio (IUTAV)",
      "Instituto Universitario de Tecnología Antonio Ricaurte (IUTAR)",
      "Instituto Universitario de Tecnología para la Informática",
      "Instituto Universitario de Gerencia y Tecnología (IUGT)",
      "Instituto Universitario Jesús Obrero"
    ]
  };

  // Filtrar dinámicamente el listado de universidades según el tipo de institución seleccionado
  userInstitutionType.addEventListener('change', () => {
    const selectedType = userInstitutionType.value;
    const optgroups = userInstitutionName.querySelectorAll('optgroup');

    optgroups.forEach(group => {
      const gType = group.getAttribute('data-type');
      if (!selectedType || gType === selectedType) {
        group.style.display = '';
        group.disabled = false;
        // Restaurar opciones internas
        Array.from(group.children).forEach(opt => opt.hidden = false);
      } else {
        group.style.display = 'none';
        group.disabled = true;
        Array.from(group.children).forEach(opt => opt.hidden = true);
      }
    });

    // Si la opción seleccionada actualmente está en un grupo deshabilitado, reiniciar
    const currentOpt = userInstitutionName.selectedOptions[0];
    if (currentOpt && currentOpt.parentElement && currentOpt.parentElement.tagName === 'OPTGROUP') {
      if (currentOpt.parentElement.disabled) {
        userInstitutionName.value = '';
      }
    }
  });

  // Si el usuario elige directamente una institución, sincronizar automáticamente el tipo
  userInstitutionName.addEventListener('change', () => {
    const currentOpt = userInstitutionName.selectedOptions[0];
    if (currentOpt && currentOpt.parentElement && currentOpt.parentElement.tagName === 'OPTGROUP') {
      const parentType = currentOpt.parentElement.getAttribute('data-type');
      if (parentType && userInstitutionType.value !== parentType) {
        userInstitutionType.value = parentType;
        // Ajustar visibilidad sin perder la selección
        const optgroups = userInstitutionName.querySelectorAll('optgroup');
        optgroups.forEach(group => {
          const gType = group.getAttribute('data-type');
          if (gType === parentType) {
            group.style.display = '';
            group.disabled = false;
            Array.from(group.children).forEach(opt => opt.hidden = false);
          } else {
            group.style.display = 'none';
            group.disabled = true;
            Array.from(group.children).forEach(opt => opt.hidden = true);
          }
        });
      }
    }
  });

  // Conjunto de cuadrantes seleccionados (máximo 3)
  const selectedZones = new Set();

  // 1. Manejo del slider de percepción de seguridad
  safetyScoreInput.addEventListener('input', (e) => {
    const val = e.target.value;
    safetyScoreDisplay.textContent = `${val} / 10`;
    if (val <= 3) {
      safetyScoreDisplay.className = 'text-lg font-extrabold text-red-600 bg-red-50 px-3 py-0.5 rounded-lg border border-red-200';
    } else if (val <= 6) {
      safetyScoreDisplay.className = 'text-lg font-extrabold text-amber-600 bg-amber-50 px-3 py-0.5 rounded-lg border border-amber-200';
    } else {
      safetyScoreDisplay.className = 'text-lg font-extrabold text-blue-600 bg-blue-50 px-3 py-0.5 rounded-lg border border-blue-200';
    }
  });

  // 2. Regla de Salto Condicional: Pregunta 3.3 solo para estudiantes
  userRoleSelect.addEventListener('change', () => {
    const isStudent = userRoleSelect.value === 'Estudiante';
    if (isStudent) {
      studentConditionalQuestion.classList.remove('hidden');
    } else {
      studentConditionalQuestion.classList.add('hidden');
      // Deseleccionar radios en caso de cambio
      const radios = studentConditionalQuestion.querySelectorAll('input[type="radio"]');
      radios.forEach(r => r.checked = false);
    }
  });

  // 3. Manejo interactivo del Mapa de Cuadrantes (SVG y Botones)
  function updateZoneUI() {
    selectedCountBadge.textContent = `${selectedZones.size} / 3`;

    // Actualizar polígonos del SVG
    document.querySelectorAll('.zone-polygon').forEach(poly => {
      const zid = poly.getAttribute('data-id');
      if (selectedZones.has(zid)) {
        poly.classList.add('selected');
        poly.setAttribute('fill', '#ef4444'); // Resaltar en rojo cuando está seleccionado
      } else {
        poly.classList.remove('selected');
        poly.setAttribute('fill', '#1e3a8a');
      }
    });

    // Actualizar botones de tarjetas
    document.querySelectorAll('.zone-btn').forEach(btn => {
      const zid = btn.getAttribute('data-id');
      if (selectedZones.has(zid)) {
        btn.classList.add('bg-red-900/80', 'border-red-500', 'ring-2', 'ring-red-400');
        btn.classList.remove('bg-slate-800', 'border-slate-700');
      } else {
        btn.classList.remove('bg-red-900/80', 'border-red-500', 'ring-2', 'ring-red-400');
        btn.classList.add('bg-slate-800', 'border-slate-700');
      }
    });
  }

  function toggleZone(zid) {
    if (selectedZones.has(zid)) {
      selectedZones.delete(zid);
    } else {
      if (selectedZones.size >= 3) {
        alert("Puede seleccionar un máximo de 3 zonas o cuadrantes críticos.");
        return;
      }
      selectedZones.add(zid);
    }
    updateZoneUI();
  }

  // Event listeners para los polígonos del SVG
  document.querySelectorAll('.zone-polygon').forEach(poly => {
    poly.addEventListener('click', () => {
      const zid = poly.getAttribute('data-id');
      toggleZone(zid);
    });
  });

  // Event listeners para los botones de lista
  document.querySelectorAll('.zone-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const zid = btn.getAttribute('data-id');
      toggleZone(zid);
    });
  });

  // 4. Envío del Formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const consent = document.getElementById('consentCheckbox').checked;
    if (!consent) {
      alert("Es necesario otorgar el consentimiento informado para enviar el diagnóstico.");
      return;
    }

    // Obtener valores seleccionados
    const getRadioValue = (name) => {
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : null;
    };

    const cedulaPrefix = document.getElementById('userCedulaPrefix').value;
    const cedulaNumber = document.getElementById('userCedulaNumber').value.trim();
    if (!cedulaNumber || !/^[0-9]{5,9}$/.test(cedulaNumber)) {
      alert("Por favor ingrese un número de cédula válido (de 5 a 9 dígitos numéricos).");
      document.getElementById('userCedulaNumber').focus();
      return;
    }
    const cedula = `${cedulaPrefix}${cedulaNumber}`;

    const role = userRoleSelect.value;
    const gender = document.getElementById('userGender').value;
    const age_group = document.getElementById('userAge').value;
    const shift = document.getElementById('userShift').value;
    const institution_type = userInstitutionType.value;
    const institution_name = userInstitutionName.value;

    const verbal_conflicts = parseInt(getRadioValue('verbal_conflicts'));
    const physical_aggressions = parseInt(getRadioValue('physical_aggressions'));
    const respect_common_spaces = parseInt(getRadioValue('respect_common_spaces'));
    const cordial_treatment = parseInt(getRadioValue('cordial_treatment'));
    const peaceful_channels = getRadioValue('peaceful_channels');

    const safe_expressing_opinions = getRadioValue('safe_expressing_opinions');
    const ideological_discrimination = getRadioValue('ideological_discrimination');
    const grades_affected_divergence = (role === 'Estudiante') ? (getRadioValue('grades_affected_divergence') || 'no_aplica') : 'no_aplica';
    const group_dialogue_attitude = getRadioValue('group_dialogue_attitude');

    const safety_score = parseInt(safetyScoreInput.value);
    const crime_victim = getRadioValue('crime_victim');
    const night_lighting = getRadioValue('night_lighting');

    // Motivos
    const zone_reasons = [];
    form.querySelectorAll('input[name="zone_reasons"]:checked').forEach(cb => {
      zone_reasons.push(cb.value);
    });

    const improvement_suggestion = document.getElementById('improvementSuggestion').value;

    const payload = {
      consent: true,
      is_field_survey: fieldSurveyToggle.checked,
      cedula: cedula,
      role: role,
      gender: gender,
      age_group: age_group,
      shift: shift,
      institution_type: institution_type,
      institution_name: institution_name,
      faculty: institution_name,
      campus: "Campus Central Caracas",
      verbal_conflicts: verbal_conflicts,
      physical_aggressions: physical_aggressions,
      respect_common_spaces: respect_common_spaces,
      cordial_treatment: cordial_treatment,
      peaceful_channels: peaceful_channels,
      safe_expressing_opinions: safe_expressing_opinions,
      ideological_discrimination: ideological_discrimination,
      grades_affected_divergence: grades_affected_divergence,
      group_dialogue_attitude: group_dialogue_attitude,
      safety_score: safety_score,
      crime_victim: crime_victim,
      night_lighting: night_lighting,
      selected_zones: Array.from(selectedZones),
      zone_reasons: zone_reasons,
      improvement_suggestion: improvement_suggestion
    };

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Procesando...';

    try {
      const resp = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || "Error en el servidor");
      }

      // Éxito: Mostrar modal
      successModal.classList.remove('hidden');

    } catch (err) {
      alert("Error al registrar diagnóstico: " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-sm mr-2"></i> Registrar Diagnóstico';
    }
  });

  // Modal reset para brigadas
  closeSuccessModalBtn.addEventListener('click', () => {
    successModal.classList.add('hidden');
    form.reset();
    userInstitutionName.innerHTML = '<option value="">Seleccione primero el tipo de institución...</option>';
    selectedZones.clear();
    updateZoneUI();
    safetyScoreInput.value = 7;
    safetyScoreDisplay.textContent = "7 / 10";
    studentConditionalQuestion.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
