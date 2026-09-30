---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-template-examples': patch
---

Ship only the shadcn/ui primitives the template's own code uses, and remove `client/pages/reference/`. Default and Hub keep `button`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `spinner`, `toast` and `tooltip`; Examples also keeps `badge`, `card`, `field`, `select`, `separator`, `skeleton`, `table`, `textarea`, `toggle` and `toggle-group` for its example pages. Everything else is added with the shadcn CLI when a page needs it, as the development Skill describes. `use-mobile.ts` goes with the sidebar primitive, and the devDependencies only the removed primitives used (`recharts`, `cmdk`, `embla-carousel-react`, `input-otp`, `react-resizable-panels`, `@shadcn/react`) are dropped; `cn`, which registry primitives now import, is added.

`toast.tsx` names its close button through `actions.close`, as `dialog.tsx` and `spinner.tsx` already translate their labels, and `tests/components/primitive-labels.test.tsx` fails when an update brings the registry's English back. New tests cover a page test harness and application locale coverage.

An application generated earlier keeps its reference pages and primitives until it removes them: search the application for imports of a primitive or of `client/pages/reference/` first, then delete what nothing imports along with the reference tests, and drop a dependency only when no remaining file imports it.
