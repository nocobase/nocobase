---
"@nocobase/create-app": patch
---

Add --nocobase-registry and scope NOCOBASE_REGISTRY to @nocobase packages while respecting existing package-manager configuration. Keep --registry compatible with its legacy download behavior and display a migration warning, including in JSON output.
