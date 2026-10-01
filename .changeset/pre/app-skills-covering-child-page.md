---
'@nocobase/app-skills': patch
---

The frontend handbook states as a rule what it only implied: a child route that is a page of its own returns `RouteChildPage`, and only tab content renders inline. A generated application declared its article editor as a child route of a dashboard and of a list, and returned a bare `PageContainer`, so the editor rendered at the parent's `Outlet` below the dashboard instead of covering it.

- `child-routes.md` sections 1 and 3 say that a child route's component decides how it is shown and that a bare `PageContainer` renders below the parent's content; section 5 says a page shared by several parents returns `RouteChildPage` under each; the verify list checks that a covering page covers the parent whatever its scroll position.
- `form.md` covers a form page opened from several pages, declared under each through one function that takes an owner, and `page.md` names the bare `PageContainer` as the case to avoid.
- `frontend-dev.md` gains the matching "Common mistakes" entry, and `testing.md` a test for a covering child page: the parent's heading is inside an `inert` element, which fails for a page that renders inline.
