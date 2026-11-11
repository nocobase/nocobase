---
"@nocobase/app-template-default": patch
"@nocobase/app-template-examples": patch
"@nocobase/app-skills": patch
---

Give tables, lists, summary cards and pickers the shared pending timing: list loading and retry appear only after the display delay, same-query refreshes keep rows with one delayed refresh indicator, a new query keeps the table's geometry without showing previous rows or totals, a picker no longer shows a previous search's options as matches, and the long-wait hint on pending buttons no longer blocks the controls it covers.
