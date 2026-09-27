---
'@nocobase/app-plugin-ai-employee': major
---

The client services no longer share a module-level API client. Each service function takes the application's API client as its first argument, and `createAIEmployeeClient(api)` and `useAIEmployeeClient()` return an `AIEmployeeClient` with all of them bound to one client. The `nocobase-ai` registry's `NocoBaseAIService` requires a client in its constructor, the `nocobaseAIService` singleton is removed, and `AIProvider` requires its `service`; `NocoBaseAIRootProvider` still creates one from `useApiClient()` when none is given.
