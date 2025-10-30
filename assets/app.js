const form = document.getElementById("webquest-form");
const processInput = document.getElementById("process-input");
const processList = document.getElementById("process-list");
const addProcessBtn = document.getElementById("add-process");
const resourceTitleInput = document.getElementById("resource-title");
const resourceLinkInput = document.getElementById("resource-link");
const resourceNotesInput = document.getElementById("resource-notes");
const resourceList = document.getElementById("resource-list");
const addResourceBtn = document.getElementById("add-resource");
const previewFrame = document.getElementById("preview");
const copyBtn = document.getElementById("btn-copy");
const downloadBtn = document.getElementById("btn-download");
const moodleBtn = document.getElementById("btn-download-moodle");
const saveDraftBtn = document.getElementById("btn-save-draft");
const loadDraftBtn = document.getElementById("btn-load-draft");
const loadDraftInput = document.getElementById("input-load-draft");
const templateSource = document.getElementById("preview-template").innerHTML.trim();
const layout = document.querySelector(".layout");
const formPanel = document.querySelector(".panel--form");
const previewPanel = document.querySelector(".panel--preview");
const layoutResizer = document.querySelector(".layout__resizer");

const defaultState = {
  title: "Exploradores del Sistema Solar",
  subtitle: "Un viaje colaborativo para comprender nuestro vecindario cósmico",
  introduction: `El comando espacial necesita un nuevo equipo de exploradores que documente los secretos del sistema solar. 
Durante los próximos días trabajaréis en grupos para analizar planetas, lunas y fenómenos únicos.`,
  task: `Preparad una exposición interactiva donde cada equipo presente un cuerpo celeste. 
La exposición debe incluir datos clave, curiosidades y un recurso multimedia.`,
  process: [
    "Formad equipos de 3 personas y elegid un planeta o luna.",
    "Investigad en los recursos propuestos y buscad al menos una fuente adicional fiable.",
    "Elaborad una presentación creativa con apoyo visual y un experimento o maqueta.",
    "Compartid vuestras conclusiones en una galería con el resto de la clase."
  ],
  resources: [
    {
      title: "Tour interactivo por el sistema solar",
      link: "https://solarsystem.nasa.gov",
      notes: "Recorre planetas y misiones oficiales de la NASA."
    },
    {
      title: "Simulador orbital PhET",
      link: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_es.html",
      notes: "Explora la fuerza gravitatoria de forma visual."
    }
  ],
  evaluation: `La rúbrica valora: 1) calidad de la investigación, 2) creatividad de la presentación, 3) colaboración dentro del equipo y 4) comunicación oral.`,
  conclusion: `Habéis completado con éxito vuestra misión. ¿Qué nuevos interrogantes científicos os gustaría investigar a partir de ahora?`,
  teacher_notes: `Se sugiere reservar una sesión de laboratorio para construir maquetas. Vincular con el estándar 5.ESS1-2.`,
  color: "#4355fa",
  heroImage:
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1280&q=80",
  credits: "Equipo docente de Ciencias · 2024"
};

const state = JSON.parse(JSON.stringify(defaultState));
const hasOwn = (object, property) =>
  Object.prototype.hasOwnProperty.call(object, property);

const MIN_FORM_WIDTH = 320;
const MIN_PREVIEW_WIDTH = 340;
const HANDLE_WIDTH = 12;
const LAYOUT_STORAGE_KEY = "eduwebquest:split-v1";
const DRAFT_STORAGE_KEY = "eduwebquest:draft-v1";
const CURRENT_DRAFT_VERSION = 1;
const layoutBreakpoint = window.matchMedia("(max-width: 1180px)");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeColor(value) {
  const isValid = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  return isValid.test(value) ? value : defaultState.color;
}

function sanitizeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value, "https://placeholder.local");
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
  } catch (_) {
    // ignore parsing errors
  }
  return "";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function slugify(value) {
  if (!value) return "";
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getDownloadSlug() {
  return slugify(state.title || "") || "webquest";
}

function getTitle() {
  const title = state.title?.trim();
  if (title) {
    return title;
  }
  return "WebQuest sin título";
}

function trimUrlMatch(match) {
  let url = match;
  let trailing = "";
  const trailingRegex = /[),.;!?]+$/;
  const found = url.match(trailingRegex);
  if (found) {
    trailing = found[0];
    url = url.slice(0, -trailing.length);
  }
  return { url, trailing };
}

function linkifyText(value) {
  if (!value) {
    return "";
  }
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(value)) !== null) {
    const [rawMatch] = match;
    const startIndex = match.index;
    const preceding = value.slice(lastIndex, startIndex);
    result += escapeHtml(preceding);

    const { url, trailing } = trimUrlMatch(rawMatch);
    const sanitizedHref = sanitizeUrl(url);

    if (sanitizedHref) {
      const escapedHref = escapeHtml(sanitizedHref);
      const escapedLabel = escapeHtml(url);
      result += `<a href="${escapedHref}" target="_blank" rel="noopener">${escapedLabel}</a>`;
    } else {
      result += escapeHtml(rawMatch);
    }

    if (trailing) {
      result += escapeHtml(trailing);
    }

    lastIndex = startIndex + rawMatch.length;
  }

  result += escapeHtml(value.slice(lastIndex));
  return result.replace(/\n/g, "<br />");
}

function formatRichText(text) {
  if (!text || !text.trim()) {
    return "";
  }
  const paragraphs = text.trim().split(/\n\s*\n/);
  return paragraphs
    .map((paragraph) => {
      const linked = linkifyText(paragraph.trim());
      return `<p>${linked}</p>`;
    })
    .join("");
}

function lookup(path, contextStack) {
  for (const ctx of contextStack) {
    if (ctx == null) continue;
    if (path === ".") {
      return hasOwn(ctx, ".") ? ctx["."] : ctx;
    }
    const parts = path.split(".");
    let current = ctx;
    let found = true;
    for (const part of parts) {
      if (current != null && hasOwn(current, part)) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }
    if (found && current !== undefined) {
      return current;
    }
  }
  return "";
}

function renderTemplate(template, context, parentStack = []) {
  const stack = [context, ...parentStack];
  const sectionRegex = /{{#([^}]+)}}([\s\S]*?){{\/\1}}/g;
  const tripleRegex = /{{{\s*([^}\s]+)\s*}}}/g;
  const variableRegex = /{{\s*([^#\/][^}\s]*)\s*}}/g;

  template = template.replace(sectionRegex, (_, key, inner) => {
    const value = lookup(key.trim(), stack);
    if (Array.isArray(value)) {
      if (!value.length) return "";
      return value
        .map((item) => {
          const ctx =
            item !== null && typeof item === "object" ? item : { ".": item };
          return renderTemplate(inner, ctx, stack);
        })
        .join("");
    }
    if (value) {
      const ctx =
        value !== null && typeof value === "object" ? value : { ".": value };
      return renderTemplate(inner, ctx, stack);
    }
    return "";
  });

  template = template.replace(tripleRegex, (_, key) => {
    const value = lookup(key.trim(), stack);
    return value != null ? String(value) : "";
  });

  template = template.replace(variableRegex, (_, key) => {
    const value = lookup(key.trim(), stack);
    return value != null ? escapeHtml(value) : "";
  });

  return template;
}

function getLayoutGap() {
  if (!layout) return 0;
  const gapValue = getComputedStyle(layout).gap || "0";
  const numeric = Number.parseFloat(gapValue);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getMaxFormWidth() {
  if (!layout) return MIN_FORM_WIDTH;
  const layoutRect = layout.getBoundingClientRect();
  const gap = getLayoutGap();
  const maxWidth = layoutRect.width - gap - HANDLE_WIDTH - MIN_PREVIEW_WIDTH;
  return Math.max(MIN_FORM_WIDTH, maxWidth);
}

function updateResizerAria(width) {
  if (!layoutResizer || layoutBreakpoint.matches) return;
  const currentWidth = Math.round(width);
  layoutResizer.setAttribute("aria-valuenow", String(currentWidth));
  layoutResizer.setAttribute("aria-valuemin", String(MIN_FORM_WIDTH));
  layoutResizer.setAttribute("aria-valuemax", String(Math.round(getMaxFormWidth())));
}

function setSplitWidth(width, { persist = false } = {}) {
  if (!layout || !formPanel || layoutBreakpoint.matches) {
    return null;
  }
  const clamped = Math.min(Math.max(width, MIN_FORM_WIDTH), getMaxFormWidth());
  layout.style.setProperty("--form-width", `${clamped}px`);
  updateResizerAria(clamped);
  if (persist) {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, String(clamped));
    } catch (_) {
      // ignore storage errors
    }
  }
  return clamped;
}

function applyStoredSplit() {
  if (!layout || layoutBreakpoint.matches) return;
  let stored = null;
  try {
    stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
  } catch (_) {
    // ignore storage errors
  }
  if (stored) {
    const storedWidth = Number.parseFloat(stored);
    if (Number.isFinite(storedWidth)) {
      setSplitWidth(storedWidth);
      return;
    }
  }
  if (formPanel) {
    updateResizerAria(formPanel.getBoundingClientRect().width);
  }
}

function resetSplitWidth() {
  if (!layout) return;
  layout.style.removeProperty("--form-width");
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch (_) {
    // ignore storage errors
  }
  if (!layoutBreakpoint.matches && formPanel) {
    requestAnimationFrame(() => {
      updateResizerAria(formPanel.getBoundingClientRect().width);
    });
  }
}

let resizeState = null;
let resizeRaf = null;

function buildDraftPayload() {
  return {
    version: CURRENT_DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    data: {
      title: state.title ?? "",
      subtitle: state.subtitle ?? "",
      introduction: state.introduction ?? "",
      task: state.task ?? "",
      process: Array.isArray(state.process) ? [...state.process] : [],
      resources: Array.isArray(state.resources)
        ? state.resources.map((resource) => ({
            title: resource?.title ?? "",
            link: resource?.link ?? "",
            notes: resource?.notes ?? ""
          }))
        : [],
      evaluation: state.evaluation ?? "",
      conclusion: state.conclusion ?? "",
      teacher_notes: state.teacher_notes ?? "",
      color: state.color ?? defaultState.color,
      heroImage: state.heroImage ?? "",
      credits: state.credits ?? ""
    }
  };
}

function normalizeDraftData(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const payload = raw.data && typeof raw.data === "object" ? raw.data : raw;
  const normalizeString = (value) => (typeof value === "string" ? value : "");
  const processSteps = Array.isArray(payload.process)
    ? payload.process
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];
  const resources = Array.isArray(payload.resources)
    ? payload.resources
        .map((item) => ({
          title: normalizeString(item?.title).trim(),
          link: sanitizeUrl(normalizeString(item?.link).trim()),
          notes: normalizeString(item?.notes).trim()
        }))
        .filter((resource) => resource.title && resource.link)
    : [];
  return {
    title: normalizeString(payload.title).trim(),
    subtitle: normalizeString(payload.subtitle).trim(),
    introduction: normalizeString(payload.introduction),
    task: normalizeString(payload.task),
    process: processSteps,
    resources,
    evaluation: normalizeString(payload.evaluation),
    conclusion: normalizeString(payload.conclusion),
    teacher_notes: normalizeString(payload.teacher_notes),
    color: sanitizeColor(normalizeString(payload.color).trim() || defaultState.color),
    heroImage: sanitizeUrl(normalizeString(payload.heroImage).trim()),
    credits: normalizeString(payload.credits).trim()
  };
}

function applyDraftPayload(rawDraft, { skipPersist = false } = {}) {
  const normalized = normalizeDraftData(rawDraft);
  if (!normalized) {
    throw new Error("Datos de borrador no válidos.");
  }
  state.title = normalized.title || "";
  state.subtitle = normalized.subtitle || "";
  state.introduction = normalized.introduction || "";
  state.task = normalized.task || "";
  state.process = [...normalized.process];
  state.resources = normalized.resources.map((resource) => ({ ...resource }));
  state.evaluation = normalized.evaluation || "";
  state.conclusion = normalized.conclusion || "";
  state.teacher_notes = normalized.teacher_notes || "";
  state.color = normalized.color || defaultState.color;
  state.heroImage = normalized.heroImage || "";
  state.credits = normalized.credits || "";
  syncForm();
  updatePreview();
  if (!skipPersist) {
    persistDraftToStorage();
  }
}

function persistDraftToStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  const payload = buildDraftPayload();
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudo guardar el borrador en localStorage:", error);
  }
}

function restoreDraftFromStorage() {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    applyDraftPayload(parsed, { skipPersist: true });
    return true;
  } catch (error) {
    console.warn("No se pudo restaurar el borrador almacenado:", error);
  }
  return false;
}

let draftDebounce = null;

function schedulePersistDraft() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (draftDebounce) {
    clearTimeout(draftDebounce);
  }
  draftDebounce = setTimeout(() => {
    draftDebounce = null;
    persistDraftToStorage();
  }, 400);
}

function focusProcessEditButton(index) {
  if (!processList || index < 0) return;
  requestAnimationFrame(() => {
    const button = processList.querySelector(`.chip__btn--edit[data-index="${index}"]`);
    if (button) {
      button.focus();
    }
  });
}

function startEditingProcessStep(index) {
  if (!processList) return;
  if (index < 0 || index >= state.process.length) return;
  const item = processList.querySelector(`li[data-index="${index}"]`);
  if (!item || item.classList.contains("chip--editing")) {
    return;
  }
  const currentValue = state.process[index] ?? "";
  const actions = item.querySelector(".chip__actions");
  const textSpan = item.querySelector(".chip__text");
  if (!actions || !textSpan) {
    return;
  }

  const input = document.createElement("input");
  input.type = "text";
  input.value = currentValue;
  input.className = "chip__edit-input";
  input.setAttribute("aria-label", `Editar paso ${index + 1}`);
  item.classList.add("chip--editing");
  actions.hidden = true;
  item.insertBefore(input, actions);
  textSpan.remove();

  let cancelled = false;

  const finish = (commit) => {
    const trimmed = input.value.trim();
    let changed = false;
    if (commit && trimmed && trimmed !== currentValue) {
      state.process[index] = trimmed;
      changed = true;
    }
    input.removeEventListener("blur", handleBlur);
    input.removeEventListener("keydown", handleKeydown);
    item.classList.remove("chip--editing");
    renderProcessList();
    updatePreview();
    if (changed) {
      schedulePersistDraft();
    }
    focusProcessEditButton(Math.min(index, state.process.length - 1));
  };

  const handleBlur = () => {
    if (cancelled) return;
    finish(true);
  };

  const handleKeydown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      finish(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelled = true;
      finish(false);
    }
  };

  input.addEventListener("blur", handleBlur);
  input.addEventListener("keydown", handleKeydown);
  input.focus();
  input.select();
}

function handleResizerPointerDown(event) {
  if (!layoutResizer || !formPanel || layoutBreakpoint.matches) return;
  if (event.button !== undefined && event.button !== 0 && event.pointerType === "mouse") {
    return;
  }
  event.preventDefault();
  resizeState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startWidth: formPanel.getBoundingClientRect().width
  };
  layout.classList.add("layout--resizing");
  layoutResizer.setPointerCapture(event.pointerId);
  layoutResizer.addEventListener("pointermove", handleResizerPointerMove);
  layoutResizer.addEventListener("pointerup", handleResizerPointerUp);
  layoutResizer.addEventListener("pointercancel", handleResizerPointerUp);
}

function handleResizerPointerMove(event) {
  if (!resizeState) return;
  event.preventDefault();
  const delta = event.clientX - resizeState.startX;
  const newWidth = resizeState.startWidth + delta;
  setSplitWidth(newWidth);
}

function handleResizerPointerUp(event) {
  if (!resizeState || !layoutResizer) return;
  layoutResizer.releasePointerCapture(resizeState.pointerId);
  layoutResizer.removeEventListener("pointermove", handleResizerPointerMove);
  layoutResizer.removeEventListener("pointerup", handleResizerPointerUp);
  layoutResizer.removeEventListener("pointercancel", handleResizerPointerUp);
  layout.classList.remove("layout--resizing");
  if (formPanel) {
    setSplitWidth(formPanel.getBoundingClientRect().width, { persist: true });
  }
  resizeState = null;
}

function handleResizerKeyDown(event) {
  if (!formPanel || layoutBreakpoint.matches) return;
  const step = event.shiftKey ? 64 : 24;
  let handled = false;
  if (event.key === "ArrowLeft") {
    setSplitWidth(formPanel.getBoundingClientRect().width - step, { persist: true });
    handled = true;
  } else if (event.key === "ArrowRight") {
    setSplitWidth(formPanel.getBoundingClientRect().width + step, { persist: true });
    handled = true;
  } else if (event.key === "Home") {
    setSplitWidth(MIN_FORM_WIDTH, { persist: true });
    handled = true;
  } else if (event.key === "End") {
    setSplitWidth(getMaxFormWidth(), { persist: true });
    handled = true;
  } else if (event.key === "Enter" || event.key === " ") {
    resetSplitWidth();
    handled = true;
  }
  if (handled) {
    event.preventDefault();
  }
}

function handleResizerDoubleClick(event) {
  if (layoutBreakpoint.matches) return;
  event.preventDefault();
  resetSplitWidth();
}

function handleWindowResize() {
  if (layoutBreakpoint.matches || !formPanel) return;
  const width = formPanel.getBoundingClientRect().width;
  const clamped = setSplitWidth(width);
  if (clamped != null) {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, String(clamped));
    } catch (_) {
      // ignore storage errors
    }
  }
}

function handleLayoutBreakpointChange(event) {
  if (!layout || !layoutResizer) return;
  if (event.matches) {
    layout.style.removeProperty("--form-width");
    layout.classList.remove("layout--resizing");
    layoutResizer.setAttribute("tabindex", "-1");
    layoutResizer.removeAttribute("aria-valuenow");
    layoutResizer.removeAttribute("aria-valuemin");
    layoutResizer.removeAttribute("aria-valuemax");
  } else {
    layoutResizer.setAttribute("tabindex", "0");
    applyStoredSplit();
  }
}

function setupResizableLayout() {
  if (!layout || !formPanel || !layoutResizer) {
    return;
  }

  if (typeof layoutBreakpoint.addEventListener === "function") {
    layoutBreakpoint.addEventListener("change", handleLayoutBreakpointChange);
  } else if (typeof layoutBreakpoint.addListener === "function") {
    layoutBreakpoint.addListener(handleLayoutBreakpointChange);
  }

  layoutResizer.addEventListener("pointerdown", handleResizerPointerDown);
  layoutResizer.addEventListener("keydown", handleResizerKeyDown);
  layoutResizer.addEventListener("dblclick", handleResizerDoubleClick);

  window.addEventListener("resize", () => {
    if (resizeRaf) {
      cancelAnimationFrame(resizeRaf);
    }
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      handleWindowResize();
    });
  });

  handleLayoutBreakpointChange(layoutBreakpoint);
  if (!layoutBreakpoint.matches) {
    applyStoredSplit();
  }
}

function buildMoodleManifest(title, entryFile) {
  const slug = slugify(title) || "webquest";
  const timestamp = Date.now();
  const manifestId = `MANIFEST-${slug}-${timestamp}`;
  const organizationId = `ORG-${slug}`.toUpperCase();
  const itemId = `ITEM-${slug}`.toUpperCase();
  const resourceId = `RES-${slug}`.toUpperCase();
  const safeTitle = escapeXml(title);
  const safeEntry = escapeXml(entryFile);
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(manifestId)}" version="1.1"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd">
  <metadata>
    <schema>IMS Content</schema>
    <schemaversion>1.1.4</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:string>${safeTitle}</imsmd:string>
        </imsmd:title>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <organizations default="${escapeXml(organizationId)}">
    <organization identifier="${escapeXml(organizationId)}">
      <title>${safeTitle}</title>
      <item identifier="${escapeXml(itemId)}" identifierref="${escapeXml(resourceId)}">
        <title>${safeTitle}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${escapeXml(resourceId)}" type="webcontent" href="${safeEntry}">
      <file href="${safeEntry}" />
    </resource>
  </resources>
</manifest>`;
}

function getRenderData() {
  const rich = (value) => formatRichText(value);
  const introduction = rich(state.introduction);
  const task = rich(state.task);
  const evaluation = rich(state.evaluation);
  const conclusion = rich(state.conclusion);
  const teacherNotes = rich(state.teacher_notes);
  const processSteps = state.process
    .map((step) => (typeof step === "string" ? step.trim() : ""))
    .filter(Boolean);
  const processRendered = processSteps.map((step) => linkifyText(step));
  const resources = state.resources
    .map((resource) => {
      const title = resource?.title ? escapeHtml(resource.title) : "";
      const link = sanitizeUrl(resource?.link);
      const notes = resource?.notes ? escapeHtml(resource.notes) : "";
      return {
        title,
        link,
        notes
      };
    })
    .filter((resource) => resource.title && resource.link);
  const sections = [];

  if (introduction) {
    sections.push({
      id: "introduccion",
      title: "Introducción",
      body: introduction,
      isRich: true
    });
  }

  if (task) {
    sections.push({
      id: "tarea",
      title: "Tarea",
      body: task,
      isRich: true
    });
  }

  if (processSteps.length) {
    sections.push({
      id: "proceso",
      title: "Proceso",
    process: processRendered,
      isProcess: true
    });
  }

  if (resources.length) {
    sections.push({
      id: "recursos",
      title: "Recursos",
      resources,
      isResources: true
    });
  }

  if (evaluation) {
    sections.push({
      id: "evaluacion",
      title: "Evaluación",
      body: evaluation,
      isRich: true
    });
  }

  if (conclusion) {
    sections.push({
      id: "conclusion",
      title: "Conclusión",
      body: conclusion,
      isRich: true
    });
  }

  if (teacherNotes) {
    sections.push({
      id: "profesorado",
      title: "Notas para el profesorado",
      body: teacherNotes,
      isRich: true
    });
  }

  if (!sections.length) {
    sections.push({
      id: "introduccion",
      title: "Introducción",
      body: formatRichText("Añade contenido desde el panel de la izquierda para generar tu WebQuest."),
      isRich: true
    });
  }

  sections.forEach((section, index) => {
    const next = sections[index + 1];
    if (next) {
      section.next = {
        id: next.id,
        label: next.title
      };
    }
  });
  return {
    title: state.title ? escapeHtml(state.title) : "Nueva WebQuest",
    subtitle: state.subtitle ? escapeHtml(state.subtitle) : "",
    sections,
    color: sanitizeColor(state.color),
    heroImage: sanitizeUrl(state.heroImage),
    credits: state.credits ? escapeHtml(state.credits) : ""
  };
}

function updatePreview() {
  const data = getRenderData();
  const html = renderTemplate(templateSource, data);
  previewFrame.srcdoc = html;
}

function syncForm() {
  const simpleFields = [
    "title",
    "subtitle",
    "introduction",
    "task",
    "evaluation",
    "conclusion",
    "teacher_notes",
    "heroImage",
    "credits"
  ];
  for (const field of simpleFields) {
    if (field in form.elements) {
      form.elements[field].value = state[field] ?? "";
    }
  }
  if ("color" in form.elements) {
    form.elements.color.value = sanitizeColor(state.color);
  }
  renderProcessList();
  renderResourceList();
}

function renderProcessList() {
  processList.innerHTML = "";
  state.process.forEach((step, index) => {
    const item = document.createElement("li");
    item.className = "chip";
    item.dataset.index = String(index);
    item.innerHTML = `
      <span class="chip__text">${escapeHtml(step)}</span>
      <div class="chip__actions">
        <button type="button" class="chip__btn chip__btn--edit" data-index="${index}">Editar</button>
        <button type="button" class="chip__btn chip__btn--delete" data-index="${index}" aria-label="Eliminar paso">&times;</button>
      </div>
    `;
    processList.appendChild(item);
  });
}

function renderResourceList() {
  resourceList.innerHTML = "";
  state.resources.forEach((resource, index) => {
    const item = document.createElement("li");
    item.className = "resource-item";
    item.innerHTML = `
      <strong>${escapeHtml(resource.title)}</strong>
      <a href="${sanitizeUrl(resource.link)}" target="_blank" rel="noopener">${escapeHtml(
        resource.link
      )}</a>
      ${resource.notes ? `<span>${escapeHtml(resource.notes)}</span>` : ""}
      <button type="button" class="remove-btn" data-index="${index}">Eliminar</button>
    `;
    resourceList.appendChild(item);
  });
}

function addProcessStep() {
  const value = processInput.value.trim();
  if (!value) {
    processInput.focus();
    processInput.classList.add("shake");
    setTimeout(() => processInput.classList.remove("shake"), 500);
    return;
  }
  state.process.push(value);
  processInput.value = "";
  renderProcessList();
  updatePreview();
  schedulePersistDraft();
}

function addResourceItem() {
  const title = resourceTitleInput.value.trim();
  const link = resourceLinkInput.value.trim();
  const notes = resourceNotesInput.value.trim();

  resourceLinkInput.setCustomValidity("");

  if (!title || !link) {
    if (!title) {
      resourceTitleInput.focus();
    } else {
      resourceLinkInput.focus();
    }
    return;
  }

  const sanitizedLink = sanitizeUrl(link);
  if (!sanitizedLink) {
    resourceLinkInput.setCustomValidity("Introduce un enlace válido que comience con http o https.");
    resourceLinkInput.reportValidity();
    return;
  }

  state.resources.push({
    title,
    link: sanitizedLink,
    notes
  });

  resourceTitleInput.value = "";
  resourceLinkInput.value = "";
  resourceNotesInput.value = "";
  renderResourceList();
  updatePreview();
  schedulePersistDraft();
}

function handleFormChanges(event) {
  const target = event.target;
  if (!target.name) return;
  const value = target.value;
  if (target.name === "color") {
    state.color = sanitizeColor(value);
  } else {
    state[target.name] = value;
  }
  updatePreview();
  schedulePersistDraft();
}

function handleProcessClick(event) {
  const target = event.target;
  if (target.matches(".chip__btn--delete")) {
    const index = Number(target.dataset.index);
    state.process.splice(index, 1);
    renderProcessList();
    updatePreview();
    schedulePersistDraft();
  } else if (target.matches(".chip__btn--edit")) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    if (!Number.isNaN(index)) {
      startEditingProcessStep(index);
    }
  }
}

function handleResourceClick(event) {
  const target = event.target;
  if (target.matches(".remove-btn")) {
    const index = Number(target.dataset.index);
    state.resources.splice(index, 1);
    renderResourceList();
    updatePreview();
    schedulePersistDraft();
  }
}

function buildExportHtml() {
  const data = getRenderData();
  const html = renderTemplate(templateSource, data);
  return html.trim();
}

async function handleCopyHtml() {
  const html = buildExportHtml();
  try {
    await navigator.clipboard.writeText(html);
    animateAction(copyBtn, "Copiado ✓");
  } catch (_) {
    animateAction(copyBtn, "Copia manual", true);
    console.warn("No fue posible copiar en el portapapeles desde este navegador.");
  }
}

function handleDownloadHtml() {
  const html = buildExportHtml();
  const blob = new Blob([html], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const fileName = `${getDownloadSlug()}-webquest.html`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  requestAnimationFrame(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  });
  animateAction(downloadBtn, "Descargado ✓");
}

async function handleDownloadMoodle() {
  if (!moodleBtn) return;
  if (typeof window.JSZip === "undefined") {
    animateAction(moodleBtn, "JSZip no disponible", true);
    console.warn("JSZip no está cargado. Verifica la conexión o el script CDN.");
    return;
  }

  const zip = new window.JSZip();
  const html = buildExportHtml();
  const entryFile = "index.html";
  const title = getTitle();
  const manifest = buildMoodleManifest(title, entryFile);
  zip.file(entryFile, html);
  zip.file("imsmanifest.xml", manifest);

  try {
    const blob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${getDownloadSlug()}-moodle.zip`;
    document.body.appendChild(link);
    link.click();
    requestAnimationFrame(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    });
    animateAction(moodleBtn, "Paquete Moodle ✓");
  } catch (error) {
    animateAction(moodleBtn, "Error al generar", true);
    console.error("No se pudo generar el paquete Moodle:", error);
  }
}

function handleSaveDraft() {
  if (!saveDraftBtn) return;
  try {
    persistDraftToStorage();
    const payload = buildDraftPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${getDownloadSlug()}-borrador.json`;
    document.body.appendChild(link);
    link.click();
    requestAnimationFrame(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    });
    animateAction(saveDraftBtn, "Borrador descargado ✓");
  } catch (error) {
    animateAction(saveDraftBtn, "Error al guardar", true);
    console.error("No se pudo exportar el borrador:", error);
  }
}

function handleLoadDraftClick() {
  if (!loadDraftInput) return;
  loadDraftInput.click();
}

function handleDraftFileChange(event) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result;
      const parsed = JSON.parse(typeof text === "string" ? text : "");
      applyDraftPayload(parsed, { skipPersist: false });
      if (loadDraftBtn) {
        animateAction(loadDraftBtn, "Borrador cargado ✓");
      }
    } catch (error) {
      if (loadDraftBtn) {
        animateAction(loadDraftBtn, "Error al cargar", true);
      }
      console.error("No se pudo importar el borrador:", error);
    } finally {
      input.value = "";
    }
  };
  reader.onerror = () => {
    if (loadDraftBtn) {
      animateAction(loadDraftBtn, "Error al cargar", true);
    }
    console.error("No se pudo leer el archivo de borrador.");
    input.value = "";
  };
  reader.readAsText(file, "utf-8");
}

function animateAction(button, finalLabel, isError = false) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = finalLabel;
  if (isError) {
    button.classList.add("action-btn--error");
  } else {
    button.classList.add("action-btn--success");
  }
  setTimeout(() => {
    button.disabled = false;
    button.textContent = originalText;
    button.classList.remove("action-btn--success", "action-btn--error");
  }, 1800);
}

function enhanceAccessibility() {
  processInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addProcessStep();
    }
  });
  resourceNotesInput.addEventListener("keydown", (event) => {
    if (event.metaKey && event.key.toLowerCase() === "enter") {
      event.preventDefault();
      addResourceItem();
    }
  });
}

function init() {
  restoreDraftFromStorage();
  syncForm();
  updatePreview();
  form.addEventListener("input", handleFormChanges);
  addProcessBtn.addEventListener("click", addProcessStep);
  processList.addEventListener("click", handleProcessClick);
  addResourceBtn.addEventListener("click", addResourceItem);
  resourceList.addEventListener("click", handleResourceClick);
  copyBtn.addEventListener("click", handleCopyHtml);
  downloadBtn.addEventListener("click", handleDownloadHtml);
  if (moodleBtn) {
    moodleBtn.addEventListener("click", handleDownloadMoodle);
  }
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", handleSaveDraft);
  }
  if (loadDraftBtn) {
    loadDraftBtn.addEventListener("click", handleLoadDraftClick);
  }
  if (loadDraftInput) {
    loadDraftInput.addEventListener("change", handleDraftFileChange);
  }
  setupResizableLayout();
  enhanceAccessibility();
}

document.addEventListener("DOMContentLoaded", init);
