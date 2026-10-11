import { useClientApplication } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { PanelLeft, ShieldCheck, X } from 'lucide-react';
import {
  useEffect,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useSidebarPreference } from '../use-sidebar-preference.js';
import { AppBrand } from './app-brand.js';

/**
 * Keeps Ctrl/Cmd+B from toggling the sidebar. The shadcn provider listens for it on `window`; stopping the key at the
 * document, in the bubble phase, hides it from that listener while whatever had focus (the rich-text editor's bold)
 * has already handled it.
 */
function useNoSidebarShortcut(): void {
  useEffect(() => {
    const stop = (event: KeyboardEvent) => {
      if (event.key === 'b' && (event.metaKey || event.ctrlKey)) {
        event.stopPropagation();
      }
    };
    document.addEventListener('keydown', stop);
    return () => document.removeEventListener('keydown', stop);
  }, []);
}

/**
 * The shell's sidebar state: the shadcn provider, with the desktop icon mode kept in the shared sidebar preference
 * (`use-sidebar-preference.ts`) so every layout on this origin opens it the same way. It has no keyboard shortcut.
 */
export function AppSidebarProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [collapsed, setCollapsed] = useSidebarPreference();
  useNoSidebarShortcut();
  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      // The shell never scrolls itself: main scrolls inside it, so nothing a page renders can shift the shell.
      className='h-svh overflow-hidden bg-background'
      // shadcn's 16rem and 3rem, in spacing units: a density preset that changes the unit scales the sidebar together
      // with the items inside it (the provider's documented way to set the widths).
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--sidebar-width-icon': 'calc(var(--spacing) * 12)',
        } as CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  );
}

/**
 * The sidebar itself: the brand, the given navigation, an optional footer, and the rail that collapses it. On a phone
 * it is a sheet of its own, the provider's mobile state, titled with the translated navigation label (the shadcn
 * component's own sheet is titled "Sidebar").
 */
export function AppSidebar({
  children,
  footer,
}: {
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();
  const header = (
    <SidebarHeader className='h-16 shrink-0 flex-row items-center justify-between border-b border-sidebar-border/70 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
      <AppBrand compact={state === 'collapsed' && !isMobile} />
      {isMobile ? (
        <Button
          aria-label={t('navigation.close', {
            defaultValue: 'Close navigation',
          })}
          className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          onClick={() => setOpenMobile(false)}
          size='icon'
          variant='ghost'
        >
          <X />
        </Button>
      ) : null}
    </SidebarHeader>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar='sidebar'
          data-slot='sidebar'
          data-mobile='true'
          className='w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground'
          // shadcn's 18rem, in spacing units like the provider's widths.
          style={
            { '--sidebar-width': 'calc(var(--spacing) * 72)' } as CSSProperties
          }
          side='left'
          showCloseButton={false}
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>
              {t('navigation.label', {
                defaultValue: 'Application navigation',
              })}
            </SheetTitle>
          </SheetHeader>
          <div className='flex h-full w-full flex-col'>
            {header}
            <SidebarContent>{children}</SidebarContent>
            {footer}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sidebar collapsible='icon'>
      {header}
      <SidebarContent>{children}</SidebarContent>
      {footer}
      <SidebarRail />
    </Sidebar>
  );
}

/** The header's sidebar button: opens the sheet on a phone, and switches the icon mode on a desktop. */
export function AppSidebarToggle(): ReactElement {
  const { t } = useTranslation();
  const { isMobile, state, toggleSidebar } = useSidebar();
  const collapsed = state === 'collapsed';
  const label = isMobile
    ? t('navigation.open', { defaultValue: 'Open navigation' })
    : collapsed
      ? t('navigation.expand', { defaultValue: 'Expand navigation' })
      : t('navigation.collapse', { defaultValue: 'Collapse navigation' });
  return (
    <Button
      aria-label={label}
      aria-pressed={isMobile ? undefined : collapsed}
      className='size-9 rounded-xl text-muted-foreground hover:text-foreground'
      onClick={toggleSidebar}
      size='icon'
      variant='ghost'
    >
      <PanelLeft />
    </Button>
  );
}

/**
 * The application's sidebar footer: the application's name and, beneath it, its version. In icon mode only the icon
 * remains, and its tooltip carries the name and version.
 */
export function AppSidebarFooter(): ReactElement {
  const { isMobile, state } = useSidebar();
  // Published by the server from the application's package.json.
  const publicConfig = useClientApplication().config.public;
  const appName = publicConfig.get('app.displayName', 'Default Template');
  const appVersion = `v${publicConfig.get('app.version', '0.0.0')}`;
  const icon = (
    <ShieldCheck
      aria-hidden='true'
      className='size-4 shrink-0 text-sidebar-foreground/70'
    />
  );

  return (
    <SidebarFooter className='min-h-16 shrink-0 flex-row items-center gap-3 border-t border-sidebar-border/70 px-5 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2'>
      {state === 'collapsed' && !isMobile ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span
                aria-label={`${appName} ${appVersion}`}
                className='grid size-8 place-items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring'
                tabIndex={0}
              />
            }
          >
            {icon}
          </TooltipTrigger>
          <TooltipContent side='right'>
            {appName} {appVersion}
          </TooltipContent>
        </Tooltip>
      ) : (
        icon
      )}
      <div className='min-w-0 leading-tight group-data-[collapsible=icon]:hidden'>
        <div className='truncate text-sm font-medium text-sidebar-foreground'>
          {appName}
        </div>
        <div className='mt-0.5 text-xs whitespace-nowrap text-sidebar-foreground/70'>
          {appVersion}
        </div>
      </div>
    </SidebarFooter>
  );
}
