import { useTranslation } from '@nocobase/i18n/client';
import { PanelLeft, X } from 'lucide-react';
import {
  useEffect,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

import { Button } from '#components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#components/ui/sheet';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarRail,
  useSidebar,
} from '#components/ui/sidebar';
import { TooltipProvider } from '#components/ui/tooltip';

import { useSidebarPreference } from '../use-sidebar-preference.js';
import { AppBrand } from './app-brand.js';

// The layouts compose shadcn's Sidebar without editing `components/ui/sidebar.tsx`, so the primitive stays as the
// shadcn CLI writes it and can be updated from the registry. Everything the template needs differently is done here.

/**
 * The shell's sidebar state: shadcn's provider, with the desktop icon mode kept in the shared sidebar preference
 * (`use-sidebar-preference.ts`) so every layout on this origin opens it the same way. Whether the phone's sheet is
 * open stays local to the layout.
 */
export function AppSidebarProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const [collapsed, setCollapsed] = useSidebarPreference();
  useSuppressSidebarShortcut();
  return (
    <SidebarProvider
      open={!collapsed}
      onOpenChange={(open) => setCollapsed(!open)}
      className='h-svh bg-background'
      // shadcn's 16rem and 3rem, in spacing units: a density preset that changes the unit scales the sidebar together
      // with the items inside it (the provider's documented way to set the widths).
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
          '--sidebar-width-icon': 'calc(var(--spacing) * 12)',
        } as CSSProperties
      }
    >
      {/* Icon-mode labels appear as soon as the pointer reaches an entry, like the header's hints. */}
      <TooltipProvider delay={0}>{children}</TooltipProvider>
    </SidebarProvider>
  );
}

/**
 * shadcn's provider toggles the sidebar on Ctrl/Cmd+B from a `window` keydown listener. The template has no such
 * shortcut (it is bold in every rich-text editor), so a `document` listener in the bubble phase stops the event
 * before it reaches `window`. Whatever is focused, an editor included, still receives the key first.
 */
function useSuppressSidebarShortcut(): void {
  useEffect(() => {
    const stop = (event: KeyboardEvent) => {
      if (event.key === 'b' && (event.metaKey || event.ctrlKey))
        event.stopPropagation();
    };
    document.addEventListener('keydown', stop);
    return () => document.removeEventListener('keydown', stop);
  }, []);
}

/**
 * The sidebar: the brand, the given navigation and an optional footer. On a desktop it is shadcn's `Sidebar` in icon
 * mode; on a phone it is a Sheet rendered here with the same slots, because the primitive's own mobile sheet carries
 * an untranslated title.
 */
export function AppSidebar({
  children,
  footer,
  label,
}: {
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  /** The accessible name of the sidebar, and the title of the phone's sheet. */
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation();
  const { isMobile, openMobile, setOpenMobile, state } = useSidebar();
  // A sheet left open on a phone must not reappear when the window narrows again after widening.
  useEffect(() => {
    if (!isMobile && openMobile) setOpenMobile(false);
  }, [isMobile, openMobile, setOpenMobile]);

  const header = (
    <SidebarHeader className='h-16 shrink-0 flex-row items-center justify-between border-b border-sidebar-border/70 px-5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
      <AppBrand compact={state === 'collapsed' && !isMobile} />
      {isMobile ? (
        <Button
          aria-label={t('navigation.close', {
            defaultValue: 'Close navigation',
          })}
          className='hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:border-sidebar-ring focus-visible:ring-sidebar-ring dark:hover:bg-sidebar-accent'
          onClick={() => setOpenMobile(false)}
          size='icon'
          variant='ghost'
        >
          <X />
        </Button>
      ) : null}
    </SidebarHeader>
  );
  const content = (
    <>
      {header}
      {/* The primitive hides the icon mode's overflow; a long menu still scrolls there. */}
      <SidebarContent className='group-data-[collapsible=icon]:overflow-y-auto'>
        {children}
      </SidebarContent>
      {footer}
    </>
  );

  const railLabel = t('navigation.toggle', {
    defaultValue: 'Expand or collapse navigation',
  });

  if (isMobile)
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        {/* The attributes and classes of the primitive's own mobile branch, so `sidebar-*` styles apply alike. */}
        <SheetContent
          data-sidebar='sidebar'
          data-slot='sidebar'
          data-mobile='true'
          className='w-(--sidebar-width) gap-0 bg-sidebar p-0 text-sidebar-foreground'
          showCloseButton={false}
          side='left'
          style={
            { '--sidebar-width': 'calc(var(--spacing) * 72)' } as CSSProperties
          }
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>{label}</SheetTitle>
            <SheetDescription>
              {t('navigation.description', {
                defaultValue: 'Go to a page of this application.',
              })}
            </SheetDescription>
          </SheetHeader>
          <div className='flex h-full w-full flex-col'>{content}</div>
        </SheetContent>
      </Sheet>
    );

  return (
    <Sidebar collapsible='icon' role='complementary' aria-label={label}>
      {content}
      {/* The primitive's edge handle; its built-in label is untranslated, and the props given here replace it. */}
      <SidebarRail aria-label={railLabel} title={railLabel} />
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
