# Customizing the application shell

The shell is `client/routing/` and `client/layouts/`, with the header, sidebar and account controls in `client/layouts/components/`. It is template scaffolding this application owns: declare business pages, menus and permissions on the routes instead ([`page.md`](page.md)), and change the shell only when they cannot express the requirement. When you do, comment in the code what you changed and why, so that a later template upgrade can judge whether the change is still needed, and record the shell's application-specific behavior in `.agents/rules/` as [application structure](../../app-structure.md#the-rest-is-framework-structure) describes.

## 1. Behaviors to keep

- There is no separate settings layout and no Settings or Inbox entry in the header: every signed-in page renders inside `AppLayout`. Administration pages are System settings routes under `/settings`, shown through one entry at the bottom of the sidebar that opens the first settings page the viewer may open; on any settings page the sidebar shows the settings menu instead of the business menu, and the breadcrumb's System settings level links back to `/settings` ([System settings navigation](../../settings-navigation.md)). Do not add a second layout, a resident settings sidebar or a router split for settings. The shell shares its single page permission check with pages through `RouteTreeProvider`'s `access` (`useRouteAccess`); the settings menu, `/settings` itself and module tabs read it rather than checking again.
- The account menu's language control (`client/layouts/components/language-switcher.tsx`) is a submenu with radio items and must stay inside `DropdownMenuContent`, which provides its keyboard navigation and selected state.
- Collapsible navigation groups keep their expanded or collapsed state while the navigation tree stays mounted; opening a new page expands its ancestor groups without collapsing the others.
- The sidebar is shadcn's `Sidebar`, composed in `client/layouts/components/app-sidebar.tsx` (provider, desktop sidebar, phone sheet, header toggle) and `navigation-menu.tsx` (the route tree as `SidebarMenu*` entries: a top-level group with no page is a section under a heading, its entries always shown; clickable parents and nested groups are controlled `Collapsible` sub-menus; counts beside entries come from the route's `navigation.badge` or the layout's `badges`, [`page.md`](page.md#a-count-beside-an-entry)). Keep `client/components/ui/sidebar.tsx` as the shadcn CLI writes it and change the sidebar from these two files: the widths are set through the provider's `style` in spacing units (`--sidebar-width`, `--sidebar-width-icon`) so they follow the density preset; the phone sheet is rendered in `app-sidebar.tsx` with a translated title instead of the primitive's own; and the provider's Ctrl/Cmd+B shortcut is stopped by a `document` keydown listener, so the key stays with editors.
- The desktop sidebar can collapse to icons: leaf entries then show their label in a tooltip without delay and section headings hide and their entries keep their icons, collapsible groups open in a popover on hover or keyboard focus, keeping the filtered entries, parent-page links, nested groups and the highlight of the group holding the current page. The collapsed state is shared through `useSidebarPreference` under `nocobase:sidebar:collapsed` by every application on the same origin, while whether the phone sheet is open stays local to each layout.
- Keep `RouteLeaveBoundary` in `AppLayout` outside every page Activity, including nested routes. Settings forms register with this shell boundary so navigation, confirmation dialogs and `beforeunload` protection remain active during permission checks. A final denial or session change removes the retained form guards. Activity restores Effects after a successful check, so mounted data hooks re-fetch; count those requests when assessing refresh cost.
- The authorization provider clears the permission snapshot before rendering a new session; route navigation and page guards subscribe to the authorization revision, so account switches and permission changes take effect without a reload.
- When signing out, the account menu checks the result from Better Auth and shows a localized error message on failure; do not treat navigating away as having signed out.

## 2. Header icon buttons

The icon button area in the top-right corner of the page is rendered by `client/layouts/components/header-actions.tsx` (the layout's header, not `PageHeader`'s `actions`): the buttons the application and its plugins register as header actions, by `order`, then the account menu, always last. On a phone it shows at most two registered buttons and moves the rest into a More popover, so the header stays on one line; a button that renders nothing takes no place and shows no badge. A signed-out visitor sees only buttons registered with `auth: 'optional'`, without badges: the layout passes `signedIn` to `useHeaderActions({ signedIn })`, which leaves the others out. Add a button by registering it in `client/header-actions.ts` — `{ name, order, component, auth?, badge? }`, where `badge` is a hook like a [navigation entry's](page.md#a-count-beside-an-entry) drawn on the button's corner — and hide or replace a plugin's button by name there with `headerActionOverrides` (`{ name: 'inbox', hidden: true }` or `{ name: 'inbox', component: MyInboxButton }`); do not edit `header-actions.tsx` for it. A plugin registers its own with `headerActions` in `defineClientPlugin()`. Choose the hover behavior by what the entry does:

| What the entry does                                     | On hover                                                                                                           | Examples            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------- |
| Navigates to another page                               | Show a short tooltip describing the destination or purpose                                                         | Help, Notifications |
| Opens a menu or configuration panel on the current page | Open the panel on hover; close it once the pointer leaves the trigger and panel area. Do not add a tooltip as well | Account menu        |

### Navigation entries

Use `Tooltip`, `TooltipTrigger`, and `TooltipContent`, and pass the router's `Link` through the trigger's `render`. The header already provides a `TooltipProvider`; show the tooltip below (`side='bottom'`). Declare the target page in `client/routes.ts` first ([`page.md`](page.md)).

```tsx
// client/components/help-header-button.tsx, registered in client/header-actions.ts:
// defineHeaderActions([{ name: 'help', order: 100, component: HelpHeaderButton }])
import { useTranslation } from '@nocobase/i18n/client';
import { CircleHelp } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';

const ACTION_LINK_CLASS =
  'inline-flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

// Goes to the help page and shows a short hint on hover and keyboard focus.
export function HelpHeaderButton(): ReactElement {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Link to='/help' className={ACTION_LINK_CLASS} />}
        aria-label={t('help.title', { defaultValue: 'Help' })}
      >
        <CircleHelp className='size-5' />
      </TooltipTrigger>
      <TooltipContent side='bottom'>
        {t('help.title', { defaultValue: 'Help' })}
      </TooltipContent>
    </Tooltip>
  );
}
```

- Keep every header entry the same size and style (`ACTION_LINK_CLASS` above matches the account trigger).
- Keep the hint to a few words, such as "Help" or "Notification center"; do not write sentences like "Click here to go to…". It also shows on keyboard focus (Base UI's Tooltip does this by default; do not turn it off).
- Translate both the tooltip and the `aria-label`; an unread count can be added to the `aria-label`.
- Do not also write a native `title` attribute, or a second browser tooltip appears. An icon-only trigger must keep an accessible name.

### Menus and configuration panels

- Use `DropdownMenu` for action menus and submenus, and `Popover` for configuration panels. Set `openOnHover` and `delay={0}` on the trigger; closing has no delay (`closeDelay` defaults to 0). See `client/layouts/components/user-menu.tsx`.
- When the pointer moves from the trigger to the panel, or between a menu and the submenu it opens, the controls must stay reachable. Leave this interaction region, positioning, focus, and dismissal to the component.
- Keep opening by click and touch, keyboard navigation, and closing with Esc.
- Keep the component's default distinction: a panel opened by hover closes when the pointer leaves; a panel opened by click stays open until an outside click or Esc. Do not use custom mouseleave handlers, coordinate checks, timers, or extra open state to force a click-opened panel to close like a hover-opened one. Prefer the component's existing public options over reimplementing them yourself.
- When selecting an item completes the action, use the component's built-in dismissal: the language radio items in the account menu have `closeOnClick`, so the menu closes immediately after a selection (`language-switcher.tsx` in the same directory); by default, radio items do not close the menu on selection. The account menu's Theme submenu (`client/theme/theme-settings.tsx`) keeps `closeOnClick={false}` so you can keep adjusting; Escape closes the submenu before the account menu.

### Consistency

- Translate the copy and use tokens for colors. Header icon buttons match the existing entries in size, spacing, focus style, and button styling.
- Leave overlay positioning to the component, including at the right edge of the screen.
- Whichever entry you change, reuse its existing interaction tests (for example `tests/client/header-hover.test.tsx`). Do not simulate layout or submenu pointer geometry in jsdom; it does not match how a real browser behaves.

## 3. Verify

- Run the shell tests that cover what you changed: `tests/client/header-hover.test.tsx` (hover, keyboard and Escape), `navigation-menu.test.tsx`, `sidebar-permissions.test.tsx`, `sidebar-preference.test.tsx` and `language-switcher.test.tsx` under `tests/client/`, and `tests/client/client-shell.test.tsx` and `tests/client/user-menu-sign-out.test.tsx`.
- Look at the App layout in the browser, on the desktop and at 375px, with the sidebar expanded and collapsed.
