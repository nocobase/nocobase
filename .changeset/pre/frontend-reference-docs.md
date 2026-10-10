---
'@nocobase/app-skills': minor
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Replace the frontend references of the application development Skill with a frontend workflow, UI guidelines and a frontend handbook under `references/frontend/`.

`references/frontend/ui-workflow.md` is now where every change under `client/` starts: it decides between a full workflow (a design file reviewed once, then an independent acceptance review with screenshots) and a quick change (edit directly, static checks only), and says what to read at each step. `ui-guidelines.md` holds numbered Must/Should rules for page templates, overlays, states, copy and accessibility, used to design pages and to review designs and implementations. `frontend-dev.md` routes each task to a topic document in `references/frontend/references/` — pages and routes, child routes, route-first dialogs and drawers, forms, calling endpoints, tables, styling, theme tokens and presets, copy and translations, frontend tests — with complete examples. The workflow ships fill-in templates for its artifacts and a Playwright screenshot script.

The references these documents replace are removed: `client-pages-and-routes.md`, `client-child-routes.md`, `components-and-styling.md`, `react-hook-form.md`, `header-actions.md`, `client-api.md`, `theme-tokens.md` and `themes.md`. `i18n.md` now covers server-side text, the languages the application offers, the default language and fallback, and `testing.md` points frontend testing to the new handbook. Each template's `AGENTS.md` and `CLAUDE.md` point at the new documents.
