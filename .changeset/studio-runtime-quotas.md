---
'@nocobase/agent-protocol': minor
'@nocobase/agent-runner': minor
'@nocobase/app-plugin-agents': minor
'@nocobase/app-plugin-projects': patch
---

Report coding account quota windows, filter scoped exhausted tools before claims, and restore eligibility at known reset times or after an authorized manual clear. Show quota status and usage in runtime tabs and agent availability, and batch page reads independently of the catalog size.


Runtime API and CLI: runtime get returns directory totals without directory rows; runtime list omits models, policy, variables, quota details and load, and caps takes at three with takesCount. Use the paginated runtime workspaces command for directory rows. Runtime quota clear takes structured tool/scope/target/window fields and no client revision; only unknown-reset marks may be cleared. Issue run views expose verified manager handoffs independently of inbox delivery.
