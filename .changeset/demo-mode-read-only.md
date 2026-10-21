---
'@nocobase/app-plugin-demo-mode': patch
---

Add the Demo Mode plugin, which turns an application into a read-only demo by registration alone: every database write an HTTP request causes is refused before it reaches the database and answered as `400 FAILED_PRECONDITION` with reason `DEMO_READ_ONLY`, while migrations, seeds, jobs and schedules keep writing. Deployments allow tables such as sign-in sessions, use `observe` mode to find the writes their pages make while browsing, and get a toast in the browser on every refusal.
