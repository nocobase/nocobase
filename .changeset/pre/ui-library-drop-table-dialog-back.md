---
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

The NocoBase UI Library no longer offers `data-table`, `confirm-dialog` and `back-button`. The application Skills and the templates' `AGENTS.md` stop pointing at `shadcn add @nocobase/data-table`: a list's `DataTable` is built in the application from the `table` primitive following shadcn's Data Table guide, and `BackButton` in `client/components/back-button.tsx` is the template's own component. Existing applications keep their copies unchanged.
