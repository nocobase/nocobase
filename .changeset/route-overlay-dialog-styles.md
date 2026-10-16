---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

`RouteDialog` and `RouteDrawer` now look like the application's other dialogs: they compose the dialog primitive's `DialogHeader`, `DialogTitle`, `DialogDescription` and `DialogFooter` inside the padding, spacing and close-button position of `DialogContent`, so the header no longer has a rule under it, the footer is the dialog footer (stacking its buttons on narrow screens), and a change to the dialog primitive or its theme rules reaches route overlays too. The frontend Skill's overlay guidance describes the new look and the template dialog's current padding and default width.
