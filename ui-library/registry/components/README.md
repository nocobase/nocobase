# NocoBase business components

Single components that pages are built from. Each is its own item, installs into the consumer's `client/components/` beside the components it already owns, and belongs to the consumer from then on. The application templates ship the page-layout and route-overlay components preinstalled there; the date pickers are installed when a page needs one.

| Item               | Installs                                                                | Exports                          |
| ------------------ | ----------------------------------------------------------------------- | -------------------------------- |
| `page-container`   | `page-container.tsx`                                                    | `PageContainer`                  |
| `page-header`      | `page-header.tsx`                                                       | `PageHeader`                     |
| `route-dialog`     | `route-dialog.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts` | `RouteDialog`, `useRouteOverlay` |
| `route-drawer`     | `route-drawer.tsx`, with `route-overlay.tsx` and `use-route-overlay.ts` | `RouteDrawer`, `useRouteOverlay` |
| `route-child-page` | `route-child-page.tsx`                                                  | `RouteChildPage`                 |
| `date-picker`      | `date-picker.tsx`                                                       | `DatePicker`, `DateRangePicker`  |
| `date-time-picker` | `date-time-picker.tsx`, with `date-picker.tsx`                          | `DateTimePicker`                 |

`route-dialog` and `route-drawer` both install `route-overlay.tsx`, the implementation they share, and `use-route-overlay.ts`, the Context it provides. Installing the second of them finds both files already in place. `date-time-picker` installs `date-picker.tsx` the same way, because `DateTimePicker` is the `DatePicker` composition with a time field.

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

`RouteChildPage` is not modal. It positions itself with `absolute inset-0`, so the element that contains it must be positioned; an application's content area is. Render its `Outlet` beside the page's `PageContainer` rather than inside it, and give the child page a `PageContainer` of its own. While it is mounted, the siblings it covers are `inert`. It has no close button: the breadcrumb above it, or the browser's back button, returns to the page beneath.

## Date pickers

`DatePicker` is a date field: a button showing the formatted value that opens a `Calendar` inside a `Popover`. `DateRangePicker` is the same composition for a range, showing two months side by side by default. Both work controlled with `value` and `onChange` or uncontrolled with `defaultValue`, and both accept `id`, `className`, `placeholder`, `disabled`, `locale`, `formatString`, `align`, `calendarProps`, and `closeOnSelect`. `DatePicker` also takes `footer`, the slot `DateTimePicker` uses.

`DateTimePicker` builds on `DatePicker`: it shows the date and time together (`PPP p`), keeps the popover open after a day is picked, and edits the time to the minute from a footer with the time input, Clear and Confirm.

```tsx
import { DatePicker } from '@/components/date-picker';
import { DateTimePicker } from '@/components/date-time-picker';

<DatePicker value={publishedAt} onChange={setPublishedAt} locale={zhCN} />
<DateTimePicker id='article-publish-at' value={publishedAt} onChange={setPublishedAt} locale={zhCN} />
```

Pass a `date-fns` `locale` so the trigger text and the calendar follow the interface language. The trigger never clips a long localized value: it grows past its width when the formatted text needs the room.

## Translations

The overlays' close button names itself with `useTranslation()` from `@nocobase/i18n/client` under `routeOverlay.close`, falling back to `Close`, and the date pickers look up their keys the same way. A component ships no locale file, so add the keys to the locale resources of the namespace that renders them:

| Key                           | `en-US`           | `zh-CN`      |
| ----------------------------- | ----------------- | ------------ |
| `routeOverlay.close`          | Close             | 关闭         |
| `datePicker.placeholder`      | Pick a date       | 选择日期     |
| `datePicker.rangePlaceholder` | Pick a date range | 选择日期范围 |
| `dateTimePicker.time`         | Time              | 时间         |
| `dateTimePicker.clear`        | Clear             | 清除         |
| `dateTimePicker.confirm`      | Confirm           | 确认         |

`page-container`, `page-header` and `route-child-page` render no text of their own.

## In a plugin

`page-header` has no `@/` imports and compiles in a plugin as installed. The others import `cn` from `@/lib/utils`, and most of them also import primitives as `@/components/ui/<name>` — `route-dialog` and `route-drawer` the `button` and `dialog` ones, `date-picker` the `button`, `calendar` and `popover` ones, and `date-time-picker` the `button`, `field` and `input-group` ones; rewrite those imports to relative `.js` paths, as [USAGE.md](../../USAGE.md#add-an-item-to-a-plugin) describes. `date-time-picker` already reaches `DatePicker` through `./date-picker.js`, so the two files stay together wherever they are installed.
