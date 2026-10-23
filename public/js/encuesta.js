/**
 * ============================================================
 * OBSERVATORIO DE PAZ Y CONVIVENCIA DEMOCRÁTICA UNIVERSITARIA
 * Lógica Integral del Formulario de Diagnóstico — encuesta.js
 * ============================================================
 */

// Estado global de la encuesta
let currentSection = 0;
const totalSections = 6; // Secciones 0 a 5
let selectedQuadrants = [];
let isSubmitting = false;

// ============================================================
// Inicialización del DOM y Listeners
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initConsent();
  initRoleToggle();
  initRangeSlider();
  initCampusMap();
  initStepperNavigation();
  initKeyboardNavigation();
  updateStepper();
});

/**
 * Inicializa el listener del checkbox de consentimiento
 */
function initConsent() {
  const consentCheckbox = document.getElementById('consent_checkbox');
  const btnStart = document.getElementById('btn-start');

  if (consentCheckbox && btnStart) {
    consentCheckbox.addEventListener('change', handleConsentChange);
  }
}

/**
 * Habilita o deshabilita el botón de inicio según el consentimiento
 */
function handleConsentChange() {
  const consentCheckbox = document.getElementById('consent_checkbox');
  const btnStart = document.getElementById('btn-start');
  if (!consentCheckbox || !btnStart) return;

  btnStart.disabled = !consentCheckbox.checked;
}

/**
 * Escucha cambios en el radio button de Rol para la regla de salto condicional (Q3.4)
 */
function initRoleToggle() {
  const roleRadios = document.querySelectorAll('input[name="rol"]');
  roleRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      handleRoleChange(e.target.value);
    });
  });
}

/**
 * Muestra u oculta la pregunta 3.4 (temor a represalias) si el rol es Estudiante
 * @param {string} role 
 */
function handleRoleChange(role) {
  const groupTemor = document.getElementById('group-temor-represalias');
  if (!groupTemor) return;

  if (role === 'Estudiante') {
    groupTemor.classList.remove('hidden');
  } else {
    groupTemor.classList.add('hidden');
    // Limpiar selección previa si cambia a docente u otro rol
    const temorRadios = document.querySelectorAll('input[name="temor_represalias"]');
    temorRadios.forEach(r => r.checked = false);
  }
}

/**
 * Inicializa el slider de Percepción de Seguridad (Escala 1-10)
 */
function initRangeSlider() {
  const slider = document.getElementById('percepcion_seguridad');
  const valueDisplay = document.getElementById('range-seguridad-value');

  if (slider && valueDisplay) {
    slider.addEventListener('input', (e) => {
      handleRangeChange(e.target.value);
    });
  }
}

/**
 * Actualiza el indicador visual del slider de seguridad
 * @param {string|number} value 
 */
function handleRangeChange(value) {
  const valueDisplay = document.getElementById('range-seguridad-value');
  if (!valueDisplay) return;

  const num = parseInt(value, 10);
  let statusBadge = '';
  if (num <= 3) {
    statusBadge = 'Inseguro';
  } else if (num <= 7) {
    statusBadge = 'Moderado';
  } else {
    statusBadge = 'Seguro';
  }
  valueDisplay.textContent = `${num} / 10 — ${statusBadge}`;
}

/**
 * Inicializa los eventos de clic en los 8 cuadrantes del plano SVG
 */
function initCampusMap() {
  const quadrants = document.querySelectorAll('.campus-map .quadrant');
  quadrants.forEach(quad => {
    const zone = quad.getAttribute('data-zone');
    quad.addEventListener('click', (e) => {
      e.preventDefault();
      handleQuadrantClick(zone);
    });
  });

  // También permitir clic en los grupos del cuadrante para mejor usabilidad
  const quadrantGroups = document.querySelectorAll('.campus-map .quadrant-group');
  quadrantGroups.forEach(group => {
    const zone = group.getAttribute('data-zone');
    group.style.cursor = 'pointer';
    group.addEventListener('click', (e) => {
      e.preventDefault();
      handleQuadrantClick(zone);
    });
  });
}

/**
 * Maneja la selección / deselección de cuadrantes (máximo 3)
 * @param {string} zone (C1 a C8)
 */
function handleQuadrantClick(zone) {
  if (!zone) return;

  const quadElem = document.querySelector(`.campus-map .quadrant[data-zone="${zone}"]`);
  const index = selectedQuadrants.indexOf(zone);

  if (index !== -1) {
    // Ya estaba seleccionado -> Deseleccionar
    selectedQuadrants.splice(index, 1);
    if (quadElem) quadElem.classList.remove('selected');
  } else {
    // Intentar seleccionar
    if (selectedQuadrants.length >= 3) {
      showToast('Ha alcanzado el límite máximo de 3 zonas críticas.', 'warning');
      return;
    }
    selectedQuadrants.push(zone);
    if (quadElem) quadElem.classList.add('selected');
  }

  // Actualizar contador y badge visual
  const countElem = document.getElementById('quadrant-count');
  if (countElem) {
    countElem.textContent = selectedQuadrants.length;
  }

  const badgeElem = document.getElementById('quadrant-badge');
  if (badgeElem) {
    if (selectedQuadrants.length > 0) {
      badgeElem.className = 'badge badge-cyan';
    } else {
      badgeElem.className = 'badge badge-blue';
    }
  }
}

/**
 * Permite hacer clic en los pasos completados del stepper para regresar a ellos
 */
function initStepperNavigation() {
  const steps = document.querySelectorAll('.stepper-step');
  steps.forEach(step => {
    step.addEventListener('click', () => {
      const stepIndex = parseInt(step.getAttribute('data-step'), 10);
      if (!isNaN(stepIndex) && stepIndex < currentSection) {
        navigateToSection(stepIndex);
      }
    });
  });
}

/**
 * Permite navegar con tecla Enter (sin enviar formulario accidentalmente)
 */
function initKeyboardNavigation() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'textarea') return; // Permitir saltos de línea en propuestas

      e.preventDefault();
      if (currentSection < 5) {
        nextSection();
      } else if (currentSection === 5 && !isSubmitting) {
        submitSurvey();
      }
    }
  });
}

// ============================================================
// Navegación entre Secciones y Stepper
// ============================================================

/**
 * Muestra la sección solicitada y actualiza el stepper
 * @param {number} n 
 */
function navigateToSection(n) {
  if (n < 0 || n >= totalSections) return;

  // Ocultar todas las secciones
  const sections = document.querySelectorAll('.form-section');
  sections.forEach(sec => {
    sec.classList.remove('active');
  });

  // Mostrar la sección destino
  const targetSection = document.getElementById(`section-${n}`);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.classList.add('animate-in');
  }

  currentSection = n;
  updateStepper();

  // Scroll suave al inicio del formulario para facilitar lectura en móviles y desktop
  const stepperElem = document.getElementById('survey-stepper');
  if (stepperElem) {
    const yOffset = -80;
    const y = stepperElem.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
}

/**
 * Actualiza el aspecto visual de cada paso en el stepper superior
 */
function updateStepper() {
  const steps = document.querySelectorAll('.stepper-step');
  steps.forEach(step => {
    const stepIdx = parseInt(step.getAttribute('data-step'), 10);
    const numberSpan = step.querySelector('.step-number');

    step.classList.remove('active', 'completed');

    if (stepIdx < currentSection) {
      step.classList.add('completed');
      if (numberSpan) {
        numberSpan.innerHTML = '<i class="fa-solid fa-check"></i>';
      }
    } else if (stepIdx === currentSection) {
      step.classList.add('active');
      if (numberSpan) {
        numberSpan.textContent = stepIdx;
      }
    } else {
      if (numberSpan) {
        numberSpan.textContent = stepIdx;
      }
    }
  });
}

/**
 * Avanza a la siguiente sección si la actual es válida
 */
function nextSection() {
  if (validateSection(currentSection)) {
    if (currentSection < totalSections - 1) {
      navigateToSection(currentSection + 1);
    }
  }
}

/**
 * Retrocede a la sección previa
 */
function prevSection() {
  if (currentSection > 0) {
    navigateToSection(currentSection - 1);
  }
}

// ============================================================
// Validación de Secciones
// ============================================================

/**
 * Valida los campos obligatorios de la sección actual
 * @param {number} n 
 * @returns {boolean}
 */
function validateSection(n) {
  switch (n) {
    case 0: {
      const consent = document.getElementById('consent_checkbox');
      if (!consent || !consent.checked) {
        showToast('Debe leer y aceptar el consentimiento informado para participar.', 'warning');
        return false;
      }
      return true;
    }

    case 1: {
      const rol = getRadioValue('rol');
      if (!rol) {
        showToast('Por favor seleccione su Rol Universitario.', 'warning');
        return false;
      }

      const genero = getRadioValue('genero');
      if (!genero) {
        showToast('Por favor indique su Identidad de Género.', 'warning');
        return false;
      }

      const edad = document.getElementById('edad');
      if (!edad || !edad.value) {
        showToast('Por favor seleccione su Rango de Edad.', 'warning');
        return false;
      }

      const facultad = document.getElementById('facultad');
      if (!facultad || !facultad.value) {
        showToast('Por favor seleccione su Facultad o Dependencia.', 'warning');
        return false;
      }

      const turno = getRadioValue('turno');
      if (!turno) {
        showToast('Por favor indique su Turno de Permanencia Habitual.', 'warning');
        return false;
      }

      return true;
    }

    case 2: {
      const cv = getRadioValue('conflictos_verbales');
      const af = getRadioValue('agresiones_fisicas');
      const re = getRadioValue('respeto_espacios');
      const tc = getRadioValue('trato_cordial');
      const cd = getRadioValue('canales_dialogo');

      if (!cv || !af || !re || !tc || !cd) {
        showToast('Por favor responda las 5 preguntas de la dimensión de Paz y Convivencia.', 'warning');
        return false;
      }
      return true;
    }

    case 3: {
      const so = getRadioValue('seguridad_opiniones');
      const di = getRadioValue('discriminacion_ideologica');
      const ca = getRadioValue('clima_asambleas');

      if (!so || !di || !ca) {
        showToast('Por favor responda las preguntas de Tolerancia y Pluralismo.', 'warning');
        return false;
      }

      const rol = getRadioValue('rol');
      if (rol === 'Estudiante') {
        const tr = getRadioValue('temor_represalias');
        if (!tr) {
          showToast('Como estudiante, por favor responda la pregunta 3.4 sobre temor a represalias.', 'warning');
          return false;
        }
      }
      return true;
    }

    case 4: {
      const victima = getRadioValue('victimizacion');
      if (victima === null || victima === undefined) {
        showToast('Por favor responda la pregunta 4.2 sobre victimización en el campus.', 'warning');
        return false;
      }

      const ilum = getRadioValue('iluminacion_nocturna');
      if (!ilum) {
        showToast('Por favor califique la calidad de la iluminación nocturna (pregunta 4.3).', 'warning');
        return false;
      }

      return true;
    }

    case 5: {
      // Propuestas y modo brigada son opcionales
      return true;
    }

    default:
      return true;
  }
}

// ============================================================
// Recolección de Datos
// ============================================================

/**
 * Obtiene el valor seleccionado de un grupo de radio buttons
 * @param {string} name 
 * @returns {string|null}
 */
function getRadioValue(name) {
  const checked = document.querySelector(`input[name="${name}"]:checked`);
  return checked ? checked.value : null;
}

/**
 * Obtiene los valores seleccionados de un grupo de checkboxes
 * @param {string} name 
 * @returns {string[]}
 */
function getCheckedValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  const values = [];
  checkboxes.forEach(cb => values.push(cb.value));
  return values;
}

/**
 * Reúne todas las respuestas del formulario en un objeto estructurado para el API
 * @returns {object}
 */
function collectFormData() {
  const rol = getRadioValue('rol');
  const temorVal = getRadioValue('temor_represalias');

  const data = {
    consentimiento: document.getElementById('consent_checkbox')?.checked ? 1 : 0,
    rol: rol || '',
    genero: getRadioValue('genero') || '',
    edad: document.getElementById('edad')?.value || '',
    turno: getRadioValue('turno') || '',
    facultad: document.getElementById('facultad')?.value || '',

    conflictos_verbales: parseInt(getRadioValue('conflictos_verbales') || '0', 10),
    agresiones_fisicas: parseInt(getRadioValue('agresiones_fisicas') || '0', 10),
    respeto_espacios: parseInt(getRadioValue('respeto_espacios') || '0', 10),
    trato_cordial: parseInt(getRadioValue('trato_cordial') || '0', 10),
    canales_dialogo: parseInt(getRadioValue('canales_dialogo') || '0', 10),

    seguridad_opiniones: parseInt(getRadioValue('seguridad_opiniones') || '0', 10),
    discriminacion_ideologica: parseInt(getRadioValue('discriminacion_ideologica') || '0', 10),
    clima_asambleas: parseInt(getRadioValue('clima_asambleas') || '0', 10),
    temor_represalias: (rol === 'Estudiante' && temorVal) ? parseInt(temorVal, 10) : null,

    percepcion_seguridad: parseInt(document.getElementById('percepcion_seguridad')?.value || '5', 10),
    victimizacion: parseInt(getRadioValue('victimizacion') || '0', 10),
    iluminacion_nocturna: parseInt(getRadioValue('iluminacion_nocturna') || '0', 10),

    zonas_criticas: [...selectedQuadrants],
    factores_riesgo: getCheckedValues('factores_riesgo'),
    propuestas: document.getElementById('propuestas')?.value?.trim() || '',
    modo_brigada: document.getElementById('modo_brigada')?.checked ? 1 : 0
  };

  return data;
}

// ============================================================
// Envío del Formulario (API Call)
// ============================================================

/**
 * Envía las respuestas al endpoint POST /api/submit
 */
async function submitSurvey() {
  if (isSubmitting) return;

  // Validar última sección
  if (!validateSection(5)) return;

  const data = collectFormData();
  const submitBtn = document.getElementById('btn-submit');
  const originalHtml = submitBtn ? submitBtn.innerHTML : 'Enviar';

  isSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando respuesta...';
  }

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok && (result.success || result.status === 'success' || result.id)) {
      showToast('¡Encuesta enviada con éxito! Gracias por participar.', 'success');
      showSuccessScreen();
    } else {
      const errMsg = result.detail || result.message || 'Error al procesar la encuesta. Intente nuevamente.';
      showToast(errMsg, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }
      isSubmitting = false;
    }
  } catch (e) {
    console.error('[Observatorio] Error de red en submitSurvey:', e);
    showToast('Error de conexión. Verifique su internet.', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
    }
    isSubmitting = false;
  }
}

/**
 * Muestra la pantalla final de agradecimiento
 */
function showSuccessScreen() {
  const sections = document.querySelectorAll('.form-section');
  sections.forEach(s => s.classList.remove('active'));

  const successSec = document.getElementById('section-success');
  if (successSec) {
    successSec.classList.remove('hidden');
    successSec.classList.add('active', 'animate-in');
  }

  // Marcar todos los pasos del stepper como completados
  const steps = document.querySelectorAll('.stepper-step');
  steps.forEach(step => {
    step.classList.remove('active');
    step.classList.add('completed');
    const num = step.querySelector('.step-number');
    if (num) num.innerHTML = '<i class="fa-solid fa-check"></i>';
  });

  // Scroll suave al mensaje
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Reinicia el formulario para registrar un nuevo diagnóstico
 */
function resetForm() {
  const form = document.getElementById('survey-form');
  if (form) form.reset();

  // Limpiar cuadrantes
  selectedQuadrants = [];
  const quadElements = document.querySelectorAll('.campus-map .quadrant');
  quadElements.forEach(q => q.classList.remove('selected'));

  const countElem = document.getElementById('quadrant-count');
  if (countElem) countElem.textContent = '0';

  // Reiniciar slider
  const slider = document.getElementById('percepcion_seguridad');
  if (slider) slider.value = 5;
  handleRangeChange(5);

  // Ocultar sección condicional de represalias
  const groupTemor = document.getElementById('group-temor-represalias');
  if (groupTemor) groupTemor.classList.add('hidden');

  // Ocultar pantalla de éxito
  const successSec = document.getElementById('section-success');
  if (successSec) {
    successSec.classList.add('hidden');
    successSec.classList.remove('active');
  }

  // Restaurar botón de submit
  const submitBtn = document.getElementById('btn-submit');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Diagnóstico';
  }
  isSubmitting = false;

  // Restaurar consentimiento
  handleConsentChange();

  // Navegar a sección 0
  navigateToSection(0);
}

// ============================================================
// Notificaciones Toast
// ============================================================

/**
 * Genera y muestra un toast flotante en pantalla
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let iconHtml = '<i class="fa-solid fa-circle-info" style="color: var(--accent-blue);"></i>';
  if (type === 'success') {
    iconHtml = '<i class="fa-solid fa-circle-check" style="color: var(--color-success);"></i>';
  } else if (type === 'error') {
    iconHtml = '<i class="fa-solid fa-circle-exclamation" style="color: var(--color-danger);"></i>';
  } else if (type === 'warning') {
    iconHtml = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-warning);"></i>';
  }

  toast.innerHTML = `
    ${iconHtml}
    <div style="flex: 1; font-weight: 500; font-size: var(--font-size-sm);">${message}</div>
    <button type="button" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem;" aria-label="Cerrar">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  // Botón cerrar manual
  const closeBtn = toast.querySelector('button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dismissToast(toast);
    });
  }

  container.appendChild(toast);

  // Auto-cierre tras 4.5 segundos
  setTimeout(() => {
    dismissToast(toast);
  }, 4500);
}

/**
 * Cierra y remueve el toast con animación
 * @param {HTMLElement} toast 
 */
function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.classList.add('toast-exit');
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 250);
}
