---
"@nocobase/app-plugin-foundation": patch
---

Stop a running foundation scan between packages when the application shuts down, so shutdown no longer waits for the whole scan. The interrupted scan resumes on the next start.
