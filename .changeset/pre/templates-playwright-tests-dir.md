---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

Playwright tests live in `tests/playwright/` instead of `e2e/`, so every test sits under `tests/` and ships with the template. `playwright.config.ts` points `testDir` there, `vitest.config.ts` excludes the directory so Vitest does not pick up Playwright's `*.test.ts` files, and `tsconfig.node.json` typechecks it. The Hub template has no Playwright, but its `vitest.config.ts` excludes `tests/playwright/` too, so the three templates keep one Vitest configuration. The optional local AI server test (`AI_LOCAL_E2E=1`) is removed; `pnpm test:e2e` still passes with no tests. An application created from an earlier template moves its own `e2e/` files as the `nocobase-app-upgrade` Skill describes.
