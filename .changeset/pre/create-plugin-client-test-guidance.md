---
'@nocobase/create-plugin': patch
---

A generated plugin with client code is ready for page tests: its `devDependencies` gain `@nocobase/app-testing` and the packages a jsdom test needs, and it gets a `vitest.config.ts` that runs `tests/client/` under jsdom and every other test under Node. Its `AGENTS.md` has a "Testing a page" section: render the page with `renderWithApp()` from `@nocobase/app-testing/client`, passing the plugin in `plugins` so its services and translations load, and answer its requests with `answerApi()`, instead of a `vi.mock('@nocobase/app-client')`.
