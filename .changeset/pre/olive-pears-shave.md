---
'@nocobase/app-plugin-users': patch
---

Remove the legacy Viewer Hub role and keep filter labels on one line

The Hub role picker offered a third option, `hub-viewer`, that was already
impossible to assign: it rendered as a locked row explaining that the
assignment was protected. It only existed to keep older installations
readable, and the Hub has no such installations, so the role is gone. The
picker now offers the two roles that can actually be assigned, and a new
migration deletes the Permission Set together with its assignments.
`HUB_ACTIVE_ROLE_KEYS` disappears with it, because it only existed to name
the subset of `HUB_PERMISSION_SET_KEYS` that excluded the legacy role.

`SelectValue` also stretched its trigger instead of staying on one line, so
"All permission sets" wrapped to two lines and overflowed the fixed-height
control on the Users page. It now truncates, and the permission set filter is
wide enough to show its own default label.
