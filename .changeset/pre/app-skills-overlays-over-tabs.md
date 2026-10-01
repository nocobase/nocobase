---
'@nocobase/app-skills': patch
---

An overlay opens over the view the user is on, and on a page with tabs that view is the tab being shown (guidelines T2.1, I1, I6 and I9). A record's page declared its header's edit dialog beside the tabs and linked to it with a bare `edit`, which resolves against the route that renders the link rather than the URL on screen: the dialog replaced the tab, and closing it redirected to the default tab.

- `child-routes.md` has a section on overlays opened from the header of a page with tabs: they are declared under every tab through a function, `customerHeaderRoutes(tab)` inside `customerDetailRoutes(owner)`, the header links to `` `${tab}/edit` `` with the tab read from the URL, and each tab passes the page's context on to its `Outlet`. The same page declared under another page uses the same function.
- `page.md` explains what a relative link resolves against, with a table of the cases, and how such a page's routes join the route test.
- `example/detail-page-tabs.md` is the complete customer page, its tab, the test that opens the header's "Edit" from every tab, and the route test helper; `example/copy.md` adds the `customers` group.
- The review checklist, `overlay.md`, `testing.md`, `frontend-dev.md` and the run and design templates check an overlay opened from a view other than the first one a page shows.
- Going back restores the page underneath exactly (guideline L6): links carry its whole query string down, a view below another one names its own parameters apart (`ordersQ`, section 5 of `table.md`), and the way back removes them with `withoutParams`, which `example/url-search.md` adds. `child-routes.md` no longer advises dropping the current page's filters when linking to another page's record, which lost them on the way back.
