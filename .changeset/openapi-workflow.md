---
'@nocobase/app-plugin-workflow': patch
---

The workflow management routes under `/api/workflows` are now described in the application's OpenAPI document under the `Workflow` tag, with their parameters, response schemas and error statuses, and listed in Swagger UI at `/api/swagger/docs`. Input validation answers exactly as before. The `400` for invalid input comes from the input validators; the routes that can answer `400` for another reason, such as invalid parameter values or run input, declare it with its reasons. `GET` and `PUT /api/workflows/{workflowId}/parameters` now return the revision id as a string, like every other id the plugin returns; on some databases it was a number.
