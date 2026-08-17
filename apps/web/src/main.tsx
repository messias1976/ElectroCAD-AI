import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/globals.css";

import App from "./App";

// Feedback visual curto para qualquer botão clicado, sem alterar a lógica dos componentes.
document.addEventListener("click", (event) => {
  const target = event.target instanceof HTMLElement ? event.target.closest("button") : null;
  if (!target || target.disabled) return;
  target.classList.remove("ui-clicked");
  void target.offsetWidth;
  target.classList.add("ui-clicked");
  window.setTimeout(() => target.classList.remove("ui-clicked"), 280);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);