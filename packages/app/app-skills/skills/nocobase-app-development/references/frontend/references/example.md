# Worked example: the projects feature

Start every new page from the runnable [executable list and edit example](executable-list-edit.md): it is tested continuously and its files can be copied and renamed. The Markdown files below are not run; they show, for one projects feature, the patterns a CRUD or settings page needs that the runnable example leaves out. Every import they show exists in the Default template or is defined by the example itself. Write your feature from its own page plan ([`ui-workflow.md`](../ui-workflow.md)) rather than copying field lists and copy from here.

- Endpoints, types, scopes, the status badge and error display: [types](example/types.md).
- A list with search, a filter, server pagination and row actions: [list page](example/list-page.md).
- Create and edit forms: [shared form](example/project-form.md), [create dialog](example/create-dialog.md), [edit dialog](example/edit-dialog.md).
- A record's detail with few fields: [detail drawer](example/detail-drawer.md); deleting it: [delete confirmation](example/delete-dialog.md).
- A settings page with a toggle that applies at once and a card form: [settings page](example/settings-page.md).
- A relation picker or batch assignment, or a detail page with related lists (`:customerId/details`): the runnable [customer/contact example](executable-relation-batch.md); tabs on a detail page: [`child-routes.md`](child-routes.md).

What every file follows, stated once here:

- **Refresh through scopes.** Views declare `scopes` in `useListData`; writes call `announceDataChange` ([data changes](data-changes.md)). No `reload` or `onSaved` callbacks pass through `<Outlet context>`.
- **Forms open in a `RouteDialog`** with a `FeedbackForm` given `values` and `savedValues`; the dialog asks before discarding unsaved input (guideline T3.9). Pages write no guard of their own.
- **Permission-dependent actions** are shown only when `useCan` allows them; the server checks again.
- **Phone**: the list's `renderCard` ends with the row's own "⋮" menu; overlays already fit a phone ([`mobile.md`](../mobile.md)).

## Routes

Append to `client/routes.ts` as [section 1 of `page.md`](page.md#1-declare-the-route) shows; the projects route takes these children:

```ts
children: [
  {
    name: 'project-new', // /projects/new
    path: 'new',
    presentation: { kind: 'dialog', title: 'projects.create.title' },
    componentLoader: () => import('./pages/projects/new.js'),
  },
  {
    name: 'project-detail', // /projects/:projectId, the drawer
    path: ':projectId',
    presentation: { kind: 'drawer', title: 'projects.detail.title' },
    componentLoader: () => import('./pages/projects/detail/index.js'),
    children: [
      {
        name: 'project-detail-edit', // /projects/:projectId/edit, stacked on the drawer
        path: 'edit',
        presentation: { kind: 'dialog', title: 'projects.edit.title' },
        componentLoader: () => import('./pages/projects/detail/edit.js'),
      },
    ],
  },
],
```

The overlays inherit the list's access; give each route without a navigation or breadcrumb title a permission display name ([`page.md`](page.md)).
