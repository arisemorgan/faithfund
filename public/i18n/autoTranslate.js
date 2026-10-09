/******************************
 * SUPER-OPTIMIZED AUTO I18N
 * No freezing, no loops, React-safe
 ******************************/

let currentLang = localStorage.getItem("language") || "en";
let cache = {};
let originalTexts = new WeakMap();

function normalize(s) {
  return s.replace(/\s+/g, " ").trim();
}

function skip(n) {
  return (
    !n ||
    !n.nodeValue ||
    n.nodeValue.trim() === "" ||
    (n.parentElement &&
      ["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"].includes(
        n.parentElement.tagName
      ))
  );
}

async function loadTranslations(lang) {
  if (lang === "en") return {};
  if (cache[lang]) return cache[lang];

  try {
    const res = await fetch(`/i18n/${lang}.json`, { cache: "no-cache" });
    const json = await res.json();
    cache[lang] = json;
    return json;
  } catch {
    return {};
  }
}

function translateNode(node, map) {
  if (skip(node)) return;

  const orig = normalize(node.nodeValue || "");
  if (!orig) return;

  // Save original text exactly once
  if (!originalTexts.has(node)) originalTexts.set(node, orig);

  // English → restore original
  if (currentLang === "en") {
    node.nodeValue = originalTexts.get(node);
    return;
  }

  // Exact match
  if (map[orig]) {
    node.nodeValue = map[orig];
    return;
  }

  // Case-insensitive
  const key = Object.keys(map).find(
    (k) => k.toLowerCase() === orig.toLowerCase()
  );
  if (key) node.nodeValue = map[key];
}

function translateTree(root, map) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = walker.nextNode())) translateNode(n, map);
}

async function applyTranslation(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);

  const map = await loadTranslations(lang);

  // Translate STATIC DOM only once per switch
  translateTree(document.body, map);

  // Translate placeholders
  document
    .querySelectorAll("input[placeholder], textarea[placeholder]")
    .forEach((el) => {
      const orig = normalize(el.placeholder);
      if (!originalTexts.has(el)) originalTexts.set(el, orig);
      el.placeholder = currentLang === "en" ? originalTexts.get(el) : map[orig] || orig;
    });

  console.log("Translated →", lang);
}

/**********************
 * SAFE OBSERVER
 * Only detect newly added visible DOM, not React updates.
 **********************/
let observer = new MutationObserver((mut) => {
  if (!cache[currentLang]) return;

  mut.forEach((m) => {
    m.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        translateTree(node, cache[currentLang]);
      } else if (node.nodeType === 3) {
        translateNode(node, cache[currentLang]);
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

/***************
 * Expose to window
 ***************/
window.applyTranslation = applyTranslation;

// Default → Always English
window.addEventListener("load", () => {
  const lang = localStorage.getItem("language") || "en";
  applyTranslation(lang);
});
