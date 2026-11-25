---
'@nocobase/app-client': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

Move the System settings shortcut from the sidebar footer to the header beside the account menu. Header actions can target a host application page with `app:<routeName>` and use `beforeAccount` placement to remain visible on mobile, and disabling system settings routes also removes the shortcut.
