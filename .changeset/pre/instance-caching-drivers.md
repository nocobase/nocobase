---
'@nocobase/caching': major
---

Replace global caching driver registration with application-local registerDriver, preserving lazy provider creation and first-use driver validation. Migrate registerCachingDriver calls to the application's Caching instance.
