---
"@nocobase/app-cli": patch
---

Stop copying development runtime settings into dist/.env. Exclude application runtime configuration and storage from deployment archives, and preserve the previous archive if packing fails. Deployments must provide their listener settings through external configuration or environment variables.
