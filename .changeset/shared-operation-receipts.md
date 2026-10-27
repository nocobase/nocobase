---
'@nocobase/app-client': minor
'@nocobase/app-server': minor
'@nocobase/api-client': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
'@nocobase/app-skills': patch
'@nocobase/app-plugin-repository-example': patch
---

Prevent overlapping form submissions with a shared submission controller and preserve operation identifiers across uncertain retries. Standard Repository writes can commit operation receipts atomically with business data and replay successful results for 24 hours after checking current access.

New application templates require operation identifiers and install receipt storage and bounded cleanup. Existing applications must reconcile the provider, migration and copied form sources, migrate their callers, and then enable strict mode; updating dependencies alone does not activate protection. Custom actions must explicitly join the receipt transaction and provide current authorization and result visibility checks. Cross-connection and unadapted external side effects are outside this guarantee.
