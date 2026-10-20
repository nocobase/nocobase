---
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-api-keys': patch
'@nocobase/app-plugin-users': patch
---

Add confirmed user deletion for Hub platform administrators. Protect the current user, the last active platform administrator, and users who own applications. Revoke sessions and API Keys transactionally while retaining an inactive identity record for historical attribution. Prevent new applications and publishing keys from being created for deleted owners.
