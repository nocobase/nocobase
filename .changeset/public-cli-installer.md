---
"@nocobase/app-cli-distribution": patch
---

Add a separate public CLI installation entry without token or Runner extensions. Preserve the original protected installer and Agents script byte for byte; existing profile-based CLI updates can consume public artifact endpoints unchanged.
