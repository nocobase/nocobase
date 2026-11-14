---
'@nocobase/app-plugin-knowledge': minor
'@nocobase/app-plugin-releases': minor
'@nocobase/app-plugin-projects': patch
---

Allow applications to authorize run agents (actor kind `agent`) as their initiating user while retaining version attribution. Online agents retain the default permission intersection and propose ceiling; archived documents remain hidden to all actors. Native run HTTP requests now carry their actor even for hosts using the default policy, so they also receive that default ceiling.

Allow agents to configure Apps and deploy directly to protected environments when their initiating user is an environment approver. Resolved environment approvers take precedence over the fallback `deploy-protected` permission. This release behavior applies to every host without an opt-in; keys retain their existing restrictions. The `ReleasesAccess.approversOf` resolver now receives an App-ID context for both direct deployments and request decisions instead of a full deployment request.

Clarify the Projects comment deletion API description; hosts may impose their own stricter run deletion boundary.
