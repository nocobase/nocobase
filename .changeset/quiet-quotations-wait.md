---
'@nocobase/app-template-examples': patch
---

Add a human review task and processing page to the quotation routing example, then resume its wait node with the submitted result. Persist the resume request id and show whether the recorded decision is still queued, applied, or rejected, including the rejection reason. Pass the task and reviewer identifiers alongside the decision and comment to subsequent nodes.

Use the current HTTP API contract for quotation review: camelCase paths, validated inputs, standard error reasons, string task IDs, and pagination and reviewer metadata under `meta`.

Document quotation review inputs, responses, and errors in the generated OpenAPI document.
