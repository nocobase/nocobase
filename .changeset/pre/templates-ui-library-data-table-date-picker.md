---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-template-examples': patch
'@nocobase/app-skills': patch
---

The templates no longer ship `DataTable` or `DatePicker`. Both are NocoBase UI Library items, added when a page first needs one: `yes n | pnpm exec shadcn add @nocobase/data-table` installs `DataTable`, `DataTableColumnHeader`, `DataTablePagination` and `DataTableViewOptions` into `client/components/data-table/`, and `@nocobase/date-picker` installs `DatePicker` and `DateRangePicker` into `client/components/date-picker.tsx`. The `calendar` primitive goes with them, and so do `select` and `table` in Default and Hub; Examples keeps those two for its example pages. `@tanstack/react-table`, `date-fns` and `react-day-picker` leave `devDependencies`, except that Hub keeps `react-day-picker`, which `@nocobase/app-plugin-hub` requires as a peer. The `dataTable` and `datePicker` keys stay in the locale files, so an item added later is translated at once. The development Skill names the items on the **Add first** lines of its worked example and says which of the CLI's changes to `package.json` to correct, and the upgrade Skill covers an application that still has the old copies.

An application generated earlier keeps its copies: they are its own code, and nothing in it has to change. Before removing any of them, search the application for imports of `@/components/data-table`, its companions, `@/components/date-picker` and the three primitives, and drop a package only when nothing imports it. An application that wants the library's `DataTable` deletes its `data-table.tsx` and the three `data-table-*.tsx` files before adding `@nocobase/data-table`, because `@/components/data-table` resolves to `data-table.tsx` while that file exists, and rewrites the companion imports to `@/components/data-table/column-header`, `@/components/data-table/pagination` and `@/components/data-table/view-options`.
