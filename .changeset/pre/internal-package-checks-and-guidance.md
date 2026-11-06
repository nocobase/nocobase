---
'@nocobase/app-cli': patch
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
---

Provide a runnable internal workspace package example with declaration watching, clarify the single-application layout, and fail package checks when an internal package lacks its check script. Keep the public development listener available during server restarts so shared-source HMR requests can wait for the replacement backend.
