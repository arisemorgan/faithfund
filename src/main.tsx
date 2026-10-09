import "./styles/global.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 🌍 Auto-translation AFTER React mounts
const savedLang = localStorage.getItem("language") || "en";

window.addEventListener("load", () => {
  const lang = localStorage.getItem("language") || "en";
  setTimeout(() => {
    window.applyTranslation && window.applyTranslation(lang);
  }, 150);
});
