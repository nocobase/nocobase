---
'@nocobase/app-template-default': patch
'@nocobase/app-template-hub': patch
'@nocobase/app-template-examples': patch
---

Add `BackButton` (`client/components/back-button.tsx`), the way back from a page below another one. It stands on its own above the page's heading, where breadcrumbs would sit, and needs no `PageHeader`: a muted text link with an arrow, labelled through `navigation.back`, that leads to the parent route with the current query string and replaces the history entry, as closing a route overlay does. `to` sends it elsewhere and `children` replaces the label. `Breadcrumbs` stays for applications whose users ask for a trail.

The `DataTablePagination` that the NocoBase UI Library's `data-table` item installs gives the page count a minimum width instead of a fixed one, so "第 1 页，共 13 页" no longer wraps. `AGENTS.md` states that a page below another one leaves by `BackButton`, and that a record opens over the page the user is on.

An application generated earlier adds `navigation.back` to its locale files when it copies `back-button.tsx`, and can change `w-[100px]` to `min-w-[100px] whitespace-nowrap` in its own `data-table-pagination.tsx`.
