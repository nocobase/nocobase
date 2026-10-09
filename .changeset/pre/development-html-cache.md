---
'@nocobase/app-server': patch
---

Prevent stale development pages after runtime public configuration changes by removing upstream HTML cache validators while preserving Vite resource caching.
