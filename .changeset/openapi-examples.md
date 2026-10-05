---
'@nocobase/app-plugin-authorization-example': patch
'@nocobase/app-plugin-departments-example': patch
'@nocobase/app-plugin-file-example': patch
'@nocobase/app-plugin-jobs-example': patch
'@nocobase/app-plugin-notification-example': patch
'@nocobase/app-plugin-queue-example': patch
'@nocobase/app-plugin-repository-example': patch
'@nocobase/app-plugin-routes-example': patch
'@nocobase/app-plugin-service-provider-example': patch
'@nocobase/app-plugin-skills-example': patch
'@nocobase/app-plugin-template-print-example': patch
'@nocobase/app-template-examples': patch
---

Every hand-written `/api` route of the example plugins and of the examples application now declares itself for the application's OpenAPI document with `describeRoute()`, `apiValidator()` and the response helpers from `@nocobase/app-server/router`, and is listed in Swagger UI at `/api/swagger/docs`. Each example uses its namespace in PascalCase as its tag (such as `QueueExample`) and an `operationId` of its namespace, a verb and the resource (such as `queueExamplePublishGreeting`), with shared response schemas in `server/routes/schemas.ts`. Input validation answers exactly as before. The public `GET /api/serviceProviderExample/status` and `GET /api/example` declare `security: []`, and the examples application hides the stand-in routes that answer `503 DATABASE_UNAVAILABLE` while it runs without a database. The routes, service provider and Skills examples now depend on `zod` for their response schemas. The READMEs describe the pattern, and the repository and file examples note that their data endpoints are documented without a declaration. Each route lists only the error statuses it can produce: the `400` for invalid input comes from the input validators, so a route lists `400` only for another reason such as a failed precondition, and one that checks no permission does not list `403`, so the article, numeric, routes, skills, queue, jobs, notification, practice-context and department-list routes name their statuses one by one instead of spreading `apiErrorResponses`. The examples application's `AGENTS.md` and `README.MD` explain where the Swagger UI and the JSON document are served, that reading them needs a signed-in session or an API key, and that an agent learns the endpoints from the document.
