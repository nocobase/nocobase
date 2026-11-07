---
"@nocobase/app-host": patch
"@nocobase/app-plugin-releases": patch
---

Use live memory headroom and serialized bounded cold starts instead of static application slots, and recycle shared Hosts under memory pressure with whole-Host busy protection, atomic ingress handoff and one retry for capacity-rejected deployments.
