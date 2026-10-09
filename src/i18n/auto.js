import axios from "axios";
import fs from "fs-extra";

const SOURCE = "./src/i18n/en.json";
const OUT_DIR = "./src/i18n/output";
const LANGS = "./src/i18n/languages.json";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translate(text, lang) {
  try {
    const res = await axios.get("https://api.mymemory.translated.net/get", {
      params: { q: text, langpair: `en|${lang}` },
      timeout: 8000
    });

    return res.data.responseData.translatedText;
  } catch (e) {
    return text; // fallback keeps English
  }
}

async function generate() {
  const en = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
  const languages = JSON.parse(fs.readFileSync(LANGS, "utf8"));

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  for (let lang in languages) {
    console.log(`\n🌍 Translating → ${languages[lang]} (${lang})`);

    const file = `${OUT_DIR}/${lang}.json`;
    let existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : {};

    const missing = Object.keys(en).filter(k => !existing[k]);
    if (missing.length === 0) {
      console.log(`✔ Up-to-date — ${lang}.json`);
      continue;
    }

    for (let key of missing) {
      existing[key] = await translate(en[key], lang);
      await sleep(400);
    }

    fs.writeJsonSync(file, existing, { spaces: 2 });
    console.log(`✅ Saved → ${file}`);
  }

  console.log("\n🎉 All languages generated successfully");
}

generate();
