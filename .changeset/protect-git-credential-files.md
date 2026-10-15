---
'@nocobase/app-cli-client': patch
'@nocobase/app-server': patch
'@nocobase/studio': patch
---

Reject empty or whitespace-only Git credential files before sending a request, and preserve saved credentials when validation fails. Support explicit credential removal through a JSON update file with null values, returning the incomplete connection state when required credentials are cleared.
