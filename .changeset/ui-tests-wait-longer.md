---
'@nocobase/dev-config': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

The React test preset waits up to 5 seconds for `findBy*` and `waitFor`, instead of Testing Library's 1-second default, so component tests stop failing at random on a busy CI machine. The templates' theme tests wait for the appearance popover's options instead of looking them up the moment it is clicked.
