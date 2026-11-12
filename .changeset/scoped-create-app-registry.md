---
"@nocobase/create-app": patch
---

Replace create-app's --registry flag with --nocobase-registry. Scope explicit registry overrides and NOCOBASE_REGISTRY to @nocobase packages, preserve package-manager configuration when no override is given, and leave third-party templates and dependencies on their configured registries.
