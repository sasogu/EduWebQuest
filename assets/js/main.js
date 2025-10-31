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
const templateElement = document.getElementById("preview-template");
let templateSource = templateElement?.innerHTML.trim() ?? "";
let previewStyles = "";
let previewScript = "";
const TEMPLATE_URL = "assets/preview-template.html";
const PREVIEW_STYLE_URL = "assets/css/preview.css";
const PREVIEW_SCRIPT_URL = "assets/js/preview.js";
const layout = document.querySelector(".layout");
const formPanel = document.querySelector(".panel--form");
const previewPanel = document.querySelector(".panel--preview");
const layoutResizer = document.querySelector(".layout__resizer");
const languageSelect = document.getElementById("language-select");
const moodleModal = document.getElementById("moodle-modal");
const moodleExportConfirmBtn = document.getElementById("moodle-export-confirm");

const SERVICE_WORKER_VERSION = "v1.1.14";
const LANG_STORAGE_KEY = "eduwebquest:lang";
let lastModalTrigger = null;
let previousBodyOverflow = "";

async function loadTemplateSource() {
  if (!templateElement) {
    templateSource = "";
    previewStyles = "";
    previewScript = "";
    return;
  }
  if (templateSource && previewStyles && previewScript) {
    return;
  }
  try {
    const [templateResp, styleResp, scriptResp] = await Promise.all([
      fetch(TEMPLATE_URL, { cache: "no-cache" }),
      fetch(PREVIEW_STYLE_URL, { cache: "no-cache" }),
      fetch(PREVIEW_SCRIPT_URL, { cache: "no-cache" })
    ]);

    if (!templateResp.ok) {
      throw new Error(`HTTP ${templateResp.status}`);
    }
    if (!styleResp.ok) {
      throw new Error(`HTTP ${styleResp.status}`);
    }
    if (!scriptResp.ok) {
      throw new Error(`HTTP ${scriptResp.status}`);
    }

    const [templateText, styleText, scriptText] = await Promise.all([
      templateResp.text(),
      styleResp.text(),
      scriptResp.text()
    ]);

    templateElement.innerHTML = templateText;
    templateSource = templateText.trim();
    previewStyles = styleText.trim();
    previewScript = scriptText.trim();
  } catch (error) {
    console.error("No se pudo cargar la plantilla de vista prèvia:", error);
    templateSource = templateElement.innerHTML.trim();
    if (!templateSource) {
      templateSource =
        "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>WebQuest</title></head><body><main><p>Preview unavailable.</p></main></body></html>";
    }
    previewStyles = previewStyles || "";
    previewScript = previewScript || "";
  }
}

const translations = {
  ca: {
    locale: { code: "ca", htmlLang: "ca" },
    app: {
      beta: "Beta",
      title: "EduWebQuest Builder",
      tagline: "Crea WebQuests modernes llestes per a GitHub Pages."
    },
    actions: {
      copy: "Copia l'HTML",
      download: "Descarrega la WebQuest",
      downloadMoodle: "Descarrega per a Moodle",
      saveDraft: "Guarda l'esborrany",
      loadDraft: "Carrega l'esborrany",
      modalCancel: "Cancel·la",
      modalConfirm: "D'acord, exporta",
      copySuccess: "Copiat ✓",
      copyFallback: "Còpia manual",
      downloadSuccess: "Descarregat ✓",
      moodleUnavailable: "JSZip no disponible",
      moodleSuccess: "Paquet Moodle ✓",
      moodleError: "Error en generar",
      saveDraftSuccess: "Esborrany descarregat ✓",
      saveDraftError: "Error en guardar",
      loadDraftSuccess: "Esborrany carregat ✓",
      loadDraftError: "Error en carregar"
    },
    language: {
      label: "Idioma",
      ariaLabel: "Canvia l'idioma de l'aplicació",
      options: {
        ca: "Valencià",
        es: "Castellà",
        en: "Anglés"
      }
    },
    form: {
      heading: "Contingut de la WebQuest",
      title: {
        label: "Títol principal",
        placeholder: "Descobreix el Sistema Solar"
      },
      subtitle: {
        label: "Subtítol o lema",
        placeholder: "Un viatge col·laboratiu per l'espai"
      },
      introduction: {
        label: "Introducció",
        placeholder: "Descriu el context i motiva l'alumnat."
      },
      task: {
        label: "Tasca",
        placeholder: "Explica la missió final que han de completar."
      },
      process: {
        label: "Procés",
        placeholder: "Enganxa un o diversos passos (Ctrl/Cmd+Enter per afegir)",
        add: "Afig"
      },
      resources: {
        label: "Recursos",
        titlePlaceholder: "Nom del recurs",
        titleAria: "Nom del recurs",
        linkPlaceholder: "https://",
        linkAria: "Enllaç del recurs",
        notesPlaceholder: "Notes (opcional)",
        notesAria: "Notes del recurs",
        add: "Afig"
      },
      evaluation: {
        label: "Avaluació",
        placeholder: "Descriu la rúbrica o els criteris d'avaluació."
      },
      conclusion: {
        label: "Conclusió",
        placeholder: "Tanca l'experiència i proposa una reflexió final."
      },
      teacherNotes: {
        label: "Notes per al professorat",
        placeholder: "Pistes per a docents, estàndards o connexions curriculars."
      },
      theme: {
        heading: "Personalitza l'estètica",
        color: "Color base",
        heroImage: "Imatge de capçalera (URL)",
        heroImagePlaceholder: "https://images.unsplash.com/...",
        credits: "Autor/a o crèdits",
        creditsPlaceholder: "Equip docent 2024"
      }
    },
    layout: {
      resizer: "Ajusta l'amplària de la vista prèvia"
    },
    preview: {
      heading: "Vista prèvia en viu",
      iframeTitle: "Vista prèvia de la WebQuest",
      sidebarTitle: "Seccions",
      sidebarAria: "Seccions de la WebQuest",
      sidebarToggle: "Menú de seccions",
      visitResource: "Visita el recurs",
      next: "Següent: {{title}}",
      footerPrefix: "Creat per",
      emptyState: "Afig contingut des del panell de l'esquerra per a generar la teua WebQuest.",
      htmlLang: "ca"
    },
    sections: {
      introduction: "Introducció",
      task: "Tasca",
      process: "Procés",
      resources: "Recursos",
      evaluation: "Avaluació",
      conclusion: "Conclusió",
      teacherNotes: "Notes per al professorat"
    },
    moodleModal: {
      close: "Tanca la finestra",
      title: "Com importar la teua WebQuest a Moodle",
      intro:
        "El paquet IMS inclou la WebQuest i el manifest necessari per a Moodle. Seguix estos passos després de descarregar el fitxer ZIP:",
      steps: [
        "En Moodle, accedeix al curs i activa el mode d'edició.",
        'Fes clic en <strong>"Afig una activitat o un recurs"</strong> i tria <strong>"Contingut IMS"</strong>.',
        "Puja el fitxer ZIP generat per l'exportador i guarda els canvis.",
        "Assegura't d'activar l'opció de mostrar la taula de continguts per a facilitar la navegació entre seccions."
      ],
      note:
        "Quan actualitzes la WebQuest, torna a exportar i substituïx el fitxer en Moodle per a vore els canvis."
    },
    ui: {
      process: {
        edit: "Edita",
        editAria: "Edita el pas {{index}}",
        deleteAria: "Elimina el pas {{index}}"
      },
      resources: {
        untitled: "Recurs sense títol",
        edit: "Edita",
        delete: "Elimina",
        deleteAria: "Elimina el recurs",
        titleLabel: "Títol",
        linkLabel: "Enllaç (http/https)",
        notesLabel: "Notes (opcional)",
        save: "Guarda",
        cancel: "Cancel·la"
      }
    },
    validation: {
      resourceTitle: "Introdueix un títol.",
      resourceLink: "Introdueix un enllaç vàlid que comence per http o https."
    },
    general: {
      untitled: "WebQuest sense títol"
    },
    draft: {
      invalid: "Les dades de l'esborrany no són vàlides."
    }
  },
  es: {
    locale: { code: "es", htmlLang: "es" },
    app: {
      beta: "Beta",
      title: "EduWebQuest Builder",
      tagline: "Crea WebQuests modernas listas para GitHub Pages."
    },
    actions: {
      copy: "Copiar HTML",
      download: "Descargar WebQuest",
      downloadMoodle: "Descargar para Moodle",
      saveDraft: "Guardar borrador",
      loadDraft: "Cargar borrador",
      modalCancel: "Cancelar",
      modalConfirm: "Entendido, exportar",
      copySuccess: "Copiado ✓",
      copyFallback: "Copia manual",
      downloadSuccess: "Descargado ✓",
      moodleUnavailable: "JSZip no disponible",
      moodleSuccess: "Paquete Moodle ✓",
      moodleError: "Error al generar",
      saveDraftSuccess: "Borrador descargado ✓",
      saveDraftError: "Error al guardar",
      loadDraftSuccess: "Borrador cargado ✓",
      loadDraftError: "Error al cargar"
    },
    language: {
      label: "Idioma",
      ariaLabel: "Cambia el idioma de la aplicación",
      options: {
        ca: "Valenciano",
        es: "Castellano",
        en: "Inglés"
      }
    },
    form: {
      heading: "Contenido de la WebQuest",
      title: {
        label: "Título principal",
        placeholder: "Descubre el Sistema Solar"
      },
      subtitle: {
        label: "Subtítulo o tagline",
        placeholder: "Un viaje colaborativo por el espacio"
      },
      introduction: {
        label: "Introducción",
        placeholder: "Describe el contexto y motiva al alumnado."
      },
      task: {
        label: "Tarea",
        placeholder: "Explica la misión final que deben completar."
      },
      process: {
        label: "Proceso",
        placeholder: "Pega uno o varios pasos (Ctrl/Cmd+Enter para añadir)",
        add: "Añadir"
      },
      resources: {
        label: "Recursos",
        titlePlaceholder: "Nombre del recurso",
        titleAria: "Nombre del recurso",
        linkPlaceholder: "https://",
        linkAria: "Enlace del recurso",
        notesPlaceholder: "Notas (opcional)",
        notesAria: "Notas del recurso",
        add: "Añadir"
      },
      evaluation: {
        label: "Evaluación",
        placeholder: "Describe la rúbrica o criterios de evaluación."
      },
      conclusion: {
        label: "Conclusión",
        placeholder: "Cierra la experiencia y plantea una reflexión final."
      },
      teacherNotes: {
        label: "Notas para el profesorado",
        placeholder: "Pistas para docentes, estándares o conexiones curriculares."
      },
      theme: {
        heading: "Personaliza la estética",
        color: "Color base",
        heroImage: "Imagen de cabecera (URL)",
        heroImagePlaceholder: "https://images.unsplash.com/...",
        credits: "Autor o créditos",
        creditsPlaceholder: "Equipo docente 2024"
      }
    },
    layout: {
      resizer: "Ajusta el ancho de la vista previa"
    },
    preview: {
      heading: "Vista previa en vivo",
      iframeTitle: "Vista previa de la WebQuest",
      sidebarTitle: "Secciones",
      sidebarAria: "Secciones de la WebQuest",
      sidebarToggle: "Menú de secciones",
      visitResource: "Visitar recurso",
      next: "Siguiente: {{title}}",
      footerPrefix: "Creado por",
      emptyState: "Añade contenido desde el panel de la izquierda para generar tu WebQuest.",
      htmlLang: "es"
    },
    sections: {
      introduction: "Introducción",
      task: "Tarea",
      process: "Proceso",
      resources: "Recursos",
      evaluation: "Evaluación",
      conclusion: "Conclusión",
      teacherNotes: "Notas para el profesorado"
    },
    moodleModal: {
      close: "Cerrar ventana",
      title: "Cómo importar tu WebQuest en Moodle",
      intro:
        "El paquete IMS incluye la WebQuest y el manifiesto necesario para Moodle. Sigue estos pasos después de descargar el archivo ZIP:",
      steps: [
        "En Moodle, accede al curso y activa el modo de edición.",
        'Haz clic en <strong>"Añadir una actividad o un recurso"</strong> y elige <strong>"Contenido IMS"</strong>.',
        "Sube el archivo ZIP generado por el exportador y guarda los cambios.",
        "Asegúrate de activar la opción de mostrar la tabla de contenidos para facilitar la navegación entre secciones."
      ],
      note:
        "Cuando actualices la WebQuest, vuelve a exportar y sustituye el archivo en Moodle para ver los cambios."
    },
    ui: {
      process: {
        edit: "Editar",
        editAria: "Editar paso {{index}}",
        deleteAria: "Eliminar paso {{index}}"
      },
      resources: {
        untitled: "Recurso sin título",
        edit: "Editar",
        delete: "Eliminar",
        deleteAria: "Eliminar recurso",
        titleLabel: "Título",
        linkLabel: "Enlace (http/https)",
        notesLabel: "Notas (opcional)",
        save: "Guardar",
        cancel: "Cancelar"
      }
    },
    validation: {
      resourceTitle: "Introduce un título.",
      resourceLink: "Introduce un enlace válido que comience con http o https."
    },
    general: {
      untitled: "WebQuest sin título"
    },
    draft: {
      invalid: "Datos de borrador no válidos."
    }
  },
  en: {
    locale: { code: "en", htmlLang: "en" },
    app: {
      beta: "Beta",
      title: "EduWebQuest Builder",
      tagline: "Build modern WebQuests ready for GitHub Pages."
    },
    actions: {
      copy: "Copy HTML",
      download: "Download WebQuest",
      downloadMoodle: "Download for Moodle",
      saveDraft: "Save draft",
      loadDraft: "Load draft",
      modalCancel: "Cancel",
      modalConfirm: "Got it, export",
      copySuccess: "Copied ✓",
      copyFallback: "Copy manually",
      downloadSuccess: "Downloaded ✓",
      moodleUnavailable: "JSZip unavailable",
      moodleSuccess: "Moodle package ✓",
      moodleError: "Export failed",
      saveDraftSuccess: "Draft downloaded ✓",
      saveDraftError: "Save error",
      loadDraftSuccess: "Draft loaded ✓",
      loadDraftError: "Load error"
    },
    language: {
      label: "Language",
      ariaLabel: "Change app language",
      options: {
        ca: "Valencian",
        es: "Spanish",
        en: "English"
      }
    },
    form: {
      heading: "WebQuest content",
      title: {
        label: "Main title",
        placeholder: "Discover the Solar System"
      },
      subtitle: {
        label: "Subtitle or tagline",
        placeholder: "A collaborative journey through space"
      },
      introduction: {
        label: "Introduction",
        placeholder: "Describe the context and motivate students."
      },
      task: {
        label: "Task",
        placeholder: "Explain the final mission they must complete."
      },
      process: {
        label: "Process",
        placeholder: "Paste one or more steps (Ctrl/Cmd+Enter to add)",
        add: "Add"
      },
      resources: {
        label: "Resources",
        titlePlaceholder: "Resource name",
        titleAria: "Resource name",
        linkPlaceholder: "https://",
        linkAria: "Resource link",
        notesPlaceholder: "Notes (optional)",
        notesAria: "Resource notes",
        add: "Add"
      },
      evaluation: {
        label: "Evaluation",
        placeholder: "Describe the rubric or evaluation criteria."
      },
      conclusion: {
        label: "Conclusion",
        placeholder: "Wrap up the experience and invite reflection."
      },
      teacherNotes: {
        label: "Notes for teachers",
        placeholder: "Hints for teachers, standards or curriculum links."
      },
      theme: {
        heading: "Customize the look",
        color: "Base color",
        heroImage: "Header image (URL)",
        heroImagePlaceholder: "https://images.unsplash.com/...",
        credits: "Author or credits",
        creditsPlaceholder: "Teaching team 2024"
      }
    },
    layout: {
      resizer: "Adjust preview width"
    },
    preview: {
      heading: "Live preview",
      iframeTitle: "WebQuest preview",
      sidebarTitle: "Sections",
      sidebarAria: "WebQuest sections",
      sidebarToggle: "Sections menu",
      visitResource: "Visit resource",
      next: "Next: {{title}}",
      footerPrefix: "Created by",
      emptyState: "Add content from the left panel to generate your WebQuest.",
      htmlLang: "en"
    },
    sections: {
      introduction: "Introduction",
      task: "Task",
      process: "Process",
      resources: "Resources",
      evaluation: "Evaluation",
      conclusion: "Conclusion",
      teacherNotes: "Notes for teachers"
    },
    moodleModal: {
      close: "Close dialog",
      title: "How to import your WebQuest into Moodle",
      intro:
        "The IMS package includes the WebQuest and the manifest Moodle needs. Follow these steps after downloading the ZIP file:",
      steps: [
        "In Moodle, open the course and turn editing on.",
        'Click <strong>"Add an activity or resource"</strong> and choose <strong>"IMS content"</strong>.',
        "Upload the ZIP file generated by the exporter and save.",
        "Enable the table of contents option so learners can jump between sections."
      ],
      note:
        "Whenever you update the WebQuest, export again and replace the file in Moodle to see the changes."
    },
    ui: {
      process: {
        edit: "Edit",
        editAria: "Edit step {{index}}",
        deleteAria: "Delete step {{index}}"
      },
      resources: {
        untitled: "Untitled resource",
        edit: "Edit",
        delete: "Delete",
        deleteAria: "Delete resource",
        titleLabel: "Title",
        linkLabel: "Link (http/https)",
        notesLabel: "Notes (optional)",
        save: "Save",
        cancel: "Cancel"
      }
    },
    validation: {
      resourceTitle: "Please enter a title.",
      resourceLink: "Enter a valid link that starts with http or https."
    },
    general: {
      untitled: "Untitled WebQuest"
    },
    draft: {
      invalid: "Draft data is not valid."
    }
  }
};

let currentLocale = "ca";

function getTranslationDict(locale) {
  if (translations[locale]) {
    return translations[locale];
  }
  return translations.ca;
}

function resolveTranslation(dict, path) {
  if (!dict || !path) return null;
  const segments = path.split(".");
  let current = dict;
  for (const rawSegment of segments) {
    const segment = rawSegment.trim();
    if (!segment) continue;
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return null;
      }
      current = current[index];
      continue;
    }
    if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      return null;
    }
  }
  return current;
}

function interpolate(template, params = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : ""
  );
}

function translate(key, params = {}, locale = currentLocale) {
  const dict = getTranslationDict(locale);
  const raw = resolveTranslation(dict, key);
  if (raw == null) {
    return "";
  }
  if (typeof raw === "function") {
    return raw(params, locale);
  }
  if (typeof raw === "string") {
    if (!params || Object.keys(params).length === 0) {
      return raw;
    }
    return interpolate(raw, params);
  }
  return raw;
}

function detectInitialLocale() {
  let stored = null;
  try {
    stored = localStorage.getItem(LANG_STORAGE_KEY);
  } catch (_) {
    // ignore storage access issues
  }
  if (stored && translations[stored]) {
    return stored;
  }
  const navigatorLanguage =
    (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage)) || "";
  const normalized = navigatorLanguage.toLowerCase().slice(0, 2);
  if (translations[normalized]) {
    return normalized;
  }
  return "ca";
}

function applyTranslations(locale = currentLocale) {
  const dict = getTranslationDict(locale);
  document.documentElement.lang = dict.locale.htmlLang;
  document.title = translate("app.title", {}, locale);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (!key) return;
    const value = translate(key, {}, locale);
    if (value !== null && value !== undefined) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.getAttribute("data-i18n-html");
    if (!key) return;
    const value = translate(key, {}, locale);
    if (value !== null && value !== undefined) {
      element.innerHTML = value;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = translate(key, {}, locale);
    if (value !== null && value !== undefined) {
      element.setAttribute("placeholder", value);
    }
  });

  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const key = element.getAttribute("data-i18n-title");
    if (!key) return;
    const value = translate(key, {}, locale);
    if (value !== null && value !== undefined) {
      element.setAttribute("title", value);
    }
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria-label");
    if (!key) return;
    const value = translate(key, {}, locale);
    if (value !== null && value !== undefined) {
      element.setAttribute("aria-label", value);
    }
  });

  if (languageSelect) {
    languageSelect.value = dict.locale.code;
    languageSelect.setAttribute("aria-label", translate("language.ariaLabel", {}, locale));
  }
}

function setLocale(locale) {
  const dict = getTranslationDict(locale);
  currentLocale = dict.locale.code;
  try {
    localStorage.setItem(LANG_STORAGE_KEY, currentLocale);
  } catch (_) {
    // ignore storage errors
  }
  applyTranslations(currentLocale);
  renderProcessList();
  renderResourceList();
  updatePreview();
}

function initializeLocale() {
  currentLocale = detectInitialLocale();
  applyTranslations(currentLocale);
  if (languageSelect) {
    languageSelect.value = currentLocale;
  }
  try {
    localStorage.setItem(LANG_STORAGE_KEY, currentLocale);
  } catch (_) {
    // ignore storage errors
  }
}

const defaultState = {
  title: "Exploradors del Sistema Solar",
  subtitle: "Un viatge col·laboratiu per comprendre el nostre veïnatge còsmic",
  introduction: `El comandament espacial necessita un nou equip d'exploradors que documente els secrets del sistema solar. 
Durant els pròxims dies treballareu en grups per analitzar planetes, llunes i fenòmens singulars.`,
  task: `Prepareu una exposició interactiva on cada equip presente un cos celeste. 
La proposta ha d'incloure dades clau, curiositats i un recurs multimèdia.`,
  process: [
    "Formeu equips de 3 persones i escolliu un planeta o una lluna.",
    "Investigueu amb els recursos proposats i busqueu com a mínim una font addicional fiable.",
    "Elaboreu una presentació creativa amb suport visual i un experiment o maqueta.",
    "Compartiu les vostres conclusions en una galeria amb la resta de la classe."
  ],
  resources: [
    {
      title: "Visita interactiva al sistema solar",
      link: "https://solarsystem.nasa.gov",
      notes: "Recorre planetes i missions oficials de la NASA."
    },
    {
      title: "Simulador orbital PhET",
      link: "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_es.html",
      notes: "Explora la força gravitacional de manera visual."
    }
  ],
  evaluation: `La rúbrica valora: 1) qualitat de la investigació, 2) creativitat de la presentació, 3) col·laboració dins de l'equip i 4) comunicació oral.`,
  conclusion: `Heu completat amb èxit la vostra missió. Quins nous interrogants científics us agradaria investigar a partir d'ara?`,
  teacher_notes: `Es recomana reservar una sessió de laboratori per construir maquetes. Vincula amb l'estàndard 5.ESS1-2.`,
  color: "#4355fa",
  heroImage:
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1280&q=80",
  credits: "Equip docent de Ciències · 2024"
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

function escapeAttribute(value) {
  return escapeHtml(value)
    .replace(/\r\n?/g, " ")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ");
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
  return translate("general.untitled");
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

function findClosing(text, start, openChar, closeChar) {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === openChar) {
      depth += 1;
    } else if (char === closeChar) {
      if (depth === 0) {
        return index;
      }
      depth -= 1;
    }
  }
  return -1;
}

function renderInlineMarkdown(text, options = {}) {
  if (!text) return "";
  const { disableLinks = false } = options;
  let result = "";
  let buffer = "";

  const flushBuffer = () => {
    if (!buffer) return;
    result += linkifyText(buffer);
    buffer = "";
  };

  for (let index = 0; index < text.length; ) {
    const char = text[index];

    if (char === "\n") {
      flushBuffer();
      result += "<br />";
      index += 1;
      continue;
    }

    if (char === "`") {
      const closing = text.indexOf("`", index + 1);
      if (closing !== -1) {
        const codeContent = text.slice(index + 1, closing);
        flushBuffer();
        result += `<code>${escapeHtml(codeContent)}</code>`;
        index = closing + 1;
        continue;
      }
    }

    if (!disableLinks && char === "[") {
      const closingLabel = findClosing(text, index + 1, "[", "]");
      if (closingLabel !== -1 && text[closingLabel + 1] === "(") {
        const closingUrl = findClosing(text, closingLabel + 2, "(", ")");
        if (closingUrl !== -1) {
          const label = text.slice(index + 1, closingLabel);
          const rawTarget = text.slice(closingLabel + 2, closingUrl).trim();
          let href = rawTarget;
          let title = "";
          const titleMatch = rawTarget.match(/^(.*?)(\s+"([^"]+)")$/);
          if (titleMatch) {
            href = titleMatch[1].trim();
            title = titleMatch[3];
          }
          const sanitizedHref = sanitizeUrl(href);
          if (sanitizedHref) {
            flushBuffer();
            const labelHtml = renderInlineMarkdown(label, { disableLinks: true });
            const titleAttr = title ? ` title="${escapeAttribute(title)}"` : "";
            result += `<a href="${escapeAttribute(sanitizedHref)}" target="_blank" rel="noopener"${titleAttr}>${labelHtml}</a>`;
            index = closingUrl + 1;
            continue;
          }
        }
      }
    }

    if (text.startsWith("**", index)) {
      const closing = text.indexOf("**", index + 2);
      if (closing !== -1) {
        const content = text.slice(index + 2, closing);
        flushBuffer();
        result += `<strong>${renderInlineMarkdown(content, options)}</strong>`;
        index = closing + 2;
        continue;
      }
    }

    if (text.startsWith("__", index)) {
      const closing = text.indexOf("__", index + 2);
      if (closing !== -1) {
        const content = text.slice(index + 2, closing);
        flushBuffer();
        result += `<strong>${renderInlineMarkdown(content, options)}</strong>`;
        index = closing + 2;
        continue;
      }
    }

    if (text.startsWith("~~", index)) {
      const closing = text.indexOf("~~", index + 2);
      if (closing !== -1) {
        const content = text.slice(index + 2, closing);
        flushBuffer();
        result += `<s>${renderInlineMarkdown(content, options)}</s>`;
        index = closing + 2;
        continue;
      }
    }

    if (char === "*" && !text.startsWith("**", index)) {
      const closing = text.indexOf("*", index + 1);
      if (closing !== -1) {
        const content = text.slice(index + 1, closing);
        flushBuffer();
        result += `<em>${renderInlineMarkdown(content, options)}</em>`;
        index = closing + 1;
        continue;
      }
    }

    if (char === "_" && !text.startsWith("__", index)) {
      const closing = text.indexOf("_", index + 1);
      if (closing !== -1) {
        const content = text.slice(index + 1, closing);
        flushBuffer();
        result += `<em>${renderInlineMarkdown(content, options)}</em>`;
        index = closing + 1;
        continue;
      }
    }

    buffer += char;
    index += 1;
  }

  flushBuffer();
  return result;
}

function renderMarkdown(text, options = {}) {
  if (!text || !text.trim()) {
    return "";
  }

  if (options.inline) {
    return renderInlineMarkdown(text);
  }

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = null;
  let codeBlock = null;
  let blockquote = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const content = paragraph.join("\n").trim();
    if (content) {
      blocks.push(`<p>${renderInlineMarkdown(content)}</p>`);
    }
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item) => `<li>${item}</li>`).join("");
    blocks.push(`<${list.type}>${items}</${list.type}>`);
    list = null;
  };

  const flushBlockquote = () => {
    if (!blockquote) return;
    const inner = renderMarkdown(blockquote.join("\n"));
    if (inner) {
      blocks.push(`<blockquote>${inner}</blockquote>`);
    }
    blockquote = null;
  };

  const flushCodeBlock = () => {
    if (!codeBlock) return;
    const content = codeBlock.lines.join("\n");
    blocks.push(`<pre><code>${escapeHtml(content)}</code></pre>`);
    codeBlock = null;
  };

  const isTableRow = (value) => /^\s*\|.*\|\s*$/.test(value);
  const parseTableRow = (value) => {
    const trimmedRow = value.trim();
    const withoutEdges = trimmedRow.replace(/^\|/, "").replace(/\|$/, "");
    return withoutEdges.split("|").map((cell) => cell.trim());
  };
  const parseAlignmentRow = (value, columnCount) => {
    if (!isTableRow(value)) return null;
    const cells = parseTableRow(value);
    if (!cells.length) return null;
    const valid = cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
    if (!valid) return null;
    const alignments = cells.map((cell) => {
      const trimmedCell = cell.trim();
      const starts = trimmedCell.startsWith(":");
      const ends = trimmedCell.endsWith(":");
      if (starts && ends) return "center";
      if (starts) return "left";
      if (ends) return "right";
      return null;
    });
    while (alignments.length < columnCount) {
      alignments.push(null);
    }
    return alignments.slice(0, columnCount);
  };

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const line = rawLine.replace(/\s+$/, "");
    const trimmed = line.trim();

    if (codeBlock) {
      if (/^\s*```/.test(line)) {
        flushCodeBlock();
      } else {
        codeBlock.lines.push(rawLine);
      }
      continue;
    }

    if (/^\s*```/.test(line)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      codeBlock = { lines: [] };
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    if (/^\s*([-*_]){3,}\s*$/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      blocks.push("<hr />");
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      if (!blockquote) {
        blockquote = [];
      }
      blockquote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    } else if (blockquote) {
      flushBlockquote();
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const level = headingMatch[1].length;
      blocks.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (isTableRow(trimmed) && lineIndex + 1 < lines.length) {
      const headerCells = parseTableRow(trimmed);
      const alignmentRow = lines[lineIndex + 1].trim();
      const alignments = parseAlignmentRow(alignmentRow, headerCells.length);
      if (alignments) {
        flushParagraph();
        flushList();
        flushBlockquote();

        const rows = [];
        let dataIndex = lineIndex + 2;
        while (dataIndex < lines.length) {
          const candidate = lines[dataIndex].trim();
          if (!isTableRow(candidate)) {
            break;
          }
          rows.push(parseTableRow(candidate));
          dataIndex += 1;
        }

        let tableHtml = "<table><thead><tr>";
        headerCells.forEach((cell, cellIndex) => {
          const align = alignments[cellIndex];
          const alignAttr = align ? ` style="text-align:${align}"` : "";
          tableHtml += `<th${alignAttr}>${renderInlineMarkdown(cell)}</th>`;
        });
        tableHtml += "</tr></thead>";

        if (rows.length) {
          tableHtml += "<tbody>";
          rows.forEach((row) => {
            tableHtml += "<tr>";
            const cellCount = Math.max(headerCells.length, row.length, alignments.length);
            for (let cellIndex = 0; cellIndex < cellCount; cellIndex += 1) {
              const content = row[cellIndex] ?? "";
              const align = alignments[cellIndex] ?? null;
              const alignAttr = align ? ` style="text-align:${align}"` : "";
              tableHtml += `<td${alignAttr}>${renderInlineMarkdown(content)}</td>`;
            }
            tableHtml += "</tr>";
          });
          tableHtml += "</tbody>";
        }

        tableHtml += "</table>";
        blocks.push(tableHtml);
        lineIndex = dataIndex - 1;
        continue;
      }
    }

    const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    if (orderedMatch || unorderedMatch) {
      flushParagraph();
      flushBlockquote();
      const type = orderedMatch ? "ol" : "ul";
      const content = orderedMatch ? orderedMatch[2] : unorderedMatch[1];
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push(renderInlineMarkdown(content));
      continue;
    }

    if (list && rawLine.startsWith("  ")) {
      const lastIndex = list.items.length - 1;
      if (lastIndex >= 0) {
        list.items[lastIndex] += `<br />${renderInlineMarkdown(rawLine.trim())}`;
        continue;
      }
    }

    if (blockquote) {
      blockquote.push(trimmed);
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushBlockquote();
  flushCodeBlock();

  const html = blocks.join("");
  return html.trim();
}

function parseProcessInput(raw) {
  if (!raw) return [];
  const normalized = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const bulletRegex =
    /^\s*(?:[-*+•●◦▪▫‣⁃–—]|(?:\d{1,3})(?:\s*[.)ºª°-]){0,2})\s+(.*)$/;

  const bulletSteps = [];
  let current = null;
  let bulletDetected = false;

  const flushCurrent = () => {
    if (!current) return;
    const text = current.join("\n").trim().replace(/\n{3,}/g, "\n\n");
    if (text) {
      bulletSteps.push(text);
    }
    current = null;
  };

  for (const line of lines) {
    const match = line.match(bulletRegex);
    if (match) {
      bulletDetected = true;
      flushCurrent();
      current = [match[1].trim()];
      continue;
    }
    if (current) {
      const trimmed = line.trim();
      if (trimmed) {
        current.push(trimmed);
      } else if (current[current.length - 1] !== "") {
        current.push("");
      }
    }
  }
  flushCurrent();

  if (bulletDetected && bulletSteps.length) {
    return bulletSteps;
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length > 1) {
    return blocks;
  }

  return normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
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

function normalizeLocaleCandidate(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (translations[normalized]) {
    return normalized;
  }
  return null;
}

function getLocaleFromDraft(rawDraft) {
  if (!rawDraft || typeof rawDraft !== "object") {
    return null;
  }
  const direct = normalizeLocaleCandidate(rawDraft.locale);
  if (direct) {
    return direct;
  }
  const nested = normalizeLocaleCandidate(rawDraft?.data?.locale);
  return nested ?? null;
}

function buildDraftPayload() {
  return {
    version: CURRENT_DRAFT_VERSION,
    savedAt: new Date().toISOString(),
    locale: currentLocale,
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
    throw new Error(translate("draft.invalid"));
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
  const draftLocale = getLocaleFromDraft(rawDraft);
  if (draftLocale && draftLocale !== currentLocale) {
    setLocale(draftLocale);
  }
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

  const input = document.createElement("textarea");
  input.className = "chip__edit-input";
  input.value = currentValue;
  const lineCount = currentValue.split(/\r?\n/).length;
  input.rows = Math.max(2, Math.min(8, lineCount));
  input.setAttribute("aria-label", translate("ui.process.editAria", { index: index + 1 }));
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
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
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

function buildMoodleManifest(title, entryFile, sections = []) {
  const slug = slugify(title) || "webquest";
  const timestamp = Date.now();
  const manifestId = `MANIFEST-${slug}-${timestamp}`;
  const organizationId = `ORG-${slug}`.toUpperCase();
  const itemId = `ITEM-${slug}`.toUpperCase();
  const resourceId = `RES-${slug}`.toUpperCase();
  const safeTitle = escapeXml(title);
  const safeEntry = escapeXml(entryFile);
  const tocItems = Array.isArray(sections)
    ? sections
        .map((section, index) => {
          const rawId =
            typeof section?.id === "string" && section.id.trim()
              ? section.id.trim()
              : `section-${index + 1}`;
          const sectionId = rawId;
          const rawAnchor =
            typeof section?.anchorId === "string" && section.anchorId.trim()
              ? section.anchorId.trim()
              : "";
          const anchorFragment = rawAnchor ? `#${encodeURIComponent(rawAnchor)}` : "";
          const sectionTitle =
            typeof section?.title === "string" && section.title.trim()
              ? section.title.trim()
              : `Sección ${index + 1}`;
          const childId =
            typeof section?.manifestItemId === "string" && section.manifestItemId.trim()
              ? section.manifestItemId.trim()
              : `${itemId}-S${index + 1}`;
          section.manifestItemId = childId;
          const parameters = anchorFragment;
          return `<item identifier="${escapeXml(childId)}" identifierref="${escapeXml(
            resourceId
          )}" adlcp:parameters="${escapeXml(parameters)}">
        <title>${escapeXml(sectionTitle)}</title>
      </item>`;
        })
        .join("")
    : "";
  const organizationItems = tocItems
    ? `<item identifier="${escapeXml(itemId)}" identifierref="${escapeXml(resourceId)}">
      <title>${safeTitle}</title>
      ${tocItems}
    </item>`
    : `<item identifier="${escapeXml(itemId)}" identifierref="${escapeXml(resourceId)}">
      <title>${safeTitle}</title>
    </item>`;
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
      ${organizationItems}
    </organization>
  </organizations>
  <resources>
    <resource identifier="${escapeXml(resourceId)}" type="webcontent" href="${safeEntry}">
      <file href="${safeEntry}" />
    </resource>
  </resources>
</manifest>`;
}

function getRenderData(options = {}) {
  const { isMoodle = false, locale = currentLocale } = options;
  const dict = getTranslationDict(locale);
  const renderRich = (value) => renderMarkdown(value);
  const subtitleHtml = renderMarkdown(state.subtitle, { inline: true });
  const introduction = renderRich(state.introduction);
  const task = renderRich(state.task);
  const evaluation = renderRich(state.evaluation);
  const conclusion = renderRich(state.conclusion);
  const teacherNotes = renderRich(state.teacher_notes);
  const processSteps = state.process
    .map((step) => (typeof step === "string" ? step.trim() : ""))
    .filter(Boolean);
  const processRendered = processSteps.map((step) => renderMarkdown(step, { inline: true }));
  const resources = state.resources
    .map((resource) => {
      const title = resource?.title ? escapeHtml(resource.title) : "";
      const link = sanitizeUrl(resource?.link);
      const notesHtml = resource?.notes ? renderMarkdown(resource.notes) : "";
      return {
        title,
        link,
        notesHtml
      };
    })
    .filter((resource) => resource.title && resource.link);
  const sections = [];

  if (introduction) {
    sections.push({
      id: "introduccion",
      title: dict.sections.introduction,
      body: introduction,
      isRich: true
    });
  }

  if (task) {
    sections.push({
      id: "tarea",
      title: dict.sections.task,
      body: task,
      isRich: true
    });
  }

  if (processSteps.length) {
    sections.push({
      id: "proceso",
      title: dict.sections.process,
      process: processRendered,
      isProcess: true
    });
  }

  if (resources.length) {
    sections.push({
      id: "recursos",
      title: dict.sections.resources,
      resources,
      isResources: true
    });
  }

  if (evaluation) {
    sections.push({
      id: "evaluacion",
      title: dict.sections.evaluation,
      body: evaluation,
      isRich: true
    });
  }

  if (conclusion) {
    sections.push({
      id: "conclusion",
      title: dict.sections.conclusion,
      body: conclusion,
      isRich: true
    });
  }

  if (teacherNotes) {
    sections.push({
      id: "profesorado",
      title: dict.sections.teacherNotes,
      body: teacherNotes,
      isRich: true
    });
  }

  if (!sections.length) {
    sections.push({
      id: "introduccion",
      title: dict.sections.introduction,
      body: renderMarkdown(dict.preview.emptyState),
      isRich: true
    });
  }

  const manifestSlug = isMoodle ? slugify(getTitle()) || "webquest" : null;
  const manifestItemPrefix = manifestSlug ? `ITEM-${manifestSlug}`.toUpperCase() : null;

  sections.forEach((section, index) => {
    section.position = index + 1;
    section.anchorId = `${section.id}-content`;
    if (manifestItemPrefix) {
      section.manifestItemId = `${manifestItemPrefix}-S${index + 1}`;
    }
    const next = sections[index + 1];
    if (next) {
      section.next = {
        id: next.id,
        label: next.title,
        text: translate("preview.next", { title: next.title }, locale)
      };
    }
  });

  const showSidebar = !isMoodle && sections.length > 0;
  const layoutClass = isMoodle ? "main-layout main-layout--single" : "main-layout";

  return {
    title: state.title ? escapeHtml(state.title) : escapeHtml(translate("general.untitled", {}, locale)),
    subtitle: state.subtitle ? escapeHtml(state.subtitle) : "",
    subtitleHtml,
    sections,
    color: sanitizeColor(state.color),
    heroImage: sanitizeUrl(state.heroImage),
    credits: state.credits ? escapeHtml(state.credits) : "",
    isMoodle,
    showSidebar,
    layoutClass,
    t: {
      htmlLang: dict.preview.htmlLang,
      sidebarTitle: dict.preview.sidebarTitle,
      sidebarAria: dict.preview.sidebarAria,
      sidebarToggle: dict.preview.sidebarToggle,
      visitResource: dict.preview.visitResource,
      footerPrefix: dict.preview.footerPrefix
    },
    previewStyles,
    previewScript
  };
}

function updatePreview() {
  if (!templateSource) {
    return;
  }
  const data = getRenderData({ locale: currentLocale });
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
    const textSpan = document.createElement("span");
    textSpan.className = "chip__text";
    textSpan.textContent = step;

    const actions = document.createElement("div");
    actions.className = "chip__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "chip__btn chip__btn--edit";
    editBtn.dataset.index = String(index);
    editBtn.textContent = translate("ui.process.edit");
    editBtn.setAttribute("aria-label", translate("ui.process.editAria", { index: index + 1 }));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "chip__btn chip__btn--delete";
    deleteBtn.dataset.index = String(index);
    deleteBtn.setAttribute("aria-label", translate("ui.process.deleteAria", { index: index + 1 }));
    deleteBtn.textContent = "×";

    actions.append(editBtn, deleteBtn);

    item.appendChild(textSpan);
    item.appendChild(actions);
    processList.appendChild(item);
  });
}

function renderResourceList() {
  resourceList.innerHTML = "";
  state.resources.forEach((resource, index) => {
    const item = document.createElement("li");
    item.className = "resource-item";
    item.dataset.index = String(index);

    const body = document.createElement("div");
    body.className = "resource-item__body";

    const title = document.createElement("strong");
    title.textContent = resource.title ? resource.title : translate("ui.resources.untitled");
    body.appendChild(title);

    const safeLink = sanitizeUrl(resource.link);
    if (safeLink) {
      const link = document.createElement("a");
      link.href = safeLink;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = resource.link || safeLink;
      body.appendChild(link);
    } else if (resource.link) {
      const linkFallback = document.createElement("span");
      linkFallback.textContent = resource.link;
      body.appendChild(linkFallback);
    }

    if (resource.notes) {
      const notes = document.createElement("span");
      notes.textContent = resource.notes;
      body.appendChild(notes);
    }

    const actions = document.createElement("div");
    actions.className = "resource-item__actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "resource-item__btn resource-item__btn--edit";
    editBtn.dataset.index = String(index);
    editBtn.textContent = translate("ui.resources.edit");
    editBtn.setAttribute("aria-label", translate("ui.resources.edit"));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "resource-item__btn resource-item__btn--delete";
    deleteBtn.dataset.index = String(index);
    deleteBtn.setAttribute("aria-label", translate("ui.resources.deleteAria"));
    deleteBtn.textContent = translate("ui.resources.delete");

    actions.append(editBtn, deleteBtn);
    item.appendChild(body);
    item.appendChild(actions);
    resourceList.appendChild(item);
  });
}

function startEditingResourceItem(index) {
  if (!resourceList) return;
  if (index < 0 || index >= state.resources.length) return;
  const item = resourceList.querySelector(`li[data-index="${index}"]`);
  if (!item || item.classList.contains("resource-item--editing")) {
    return;
  }

  const activeEdit = resourceList.querySelector(".resource-item--editing");
  if (activeEdit && activeEdit !== item) {
    const cancelButton = activeEdit.querySelector(".resource-edit__cancel");
    cancelButton?.click();
  }

  const resource = state.resources[index] ?? { title: "", link: "", notes: "" };
  const body = item.querySelector(".resource-item__body");
  const actions = item.querySelector(".resource-item__actions");
  if (!body || !actions) return;

  item.classList.add("resource-item--editing");
  body.hidden = true;
  actions.hidden = true;

  const form = document.createElement("form");
  form.className = "resource-edit";

  const titleField = document.createElement("label");
  titleField.className = "resource-edit__field";
  const titleLabel = document.createElement("span");
  titleLabel.textContent = translate("ui.resources.titleLabel");
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.name = "title";
  titleInput.required = true;
  titleInput.value = resource.title ?? "";
  titleField.append(titleLabel, titleInput);

  const linkField = document.createElement("label");
  linkField.className = "resource-edit__field";
  const linkLabel = document.createElement("span");
  linkLabel.textContent = translate("ui.resources.linkLabel");
  const linkInput = document.createElement("input");
  linkInput.type = "url";
  linkInput.name = "link";
  linkInput.required = true;
  linkInput.value = resource.link ?? "";
  linkField.append(linkLabel, linkInput);

  const notesField = document.createElement("label");
  notesField.className = "resource-edit__field";
  const notesLabel = document.createElement("span");
  notesLabel.textContent = translate("ui.resources.notesLabel");
  const notesInput = document.createElement("textarea");
  notesInput.name = "notes";
  notesInput.value = resource.notes ?? "";
  notesField.append(notesLabel, notesInput);

  const controls = document.createElement("div");
  controls.className = "resource-edit__actions";
  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.className = "resource-edit__save";
  saveButton.textContent = translate("ui.resources.save");
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "resource-edit__cancel";
  cancelButton.textContent = translate("ui.resources.cancel");
  controls.append(saveButton, cancelButton);

  form.append(titleField, linkField, notesField, controls);
  item.appendChild(form);

  const cleanup = (changed) => {
    form.removeEventListener("submit", handleSubmit);
    form.removeEventListener("keydown", handleKeydown);
    cancelButton.removeEventListener("click", handleCancel);
    form.remove();
    body.hidden = false;
    actions.hidden = false;
    item.classList.remove("resource-item--editing");
    if (changed) {
      renderResourceList();
      updatePreview();
      schedulePersistDraft();
      focusResourceEditButton(Math.min(index, state.resources.length - 1));
    } else {
      focusResourceEditButton(index);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    titleInput.setCustomValidity("");
    linkInput.setCustomValidity("");

    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity(translate("validation.resourceTitle"));
      titleInput.reportValidity();
      return;
    }

    const rawLink = linkInput.value.trim();
    const sanitizedLink = sanitizeUrl(rawLink);
    if (!sanitizedLink) {
      linkInput.setCustomValidity(translate("validation.resourceLink"));
      linkInput.reportValidity();
      return;
    }

    const notes = notesInput.value.trim();
    state.resources[index] = {
      title,
      link: sanitizedLink,
      notes
    };
    cleanup(true);
  };

  const handleCancel = (event) => {
    event.preventDefault();
    cleanup(false);
  };

  const handleKeydown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cleanup(false);
    }
  };

  form.addEventListener("submit", handleSubmit);
  form.addEventListener("keydown", handleKeydown);
  cancelButton.addEventListener("click", handleCancel);

  titleInput.focus();
  titleInput.select();
}

function addProcessStep() {
  const rawValue = processInput.value;
  const steps = parseProcessInput(rawValue);
  if (!steps.length) {
    processInput.focus();
    processInput.classList.add("shake");
    setTimeout(() => processInput.classList.remove("shake"), 500);
    return;
  }
  state.process.push(...steps);
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
    resourceLinkInput.setCustomValidity(translate("validation.resourceLink"));
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
    focusProcessEditButton(Math.min(index, state.process.length - 1));
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
  if (target.matches(".resource-item__btn--delete")) {
    const index = Number(target.dataset.index);
    if (!Number.isNaN(index)) {
      state.resources.splice(index, 1);
      renderResourceList();
      updatePreview();
      schedulePersistDraft();
      focusResourceEditButton(Math.min(index, state.resources.length - 1));
    }
  } else if (target.matches(".resource-item__btn--edit")) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    if (!Number.isNaN(index)) {
      startEditingResourceItem(index);
    }
  }
}

function buildExportHtml(options = {}) {
  if (!templateSource) {
    console.warn("La plantilla de vista prèvia no està disponible.");
    return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>WebQuest</title></head><body></body></html>";
  }
  const data = getRenderData({ locale: currentLocale, ...options });
  const html = renderTemplate(templateSource, data);
  return html.trim();
}

async function handleCopyHtml() {
  const html = buildExportHtml();
  try {
    await navigator.clipboard.writeText(html);
    animateAction(copyBtn, translate("actions.copySuccess"));
  } catch (_) {
    animateAction(copyBtn, translate("actions.copyFallback"), true);
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
  animateAction(downloadBtn, translate("actions.downloadSuccess"));
}

function handleDownloadMoodleClick(event) {
  if (event) {
    event.preventDefault();
  }
  if (!moodleBtn) return;
  if (moodleModal) {
    openMoodleModal(moodleBtn);
  } else {
    performMoodleExport();
  }
}

async function performMoodleExport() {
  if (!moodleBtn) return;
  closeMoodleModal();
  if (typeof window.JSZip === "undefined") {
    animateAction(moodleBtn, translate("actions.moodleUnavailable"), true);
    console.warn("JSZip no está cargado. Verifica la conexión o el script CDN.");
    return;
  }

  const zip = new window.JSZip();
  const data = getRenderData({ isMoodle: true, locale: currentLocale });
  const html = renderTemplate(templateSource, data).trim();
  const entryFile = "index.html";
  const title = getTitle();
  const manifest = buildMoodleManifest(title, entryFile, data.sections);
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
    animateAction(moodleBtn, translate("actions.moodleSuccess"));
  } catch (error) {
    animateAction(moodleBtn, translate("actions.moodleError"), true);
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
    animateAction(saveDraftBtn, translate("actions.saveDraftSuccess"));
  } catch (error) {
    animateAction(saveDraftBtn, translate("actions.saveDraftError"), true);
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
        animateAction(loadDraftBtn, translate("actions.loadDraftSuccess"));
      }
    } catch (error) {
      if (loadDraftBtn) {
        animateAction(loadDraftBtn, translate("actions.loadDraftError"), true);
      }
      console.error("No se pudo importar el borrador:", error);
    } finally {
      input.value = "";
    }
  };
  reader.onerror = () => {
    if (loadDraftBtn) {
      animateAction(loadDraftBtn, translate("actions.loadDraftError"), true);
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
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      addProcessStep();
    }
  });
  resourceNotesInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "enter") {
      event.preventDefault();
      addResourceItem();
    }
  });
}

function openMoodleModal(trigger) {
  if (!moodleModal) {
    performMoodleExport();
    return;
  }
  if (!moodleModal.classList.contains("modal--hidden")) {
    return;
  }
  lastModalTrigger = trigger || document.activeElement;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  moodleModal.classList.remove("modal--hidden");
  moodleModal.setAttribute("aria-hidden", "false");
  const focusTarget =
    moodleModal.querySelector("[data-modal-focus]") || moodleModal.querySelector(".modal__content");
  if (focusTarget && typeof focusTarget.focus === "function") {
    focusTarget.focus({ preventScroll: true });
  }
}

function closeMoodleModal() {
  if (!moodleModal || moodleModal.classList.contains("modal--hidden")) {
    return;
  }
  moodleModal.classList.add("modal--hidden");
  moodleModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = "";
  const toFocus = lastModalTrigger;
  lastModalTrigger = null;
  if (toFocus && typeof toFocus.focus === "function") {
    toFocus.focus({ preventScroll: true });
  }
}

function handleMoodleModalKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeMoodleModal();
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }
  const versionParam = encodeURIComponent(SERVICE_WORKER_VERSION);
  const swUrl = `service-worker.js?v=${versionParam}`;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(swUrl)
      .catch((error) => {
        console.warn("No se pudo registrar el Service Worker:", error);
      });
  });
}

async function init() {
  await loadTemplateSource();
  initializeLocale();
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
    moodleBtn.addEventListener("click", handleDownloadMoodleClick);
  }
  if (moodleModal) {
    moodleModal.addEventListener("keydown", handleMoodleModalKeydown);
    const closeElements = moodleModal.querySelectorAll("[data-modal-close]");
    closeElements.forEach((element) => {
      element.addEventListener("click", () => closeMoodleModal());
    });
  }
  if (moodleExportConfirmBtn) {
    moodleExportConfirmBtn.addEventListener("click", performMoodleExport);
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
  if (languageSelect) {
    languageSelect.addEventListener("change", (event) => {
      setLocale(event.target.value);
    });
  }
  setupResizableLayout();
  enhanceAccessibility();
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error("Error inicializando l'aplicació:", error);
  });
});
