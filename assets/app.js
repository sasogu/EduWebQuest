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
const templateSource = document.getElementById("preview-template").innerHTML.trim();

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

function formatRichText(text) {
  if (!text || !text.trim()) {
    return "";
  }
  const paragraphs = text.trim().split(/\n\s*\n/);
  return paragraphs
    .map((paragraph) => {
      const safe = escapeHtml(paragraph.trim()).replace(/\n/g, "<br />");
      return `<p>${safe}</p>`;
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

function getRenderData() {
  const rich = (value) => formatRichText(value);
  return {
    title: state.title ? escapeHtml(state.title) : "Nueva WebQuest",
    subtitle: state.subtitle ? escapeHtml(state.subtitle) : "",
    introduction: rich(state.introduction),
    task: rich(state.task),
    process: state.process.map((step) => escapeHtml(step)),
    hasProcess: Boolean(state.process.length),
    resources: state.resources.map((resource) => ({
      title: escapeHtml(resource.title),
      link: sanitizeUrl(resource.link),
      notes: resource.notes ? escapeHtml(resource.notes) : ""
    })),
    hasResources: Boolean(state.resources.length),
    evaluation: rich(state.evaluation),
    conclusion: rich(state.conclusion),
    teacher_notes: rich(state.teacher_notes),
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
    item.innerHTML = `
      <span>${escapeHtml(step)}</span>
      <button type="button" class="remove-btn" data-index="${index}" aria-label="Eliminar paso">&times;</button>
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
}

function handleProcessClick(event) {
  const target = event.target;
  if (target.matches(".remove-btn")) {
    const index = Number(target.dataset.index);
    state.process.splice(index, 1);
    renderProcessList();
    updatePreview();
  }
}

function handleResourceClick(event) {
  const target = event.target;
  if (target.matches(".remove-btn")) {
    const index = Number(target.dataset.index);
    state.resources.splice(index, 1);
    renderResourceList();
    updatePreview();
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
  const fileName = state.title
    ? `${state.title.toLowerCase().replace(/\s+/g, "-")}-webquest.html`
    : "webquest.html";
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  requestAnimationFrame(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  });
  animateAction(downloadBtn, "Descargado ✓");
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
  syncForm();
  updatePreview();
  form.addEventListener("input", handleFormChanges);
  addProcessBtn.addEventListener("click", addProcessStep);
  processList.addEventListener("click", handleProcessClick);
  addResourceBtn.addEventListener("click", addResourceItem);
  resourceList.addEventListener("click", handleResourceClick);
  copyBtn.addEventListener("click", handleCopyHtml);
  downloadBtn.addEventListener("click", handleDownloadHtml);
  enhanceAccessibility();
}

document.addEventListener("DOMContentLoaded", init);
