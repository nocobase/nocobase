---
'@nocobase/app-skills': patch
---

The frontend handbook fixes what a review of a generated customer-service application found:

- A record opens over the page the user is on (guideline I9). A dashboard or a board declares the record's drawer and its edit dialog under its own route, through a `projectDetailRoutes(owner)` function in `client/routes.ts`, instead of linking to the list's overlay URL.
- A row menu's "Edit" opens the dialog alone, at the list's own `edit/:projectId`; the drawer's "Edit" keeps the dialog stacked on the drawer. The edit dialog reads `ProjectEditOutletContext` from either view.
- A page below another one has `BackButton` above its title (guideline L6); breadcrumbs only when the user asks for them.
- Date, time and number columns are sortable by default (guideline T1.8), and the server-paginated example sorts through a `sort` URL parameter.
- A table inside a card lines up with the card's title ("Table in a card" in `styling.md`).
- A dashboard template (guideline T5) and its worked example, `example/project-dashboard.md`: metric cards, a chart, and the recently updated projects, which open their drawer over the dashboard.
