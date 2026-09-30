# NocoBase business components

Single components that pages are built from. Each is its own item, installs into the consumer's `client/components/` beside the components it already owns, and belongs to the consumer from then on. The application templates ship the page-layout, route-overlay and back-button components preinstalled there; the date pickers, the data table and the confirm dialog are installed when a page needs one.

| Item               | Installs                                                                          | Exports                                                                             |
| ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `page-container`   | `page-container.tsx`                                                              | `PageContainer`                                                                     |
| `page-header`      | `page-header.tsx`                                                                 | `PageHeader`                                                                        |
| `route-dialog`     | `route-dialog.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts`           | `RouteDialog`, `useRouteOverlay`                                                    |
| `route-drawer`     | `route-drawer.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts`           | `RouteDrawer`, `useRouteOverlay`                                                    |
| `route-child-page` | `route-child-page.tsx`                                                            | `RouteChildPage`                                                                    |
| `back-button`      | `back-button.tsx`                                                                 | `BackButton`                                                                        |
| `date-picker`      | `date-picker.tsx`                                                                 | `DatePicker`, `DateRangePicker`                                                     |
| `date-time-picker` | `date-time-picker.tsx`, with `date-picker.tsx`                                    | `DateTimePicker`                                                                    |
| `data-table`       | `data-table/index.tsx`, `column-header.tsx`, `pagination.tsx`, `view-options.tsx` | `DataTable`, `DataTableColumnHeader`, `DataTablePagination`, `DataTableViewOptions` |
| `confirm-dialog`   | `confirm-dialog.tsx`                                                              | `ConfirmDialog`                                                                     |

`route-dialog` and `route-drawer` both install `route-overlay.tsx`, the implementation they share, and `use-route-overlay.ts`, the Context it provides. Installing the second of them finds both files already in place. `date-time-picker` installs `date-picker.tsx` the same way, because `DateTimePicker` is the `DatePicker` composition with a time field. `data-table` is one item of four files in `client/components/data-table/`: the header, pagination and view menu only make sense around the table, so they install together.

## Page layout

`PageContainer` renders a `section` with the full width, the responsive padding (`p-6 md:p-8`) and the spacing between sections (`space-y-6`). It accepts every `section` prop, and `className` is merged with `cn`, so it can override the defaults. `PageHeader` renders the page's only `h1`, an optional `description`, and `actions` aligned to the right from the `sm` breakpoint up.

```tsx
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';

export default function OrdersPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Orders'
        description='Track every order from checkout to delivery.'
        actions={<Button>New order</Button>}
      />
      {/* sections */}
    </PageContainer>
  );
}
```

A page renders one `PageContainer`. Content that renders inside another page — an inline child route, a tab panel — already sits in that page's container and adds none of its own. A covering `RouteChildPage` is a surface of its own and places a `PageContainer` inside it; a dialog or drawer brings its own padding.

## Route overlays

The three ways a child route presents itself over the page that opened it, each at a URL of its own. The application owns the routes: declare each overlay as a child route of its page, render an `Outlet` in that page, and return the overlay from the child route's component.

```tsx
import { RouteDialog } from '@/components/route-dialog';
import { useRouteOverlay } from '@/components/use-route-overlay';

function CancelButton() {
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button variant='outline' disabled={isClosing} onClick={() => void close()}>
      Cancel
    </Button>
  );
}

export default function NewOrderDialog() {
  return (
    <RouteDialog title='New order' footer={<CancelButton />}>
      {/* form */}
    </RouteDialog>
  );
}
```

`RouteDialog` and `RouteDrawer` take the same props: `title`, `description`, `children`, `footer`, `className`, `closeTo`, where closing navigates and which defaults to the parent route with the current search string, and `beforeClose`, which runs before every close — the close button, Escape, the backdrop and `useRouteOverlay().close()` alike — and keeps the overlay open when it resolves `false`. An overlay opened from another overlay renders at the outer one's `Outlet`, gets its own backdrop, and returns focus into the outer panel when it closes. To restyle both, edit `route-overlay.tsx`.

Call `useRouteOverlay()` from a component rendered inside the overlay, such as a footer button. The page component that returns `<RouteDialog>` sits outside the overlay's provider, and the hook throws there.

`RouteChildPage` is not modal. It positions itself with `absolute inset-0`, so the element that contains it must be positioned; an application's content area is. The page it covers renders its `Outlet` last, at the end of its `PageContainer`: the layer makes what comes before it `inert`, and anything after it would stay reachable. Give the child page a `PageContainer` of its own, inside `RouteChildPage`; returned bare, a child route's `PageContainer` renders below the parent's content instead of covering it. A child page that can only render inside another one — the child page of a tab, reached through the tab's outlet — covers the enclosing child page whole, because a `RouteChildPage` is two elements: the outer one positions and never scrolls, the inner one scrolls. While it is mounted, the siblings it covers are `inert`, and inside another child page so is everything around it up to that page's scrolling element. It has no close button: a [`BackButton`](#back-button) above its heading, or the browser's back button, returns to the page beneath.

## Back button

`BackButton` is the way back from a page that sits below another one: a covering `RouteChildPage`, a record's own page, a form too long for a dialog. The page places it inside its `PageContainer`, above its `PageHeader`, where breadcrumbs would otherwise be, and it needs nothing from the header. It is a muted text link with an arrow and "Back", turning to the foreground on hover, so it reads as a way out rather than an action.

```tsx
import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';

export default function OrderPage() {
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
        <PageHeader title='SO-1042' description='Acme Corp' />
        {/* sections */}
      </PageContainer>
    </RouteChildPage>
  );
}
```

By default it leads to the parent route and keeps the current query string, as closing a route overlay does, so the list a child page covers gets its search and filters back. The parent is found by route, not by path segment: a child route with a two-segment path, such as `import/:batchId`, returns to its parent too. It navigates rather than going back in the browser history, which a page opened from a link or a refresh does not have, and it replaces the history entry, so the browser's Back does not reopen the page just left. `to` sends it elsewhere, such as a record page declared beside its list (`to={{ pathname: '/orders', search: location.search }}`); `children` replaces the label, and `className` is merged with `cn`.

## Date pickers

`DatePicker` is a date field: a button showing the formatted value that opens a `Calendar` inside a `Popover`. `DateRangePicker` is the same composition for a range, showing two months side by side by default. Both work controlled with `value` and `onChange` or uncontrolled with `defaultValue`, and both accept `id`, `className`, `placeholder`, `disabled`, `locale`, `formatString`, `align`, `calendarProps`, and `closeOnSelect`. `DatePicker` also takes `triggerLabel`, which replaces the formatted trigger text, and `footer`, the slot `DateTimePicker` uses.

`DateTimePicker` builds on `DatePicker`: it shows the date and time together (`PPP p`), keeps the popover open after a day is picked, and edits the time to the minute from a footer with the time fields, Clear and Confirm. `mode='single'`, the default, returns one moment. `mode='range'` returns a `DateTimeRange` — a start and an end on the day the calendar selects, for a window inside one day. In range mode the times start at 09:00 and 10:00, and the two ends stay ordered: moving the start past the end carries the end along, and moving the end before the start pulls the start back.

```tsx
import { DatePicker } from '@/components/date-picker';
import { DateTimePicker, type DateTimeRange } from '@/components/date-time-picker';

<DatePicker value={publishedAt} onChange={setPublishedAt} locale={zhCN} />
<DateTimePicker id='article-publish-at' value={publishedAt} onChange={setPublishedAt} locale={zhCN} />
<DateTimePicker mode='range' value={window} onChange={setWindow} locale={zhCN} />
```

Pass a `date-fns` `locale` so the trigger text and the calendar follow the interface language. The trigger never clips a long localized value: it grows past its width when the formatted text needs the room.

## Data table

`DataTable` renders a list with TanStack Table, composed from the `Table` primitive: sorting, filtering, column visibility, row selection and pagination all run in the browser over the `data` it is given. Column definitions decide what each feature does. A sortable column uses `DataTableColumnHeader` as its `header`, which opens a menu to sort or hide the column; `toolbar` receives the table instance and renders above the table, where filters call `table.getColumn(id)?.setFilterValue(...)` and `DataTableViewOptions` toggles the hideable columns; a display column that renders a `Checkbox` selects rows.

```tsx
import type { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/data-table';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { DataTableViewOptions } from '@/components/data-table/view-options';

const columns: ColumnDef<Order>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Order' />
    ),
  },
  { accessorKey: 'customer', header: 'Customer' },
];

<DataTable
  columns={columns}
  data={orders}
  toolbar={(table) => <DataTableViewOptions table={table} />}
  showSelectedCount={false}
/>;
```

`DataTable` also takes `emptyMessage`, shown when no row survives filtering; `pagination={false}`, which renders every row and drops the footer; `pageSize` and `pageSizeOptions`; `getRowId`; `onRowClick`; and `showSelectedCount`, which turns off the "n of m row(s) selected" summary for a table without row selection. Inside a card's `CardContent` the table drops its own border and reaches the card's edges, and its first and last cells take the card's padding, so its text lines up with the card's title. `DataTablePagination` is what `DataTable` renders below the rows; use it directly only when composing a table by hand.

## Confirm dialog

`ConfirmDialog` confirms one action, such as deleting, disabling or revoking something, in an alert dialog built on the `alert-dialog` primitive. The page decides when it opens and what the action does; the dialog runs the action, shows that it is running, keeps a failure inside itself, and afterwards sends focus somewhere that still exists. A confirmation concerns a single action, so it opens from component state rather than from a route, and it has no trigger of its own.

```tsx
import { ConfirmDialog } from '@/components/confirm-dialog';

// Keep the target beside `open`: closing then changes only `open`, so the title does not go blank while the dialog
// animates closed.
const [deletion, setDeletion] = useState<{
  readonly open: boolean;
  readonly project: Project | null;
}>({ open: false, project: null });

<ConfirmDialog
  open={deletion.open}
  onOpenChange={(open) => setDeletion((current) => ({ ...current, open }))}
  title={t('projects.delete.title', { name: deletion.project?.name ?? '' })}
  description={t('projects.delete.description')}
  confirmLabel={t('projects.actions.delete')}
  focusAfterConfirm={searchRef}
  onConfirm={async () => {
    const project = deletion.project;
    if (!project) return;
    try {
      await api.request({ path: `projects/${project.id}`, method: 'DELETE' });
      toaster.show({
        type: 'success',
        title: t('projects.delete.success', { name: project.name }),
      });
    } catch (error: unknown) {
      const status = error instanceof ApiClientError ? error.status : 0;
      if (status === 401)
        return { error: <SessionExpiredAlert />, retryable: false };
      if (status === 403)
        return { error: t('projects.error.forbidden'), retryable: false };
      if (status !== 404) return { error: t('projects.error.requestFailed') };
      // Someone else deleted it already, which is what the user wanted.
      toaster.show({
        type: 'info',
        title: t('projects.delete.notFound', { name: project.name }),
      });
    }
    reload();
  }}
/>;
```

| Prop                | Type                                                        | Default                           | What it does                                                                                                                 |
| ------------------- | ----------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `open`              | `boolean`                                                   | required                          | Whether the dialog is open                                                                                                   |
| `onOpenChange`      | `(open: boolean, reason: 'cancel' \| 'confirm') => void`    | required                          | Called with `false` when the dialog closes itself: `'cancel'` after Cancel or Escape, `'confirm'` after the action succeeded |
| `title`             | `ReactNode`                                                 | required                          | The action and its object, such as `Delete project "Apollo"?`                                                                |
| `description`       | `ReactNode`                                                 | none                              | The consequence, such as "This cannot be undone."                                                                            |
| `confirmLabel`      | `ReactNode`                                                 | required                          | The specific action, such as "Delete"                                                                                        |
| `destructive`       | `boolean`                                                   | `true`                            | Styles the confirm button as destructive                                                                                     |
| `cancelLabel`       | `ReactNode`                                                 | `confirmDialog.cancel`, "Cancel"  | The cancel button's text                                                                                                     |
| `onConfirm`         | `() => ConfirmDialogResult \| Promise<ConfirmDialogResult>` | required                          | The action: returning nothing closes the dialog, returning a `ConfirmDialogFailure` or rejecting keeps it open               |
| `focusAfterConfirm` | `RefObject<HTMLElement \| null>`                            | none: focus returns to the opener | Where focus goes when the dialog closes after the action succeeded                                                           |

`ConfirmDialogResult` is `ConfirmDialogFailure | void`, and `ConfirmDialogFailure` is `{ error: ReactNode; retryable?: boolean }`. A string `error` renders as one line of destructive text with `role='alert'`; any other node renders as given and announces itself, the way the `Alert` inside `SessionExpiredAlert` does; `null`, `undefined` or an empty string shows the default message. `retryable: false` keeps the confirm button disabled until the dialog closes. A rejection shows the default message, `confirmDialog.failed`, and logs the cause to the console; the error's own text never reaches the user.

Classify the failures you expect in `onConfirm` and return them, as the application development Skill's delete confirmation does: an ended session (401) returns `SessionExpiredAlert` with `retryable: false`, a missing permission (403) returns `retryable: false`, and on a delete a record that is already gone (404) counts as a success. Do not let an `ApiClientError` reject instead. A rejection is always shown as the generic failure with the confirm button enabled, which invites a retry that cannot succeed.

`onOpenChange(false)` also follows a success, with `'confirm'` as its reason, so code ported from a dialog whose close meant cancel has to check `reason` before cancelling. A caller that keeps `open` in its own state closes the dialog for both reasons; one that ignores `'confirm'` leaves the dialog open with its buttons disabled. When the caller closes or unmounts the dialog while the action runs, the result that arrives afterwards is dropped: no failure is shown, not even in a dialog opened again, and `onOpenChange` is not called. A result that does arrive in time is reported to the `onOpenChange` of the latest render, not to the one from the render the click happened in.

Why it is shaped this way:

- **Controlled, with no trigger.** A list renders one dialog for all its rows and sets the target when a row's menu asks to delete it, and a drawer opens it from a footer button; neither is a single trigger. Keeping the target beside `open`, as the example does, keeps the title from going blank while the dialog animates closed.
- **`confirmLabel` is required and has no default.** The button names the specific action, such as "Delete" or "Revoke", never "OK" or "Confirm"; a default would be exactly the wording to avoid.
- **`destructive` defaults to `true`.** Nearly every action that needs a confirmation destroys or withdraws something. An action that loses nothing, such as enabling a user, passes `false`.
- **The dialog runs the action instead of taking a `pending` prop.** The spinner, both buttons disabled and Escape ignored while the action runs are the same for every caller, and none of the hand-written confirmations in the plugins has all of it. Taking the action's promise gets it right once, while the request, the toasts and what a missing record means stay in the caller's `onConfirm`.
- **A failure is a return value as well as a rejection.** The failures a caller expects are the ones it tells apart by status — an ended session, a missing permission, a record already gone — and only the caller knows what to say and whether trying again can help, which `{ error, retryable }` carries. A rejection is the failure nobody classified, so it gets a generic message. The dialog stays open either way.
- **`error` is a node.** One line of text covers most failures, but an ended session needs a "Sign in again" action, which the application's `SessionExpiredAlert` already provides. Only a string is wrapped in an alert, so a node that is an alert itself is not nested inside another one.
- **The dialog closes itself after a success, and says why.** Calling `onOpenChange(false, 'confirm')` means a plain state setter is all a caller needs. A caller for whom cancelling is itself an action, such as a navigation guard that undoes the traversal when the user keeps editing, runs that action only when the reason is `'cancel'`; the dialog still has to close for `'confirm'`, which a guard's `open` does on its own once confirming has accepted the traversal. A caller that closes something larger, such as the drawer the dialog was opened from, may do so from `onConfirm`, which unmounts the dialog with it.
- **The buttons stay disabled until the dialog has closed.** After a success the spinner stays on through the closing animation, so a second click or a held Enter cannot run the action twice. Confirming moves focus to the confirm button, since Cancel is about to be disabled and a mouse click does not focus a button in every browser. The confirm button stays focusable while it is disabled, so focus is still on it when a failure enables it again.
- **Cancel has the focus when the dialog opens,** so pressing Enter straight away does not run the action.
- **`focusAfterConfirm` applies only after a success.** After a cancel, the element that opened the dialog is still there and gets the focus back. After a delete it has often gone with its row, and focus would fall to the page; the caller names a stable place instead, such as the list's search box.

The dialog has no body slot, icon, size or `className`; edit the installed copy when a confirmation needs one, using the `AlertDialogMedia` part and the `size` prop of `AlertDialogContent` that `alert-dialog` provides. The spinner's accessible name comes from your own `spinner.tsx`: the application templates' copy translates it, while a copy fresh from shadcn says "Loading" until you translate it there.

## Translations

The overlays' close button names itself with `useTranslation()` from `@nocobase/i18n/client` under `routeOverlay.close`, falling back to `Close`, and the back button, the date pickers, the data table and the confirm dialog look up their keys the same way. A component ships no locale file, so add the keys to the locale resources of the namespace that renders them:

| Key                           | `en-US`                                    | `zh-CN`                              |
| ----------------------------- | ------------------------------------------ | ------------------------------------ |
| `routeOverlay.close`          | Close                                      | 关闭                                 |
| `navigation.back`             | Back                                       | 返回                                 |
| `datePicker.placeholder`      | Pick a date                                | 选择日期                             |
| `datePicker.rangePlaceholder` | Pick a date range                          | 选择日期范围                         |
| `dateTimePicker.time`         | Time                                       | 时间                                 |
| `dateTimePicker.startTime`    | Start Time                                 | 开始时间                             |
| `dateTimePicker.endTime`      | End Time                                   | 结束时间                             |
| `dateTimePicker.clear`        | Clear                                      | 清除                                 |
| `dateTimePicker.confirm`      | Confirm                                    | 确认                                 |
| `dataTable.noResults`         | No results.                                | 暂无数据。                           |
| `dataTable.sortAscending`     | Asc                                        | 升序                                 |
| `dataTable.sortDescending`    | Desc                                       | 降序                                 |
| `dataTable.hideColumn`        | Hide                                       | 隐藏                                 |
| `dataTable.view`              | View                                       | 视图                                 |
| `dataTable.toggleColumns`     | Toggle columns                             | 显示列                               |
| `dataTable.selectedCount`     | {{selected}} of {{total}} row(s) selected. | 已选择 {{selected}} / {{total}} 行。 |
| `dataTable.rowsPerPage`       | Rows per page                              | 每页行数                             |
| `dataTable.pageOf`            | Page {{page}} of {{pageCount}}             | 第 {{page}} 页，共 {{pageCount}} 页  |
| `dataTable.firstPage`         | Go to first page                           | 第一页                               |
| `dataTable.previousPage`      | Go to previous page                        | 上一页                               |
| `dataTable.nextPage`          | Go to next page                            | 下一页                               |
| `dataTable.lastPage`          | Go to last page                            | 最后一页                             |
| `confirmDialog.cancel`        | Cancel                                     | 取消                                 |
| `confirmDialog.failed`        | The action failed. Please try again.       | 操作失败，请重试。                   |

`page-container`, `page-header` and `route-child-page` render no text of their own. The application templates' locale files already carry the `datePicker` and `dataTable` keys, so installing `date-picker` or `data-table` into an application created from a template needs no locale change. They do not carry the `confirmDialog` keys; add both when installing `confirm-dialog`.

## In a plugin

`page-header` has no `@/` imports and compiles in a plugin as installed. `confirm-dialog` imports the `alert-dialog` and `spinner` primitives as `@/components/ui/<name>` and no `cn`. The others import `cn` from `@/lib/utils`, and most of them also import primitives as `@/components/ui/<name>` — `route-dialog` and `route-drawer` the `button` and `dialog` ones, `date-picker` the `button`, `calendar` and `popover` ones, `date-time-picker` the `button`, `field` and `input-group` ones, and `data-table` the `button`, `dropdown-menu`, `select` and `table` ones; rewrite those imports to relative `.js` paths, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes. `date-time-picker` already reaches `DatePicker` through `./date-picker.js`, and `DataTable` its pagination through `./pagination.js`, so each item's files stay together wherever they are installed.
