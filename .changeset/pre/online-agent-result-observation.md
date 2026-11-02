---
"@nocobase/app-plugin-agents": patch
"@nocobase/app-template-examples": patch
---

Wait for the admitted OnlineAgent execution in get(), including validated result persistence, finalization and occupancy release. Add try({ wait }) for bounded observation with distinct pending, failed and cancelled results and safe errors. Preserve run() admission semantics and finalization retries without rerunning model or tools.

Update translation and structured extraction examples to await results without status polling while preserving deadlines, disconnect handling and cancellation of late admission.
