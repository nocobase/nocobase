---
'@nocobase/app-skills': patch
'@nocobase/app-template-default': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-template-hub': patch
---

The NocoBase UI Library no longer offers `date-picker` and `date-time-picker`. The application Skills and the templates' `AGENTS.md` stop pointing at `shadcn add @nocobase/date-picker`: a date field's `DatePicker` is the application's own component, composed from the `calendar` and `popover` primitives following shadcn's Date Picker guide. Existing applications keep their copies unchanged.
