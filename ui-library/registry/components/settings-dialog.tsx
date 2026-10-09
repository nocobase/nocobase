/**
 * A settings dialog after shadcn's sidebar-13: the categories in a grouped sidebar on the left, the open one on the
 * right. On a phone the sidebar becomes a scrolling row above the content. Purely presentational: the open state, the
 * active item and every word come from the props, and choosing an item is reported through `onSelect` (or follows the
 * link `renderItem` draws, such as a router link to the item's URL).
 */
import {
  useId,
  type ComponentPropsWithoutRef,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#components/ui/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '#components/ui/sidebar';
import { cn } from 'cn';

/** One entry of the sidebar. */
export interface SettingsDialogItem {
  /** Unique across all groups; compared with `activeId` and passed to `onSelect`. */
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ComponentType<{ readonly className?: string }>;
}

/** A titled group of entries; the title is hidden on a phone, where the entries form one row. */
export interface SettingsDialogGroup {
  readonly id: string;
  readonly label: ReactNode;
  readonly items: readonly SettingsDialogItem[];
}

export interface SettingsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  /** The dialog's title, above the sidebar. */
  readonly title: ReactNode;
  /** Read by screen readers only. */
  readonly description?: ReactNode;
  /** The accessible name of the sidebar's navigation. */
  readonly navigationLabel: string;
  readonly groups: readonly SettingsDialogGroup[];
  /** The id of the open entry, marked active and `aria-current`. */
  readonly activeId: string;
  readonly onSelect?: (id: string) => void;
  /**
   * The element an entry renders as, such as `<Link to={…} />`; it receives the button's props and content. Without
   * it an entry is a button.
   */
  readonly renderItem?: (item: SettingsDialogItem) => ReactElement;
  /** The open entry's content, on the right. */
  readonly children: ReactNode;
  readonly className?: string;
}

export function SettingsDialog({
  open,
  onOpenChange,
  title,
  description,
  navigationLabel,
  groups,
  activeId,
  onSelect,
  renderItem,
  children,
  className,
}: SettingsDialogProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[min(40rem,calc(100dvh-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[calc(100%-2rem)] md:max-w-3xl lg:max-w-4xl',
          className,
        )}
      >
        {description ? (
          <DialogDescription className='sr-only'>
            {description}
          </DialogDescription>
        ) : null}
        <SidebarProvider className='min-h-0 flex-1 flex-col md:flex-row'>
          <Sidebar
            collapsible='none'
            className='h-auto w-full shrink-0 border-b border-sidebar-border md:h-full md:w-(--sidebar-width) md:border-r md:border-b-0'
          >
            <SidebarHeader className='px-4 pt-4 pb-0 md:pb-2'>
              <DialogTitle>{title}</DialogTitle>
            </SidebarHeader>
            <SidebarContent
              role='navigation'
              aria-label={navigationLabel}
              className='flex-row overflow-x-auto md:flex-col'
            >
              {groups.map((group) => (
                <SidebarGroup
                  key={group.id}
                  className='w-auto shrink-0 md:w-full'
                >
                  <SidebarGroupLabel className='max-md:hidden'>
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className='flex-row gap-1 md:flex-col md:gap-0'>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = item.id === activeId;
                        return (
                          <SidebarMenuItem key={item.id} className='shrink-0'>
                            <SidebarMenuButton
                              render={renderItem?.(item)}
                              isActive={active}
                              aria-current={active ? 'page' : undefined}
                              onClick={() => onSelect?.(item.id)}
                              className='max-md:w-auto max-md:whitespace-nowrap'
                            >
                              {Icon ? <Icon /> : null}
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
          <div className='min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6'>
            {children}
          </div>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

export interface SettingsDialogSectionProps extends Omit<
  ComponentPropsWithoutRef<'section'>,
  'title'
> {
  /** The section's heading; without it the content draws its own. */
  readonly title?: ReactNode;
  readonly description?: ReactNode;
}

/** The open entry's content with its heading and description, labelled by the heading. */
export function SettingsDialogSection({
  title,
  description,
  className,
  children,
  ...props
}: SettingsDialogSectionProps): ReactElement {
  const headingId = useId();
  return (
    <section
      className={cn('min-w-0 space-y-4', className)}
      aria-labelledby={title ? headingId : undefined}
      {...props}
    >
      {title ? (
        <div className='space-y-1'>
          <h3 id={headingId} className='text-base font-semibold'>
            {title}
          </h3>
          {description ? (
            <p className='text-sm text-muted-foreground'>{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
