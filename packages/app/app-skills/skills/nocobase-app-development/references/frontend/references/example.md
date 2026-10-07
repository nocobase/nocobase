# Worked example: the projects feature

The complete source of the example the frontend handbook uses throughout: a projects list with search and a status filter, a create dialog, a detail drawer with an edit dialog stacked on it, the same edit dialog opened alone from a row's menu, a shared form and a delete confirmation, a dashboard that opens the drawer over itself, a customer's page with tabs whose header opens its edit dialog over the tab being shown, and the other complete components the topic documents describe. Every file compiles against this template and passes its lint rules. Each file of the feature has its own document under `example/`, which opens with the rules it follows, a **Depends on** line naming the documents whose files it imports (and the route it needs), an **Add first** line naming the primitives it imports that the template does not ship, and, for a page, a **Links to** line naming the child routes it opens. The remaining complete components live in the topic documents that explain them.

Read the document for your task, and every document its **Depends on** line names, and theirs in turn, for the rules they follow and how the files fit together. Then write your feature's files from its own requirement rather than copying these ([`frontend-dev.md`](../frontend-dev.md) lists what to decide again), and add what **Links to** names or drop those links:

| Task                                                       | Read                                                                                                                                                                 |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A list page with a create dialog                           | [list page](example/list-page.md) without its row menu and delete dialog, and [create dialog](example/create-dialog.md)                                              |
| A list page with create, detail, edit and delete           | [list page](example/list-page.md), [create dialog](example/create-dialog.md), [detail drawer](example/detail-drawer.md) and [edit dialog](example/edit-dialog.md)    |
| A list paginated by the server                             | [server table](example/server-table.md), which changes the list page, with the child routes the list page uses                                                       |
| A dashboard, or another page that opens a record's drawer  | [dashboard](example/project-dashboard.md), with the [detail drawer](example/detail-drawer.md) and [edit dialog](example/edit-dialog.md) it declares under itself     |
| A form too long for a dialog                               | [create page](example/create-page.md)                                                                                                                                |
| A form field that points at another record                 | [customer picker](example/customer-picker.md)                                                                                                                        |
| A settings page                                            | [settings page](example/settings-page.md); [public switch](example/public-switch.md) for a toggle; [settings form](example/settings-form.md) for every other control |
| A component that loads one record, or a single-click write | [project summary](example/project-summary.md) or [complete button](example/complete-button.md)                                                                       |
| A record detail page with tabs                             | [detail page with tabs](example/detail-page-tabs.md), with the [edit dialog](example/edit-dialog.md) it declares under every tab                                     |

The template ships neither `client/components/session-expired-alert.tsx` nor `client/hooks/use-url-search.ts`. They are shared infrastructure rather than feature code: the first feature that needs one copies it unchanged from its document here, and later features import it.

The template ships only the shadcn/ui primitives its shell uses, and no `DataTable`. A document whose file imports another primitive or `DataTable` says so on its **Add first** line; run that command before your code imports one, then format the files it creates, as [section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest) describes. The whole feature needs:

```bash
yes n | pnpm exec shadcn add alert alert-dialog badge card chart checkbox combobox empty field input-group radio-group select skeleton switch table textarea
```

`chart` installs `recharts`; move it to `devDependencies` ([section 1 of `shadcn.md`](shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)). `DataTable` is built in `client/components/data-table/` before the first list, as [section 1 of `table.md`](table.md#1-choosing-a-table-component) describes, with `@tanstack/react-table` in `devDependencies`.
