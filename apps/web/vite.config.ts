import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function spaFallback() {
  return {
    name: "electrocad-spa-fallback",
    closeBundle() {
      const distIndex = resolve(process.cwd(), "dist/index.html");
      const dist404 = resolve(process.cwd(), "dist/404.html");
      if (existsSync(distIndex)) copyFileSync(distIndex, dist404);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
});
