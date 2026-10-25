---
'@nocobase/app-plugin-authentication': patch
'@nocobase/app-plugin-authorization': patch
'@nocobase/app-plugin-users': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Make Member a visible, editable creation default and honor explicitly empty role lists. Initialize new person accounts transactionally across existing creation paths. Preserve existing Member grants and users through a new transactional seed before removing the global assignment, without restoring later role removals. Keep protected administrators and authenticated account basics unchanged.

Stop old account writers and upgrade Authentication, Authorization, and Users together before applying database tasks and reopening traffic. Existing applications must also merge the updated template user pages and translations; plugin upgrades do not replace application-owned source. Restore a database backup with matching old packages if rollback is required.
