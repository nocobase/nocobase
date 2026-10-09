---
'@nocobase/app-plugin-users': patch
'@nocobase/app-plugin-projects': patch
'@nocobase/app-cli-client': patch
---

Return invitation links after successful email delivery and let inviters generate a fresh link without sending email. Show copy controls for newly created and resent invitations while invalidating previous links and storing only token hashes.

Keep URLs complete in CLI text output so copied invitation links remain usable, including nested project invitation results displayed as expanded JSON.
