// src/i18n/autoTranslate.ts
type TransMap = { [k: string]: string };

let currentLang = localStorage.getItem("language") || "en";
let cache: Record<string, TransMap | null> = {};

function normalizeText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

// Skip nodes we shouldn't translate
function isSkippableNode(n: Node) {
  return (
    !n ||
    !n.nodeValue ||
    n.nodeValue.trim() === "" ||
    (n.parentElement && ["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(n.parentElement.tagName))
  );
}

async function loadTranslations(lang: string): Promise<TransMap> {
  if (lang === "en") return {}; // english = identity
  if (cache[lang]) return cache[lang] as TransMap;

  try {
    const res = await fetch(`/i18n/${lang}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed to load translations");
    const json = await res.json();
    cache[lang] = json;
    return json;
  } catch (e) {
    console.error("i18n: loadTranslations failed for", lang, e);
    cache[lang] = {}; // fallback
    return {};
  }
}

function translateTextNode(n: Node, map: TransMap) {
  if (isSkippableNode(n)) return;
  const orig = normalizeText(n.nodeValue || "");
  if (!orig) return;

  // try exact match first
  const translated = map[orig];
  if (translated) {
    n.nodeValue = n.nodeValue!.replace(orig, translated);
    return;
  }

  // If not exact, try fallback: case-insensitive key
  const key = Object.keys(map).find(k => k.toLowerCase() === orig.toLowerCase());
  if (key) {
    n.nodeValue = n.nodeValue!.replace(orig, map[key]);
  }
}

function walkAndTranslate(root: Node, map: TransMap) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const nodes: Node[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  nodes.forEach(n => translateTextNode(n, map));
}




// Public API
export async function applyTranslation(lang: string) {
  try {
    currentLang = lang;
    const map = await loadTranslations(lang);
    // translate existing DOM
    walkAndTranslate(document.body, map);

    // also translate placeholders and alt/title attributes (optional)
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[placeholder],textarea[placeholder]").forEach(el => {
      const orig = normalizeText(el.placeholder || "");
      if (map[orig]) el.placeholder = map[orig];
    });
    document.querySelectorAll<HTMLElement>("[title]").forEach(el => {
      const orig = normalizeText(el.title || "");
      if (map[orig]) el.title = map[orig];
    });

    // Observe future DOM changes (React re-renders)
    ensureObserver(map);

    localStorage.setItem("language", lang);
    console.log("i18n: applied", lang);
  } catch (e) {
    console.error("i18n.applyTranslation error:", e);
  }
}

let observer: MutationObserver | null = null;
function ensureObserver(map: TransMap) {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList" && m.addedNodes.length) {
        m.addedNodes.forEach(n => {
          // If element node, translate its subtree
          if (n.nodeType === Node.ELEMENT_NODE) walkAndTranslate(n, map);
          else if (n.nodeType === Node.TEXT_NODE) translateTextNode(n, map);
        });
      } else if (m.type === "characterData") {
        translateTextNode(m.target as Node, map);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

// optional: small helper to use in console
export function getCurrentLang() { return currentLang; }

// attach to window for quick calls (optional)
declare global { interface Window { applyTranslation?: (lang:string)=>Promise<void>; } }
window.applyTranslation = applyTranslation;
