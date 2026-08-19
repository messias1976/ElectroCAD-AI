# Render — SPA fallback

For the Static Site that serves `apps/web`, configure this rewrite in Render:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`

This makes direct access/reload of React Router routes such as `/dashboard`, `/projects`, `/planta` and `/subscriptions` return the SPA instead of a 404.

The Vite build also creates `dist/404.html` as a fallback for hosts that serve a static 404 document.
