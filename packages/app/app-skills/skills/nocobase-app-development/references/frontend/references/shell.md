# Customizing the application shell

The shell is `client/routing/` and `client/layouts/`, with the header, sidebar and account controls in `client/layouts/components/`. It is template scaffolding this application owns: declare business pages, menus and permissions on the routes instead ([`page.md`](page.md)), and change the shell only when they cannot express the requirement. When you do, comment in the code what you changed and why, so that a later template upgrade can judge whether the change is still needed (see `AGENTS.md`).

## 1. Behaviors to keep

- The header's "Settings" entry appears only when the user can open at least one settings page, and stays visible on that page; the header reads the registered tree through `useClientApplication().runtime.settingsRouteTree`. The "Dev tools" entry appears only in development, stays visible on its pages, and must not reach the production build.
- The account menu's language control (`client/layouts/components/language-switcher.tsx`) is a submenu with radio items and must stay inside `DropdownMenuContent`, which provides its keyboard navigation and selected state.
- Navigation groups keep their expanded or collapsed state while the navigation tree stays mounted; opening a new page expands its ancestor groups without collapsing the others. Keep App, Settings and Dev consistent.
- The sidebar is shadcn's `Sidebar`, composed in `client/layouts/components/app-sidebar.tsx` (provider, desktop sidebar, phone sheet, header toggle) and `navigation-menu.tsx` (the route tree as `SidebarMenu*` entries with controlled `Collapsible` sub-menus). Keep `client/components/ui/sidebar.tsx` as the shadcn CLI writes it and change the sidebar from these two files: the widths are set through the provider's `style` in spacing units (`--sidebar-width`, `--sidebar-width-icon`) so they follow the density preset; the phone sheet is rendered in `app-sidebar.tsx` with a translated title instead of the primitive's own; and the provider's Ctrl/Cmd+B shortcut is stopped by a `document` keydown listener, so the key stays with editors.
- The desktop sidebar can collapse to icons: leaf entries then show their label in a tooltip without delay and groups open in a popover on hover or keyboard focus, keeping the filtered entries, parent-page links, nested groups and the highlight of the group holding the current page. The collapsed state is shared through `useSidebarPreference` under `nocobase:sidebar:collapsed` by every application on the same origin, while whether the phone sheet is open stays local to each layout.
- The authorization provider clears the permission snapshot before rendering a new session; route navigation and page guards subscribe to the authorization revision, so account switches and permission changes take effect without a reload.
- When signing out, the account menu checks the result from Better Auth and shows a localized error message on failure; do not treat navigating away as having signed out.

## 2. Header icon buttons

The icon button area in the top-right corner of the page is in `client/layouts/components/header-actions.tsx` (the layout's header, not `PageHeader`'s `actions`). Choose the hover behavior by what the entry does:

| What the entry does                                     | On hover                                                                                                           | Examples                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Navigates to another page                               | Show a short tooltip describing the destination or purpose                                                         | Component examples, Settings, Notifications |
| Opens a menu or configuration panel on the current page | Open the panel on hover; close it once the pointer leaves the trigger and panel area. Do not add a tooltip as well | Appearance, account menu                    |

### Navigation entries

Use `Tooltip`, `TooltipTrigger`, and `TooltipContent`, and pass the router's `Link` through the trigger's `render`. Reuse the header's existing `TooltipProvider`, and show the tooltip below (`side='bottom'`). Declare the target page in `client/routes.ts` first ([`page.md`](page.md)).

```tsx
// client/layouts/components/header-actions.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { CircleHelp, MonitorCog, Settings } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
// … (the other imports and ACTION_LINK_CLASS stay unchanged)

export function HeaderActions({
  showSettings,
  showDev,
}: {
  readonly showSettings: boolean;
  readonly showDev: boolean;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-2'>
        {/* … */}
        {/* New navigation entry: goes to the help page and shows a short hint on hover and keyboard focus. */}
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
        {/* … */}
      </div>
    </TooltipProvider>
  );
}
```

- Keep the link's route, access control, and button styling unchanged (reuse the file's `ACTION_LINK_CLASS`).
- Keep the hint to a few words, such as "Settings" or "Notification center"; do not write sentences like "Click here to go to…". It also shows on keyboard focus (Base UI's Tooltip does this by default; do not turn it off).
- Translate both the tooltip and the `aria-label`; an unread count can be added to the `aria-label`.
- Do not also write a native `title` attribute, or a second browser tooltip appears. An icon-only trigger must keep an accessible name.

### Menus and configuration panels

- Use `DropdownMenu` for action menus and submenus, and `Popover` for configuration panels. Set `openOnHover` and `delay={0}` on the trigger; closing has no delay (`closeDelay` defaults to 0). See `client/layouts/components/user-menu.tsx`.
- When the pointer moves from the trigger to the panel, or between a menu and the submenu it opens, the controls must stay reachable. Leave this interaction region, positioning, focus, and dismissal to the component.
- Keep opening by click and touch, keyboard navigation, and closing with Esc.
- Keep the component's default distinction: a panel opened by hover closes when the pointer leaves; a panel opened by click stays open until an outside click or Esc. Do not use custom mouseleave handlers, coordinate checks, timers, or extra open state to force a click-opened panel to close like a hover-opened one. Prefer the component's existing public options over reimplementing them yourself.
- When selecting an item completes the action, use the component's built-in dismissal: the language radio items in the account menu have `closeOnClick`, so the menu closes immediately after a selection (`language-switcher.tsx` in the same directory); by default, radio items do not close the menu on selection. The header's Appearance popover (`client/theme/theme-settings.tsx`) stays open after a selection so you can keep adjusting, and closes the way `Popover` does by default.

### Consistency

- Translate the copy and use tokens for colors. Header icon buttons match the existing entries in size, spacing, focus style, and button styling.
- Leave overlay positioning to the component, including at the right edge of the screen.
- Whichever entry you change, reuse its existing interaction tests (for example `tests/components/header-hover.test.tsx`). Do not simulate layout or submenu pointer geometry in jsdom; it does not match how a real browser behaves.

## 3. Verify

- Run the shell tests that cover what you changed: `tests/components/header-hover.test.tsx` (hover, keyboard and Escape), `navigation-menu.test.tsx`, `sidebar-permissions.test.tsx`, `sidebar-preference.test.tsx` and `language-switcher.test.tsx` under `tests/components/`, and `tests/logic/client-shell.test.tsx` and `tests/logic/user-menu-sign-out.test.tsx`.
- Look at the App, Settings and Dev layouts in the browser, on the desktop and at 375px, with the sidebar expanded and collapsed.
