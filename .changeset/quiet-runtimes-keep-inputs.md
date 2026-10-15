---
'@nocobase/agent-protocol': patch
'@nocobase/app-plugin-agents': patch
'@nocobase/studio': patch
---

Give dispatched agent runs five minutes to start while their runtime stays online. Immediately requeue pre-start runtime interruptions without consuming failure attempts or losing unhandled input, and distinguish terminal runtime failures from agent failures. Count and list only inbox decisions whose in-app messages still exist, filtering before pagination.
