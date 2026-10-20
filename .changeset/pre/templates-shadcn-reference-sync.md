---
'@nocobase/app-template-examples': patch
---

Carry the shadcn/ui primitive set, the documented compositions and the reference pages across from Default, so all three templates start an application from the same UI vocabulary. `client/components/ui/` grows to the full 52-component registry set plus the `use-mobile` hook the sidebar depends on, and `button.tsx` and `badge.tsx` now export their `cva` variants for the primitives that compose them.

`client/components/` gains the compositions shadcn documents without publishing — `DataTable` with `DataTableColumnHeader`, `DataTablePagination` and `DataTableViewOptions`, `DatePicker` and `DateRangePicker`, and the `Typography*` prose primitives — with their strings in the application locales. Hub also gains `actions.close`, which its locale was missing.

`client/pages/reference/` arrives whole: eight complete business screens on mock data under `examples/`, one page per primitive under `components/`, and the frame both share. Nothing routes them in any template, so a production build never reaches them and no user sees one; each template's `tests/logic/client-routes.test.ts` now fails if one does, `tests/logic/locale-coverage.test.ts` fails on a key only one language has, and `tests/components/reference-pages.test.tsx` renders all of them against the English wording. Both `AGENTS.md` files point an agent at these pages before it builds one of its own.
