---
'@nocobase/app-client': minor
'@nocobase/app-skills': patch
---

Add shared createUuid and copyText browser utilities with HTTP-compatible UUID generation, clipboard fallback, focus restoration and explicit copy failure results. Guide applications to use these utilities for UUIDs and copying, and to explain unavailable HTTPS-only capabilities to users rather than prohibiting those APIs.
