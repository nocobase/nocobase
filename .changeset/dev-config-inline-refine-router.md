---
'@nocobase/dev-config': patch
---

`createReactVitestConfig()` inlines `@refinedev/react-router`. Loaded by Node, Refine's router bindings got a different copy of `react-router` than the test and the application, so an application rendered under a test's `MemoryRouter` failed with "useLocation() may be used only in the context of a <Router> component". A package's own `server.deps.inline` list is merged with this one.
