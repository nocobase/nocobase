---
"@nocobase/app-cli": minor
"@nocobase/app-server": patch
"@nocobase/app-skills": patch
"@nocobase/create-app": patch
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
---

Capture application pages from an isolated development instance with `nocobase screenshot`. Use a temporary SQLite database and Vite cache, capture multiple viewports and locales, and reuse a warm instance when iterating on the interface. Chromium is checked before starting the app, and captures synchronize the account theme before opening the page. Reused instances get their original account preferences back after capture.
