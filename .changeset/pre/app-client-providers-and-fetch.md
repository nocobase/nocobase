---
'@nocobase/app-client': minor
---

`ClientApplication` takes an optional `fetch`, which the API client under `apiClientToken` sends its requests through instead of the global one, so a test can point an application at a server it runs in process. `AppClientProviders` is what `AppClientRoot` mounts inside its `BrowserRouter` — the application context, the React providers and Refine — around its children, so a test can render a page in a started application under a router of its own. `AppClientRoot` renders the same tree as before. `resolveAppRuntime()` takes an optional `i18n` runtime in place of the one it builds from the application's and the plugins' locales, so a test runs the application on strict translations without loading every locale twice.
