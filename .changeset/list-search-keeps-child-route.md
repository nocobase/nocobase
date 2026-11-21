---
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

A list search that is still waiting for typing to pause no longer replaces a detail, edit or action route the user has already opened, such as a reject dialog closing back to its drawer. `DataTableSearch` now also applies the typed text when focus leaves the box, and `useListLocation` holds query changes made while a child covers the list until the list is shown again.
