---
'@nocobase/app-plugin-demo-mode': patch
---

Simplify the demo settings page to Overview and Daily reset by removing visitor write, simulation and AI controls. Preserve existing write policies and their configuration APIs. Enable registered simulation adapters and integrated demo chat by default, deriving tool behavior from application-provided mocks or explicit local reads while preserving saved overrides. Keep application integration optional and leave ordinary Agent model selection unchanged.
