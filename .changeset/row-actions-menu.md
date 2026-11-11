---
'@nocobase/app-skills': minor
'@nocobase/app-template-default': minor
'@nocobase/app-template-examples': minor
---

Put every table row's actions in one "⋮" menu. Both templates ship `RowActions` (`#components/row-actions`), which draws the same icon-only trigger on every row and page, keeps destructive actions last after a separator, renders nothing when the viewer has no action, and keeps menu clicks from reaching the row. The prepared Users and default access lists, the list and edit example and the customer contacts example use it; account actions such as Disable and Revoke sessions are no longer buttons on the row, and actions columns show no header text. The development Skill makes the menu the default for a single action, for every record state and for administration lists, shows an action outside it only when the user or a confirmed design asks for it, keeps the actions column unpinned, and the component checker reports actions columns that render buttons or links, show header text or pin the column. Existing applications receive `RowActions` and the updated pages through a template upgrade; synchronizing the Skill does not change pages that are already built.
