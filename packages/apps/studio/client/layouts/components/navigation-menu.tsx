import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRight } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';

import {
  routeKey,
  type RouteNavigationItem,
} from '../../routing/route-navigation.js';

interface Section {
  readonly key: string;
  readonly group: RouteNavigationItem | null;
  readonly items: readonly RouteNavigationItem[];
}

/**
 * A route tree as the sidebar's menu, drawn with the shadcn Sidebar primitives like the settings navigation.
 *
 * With `sections`, Studio changes the template on purpose: a top-level group without a page of its
 * own (Development, Agent team) is not a disclosure but a group label with its entries listed under it, and ungrouped
 * entries between two groups form an unlabelled group. Groups that have a page and nested groups are collapsible
 * sub-menus. In the desktop icon mode the labels hide, every entry carries its label as a tooltip, and an entry with
 * children opens them in a popover.
 */
export function NavigationMenu({
  items,
  label,
  sections: asSections = false,
  selectedKey,
}: {
  readonly items: readonly RouteNavigationItem[];
  readonly label: string;
  readonly sections?: boolean;
  readonly selectedKey: string | undefined;
}): ReactElement {
  const sections = asSections
    ? toSections(items)
    : [{ key: 'all', group: null, items }];
  return (
    <nav aria-label={label}>
      {sections.map((section) => (
        <SidebarGroup
          key={section.key}
          role={section.group ? 'group' : undefined}
          aria-labelledby={
            section.group ? sectionLabelId(section.key) : undefined
          }
        >
          {section.group ? (
            <SectionLabel
              id={sectionLabelId(section.key)}
              item={section.group}
            />
          ) : null}
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <NavigationItem
                  key={routeKey(item.route)}
                  item={item}
                  selectedKey={selectedKey}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}

function toSections(items: readonly RouteNavigationItem[]): Section[] {
  const sections: {
    key: string;
    group: RouteNavigationItem | null;
    items: RouteNavigationItem[];
  }[] = [];
  for (const item of items) {
    if (!item.route.componentLoader && item.children.length > 0) {
      sections.push({
        key: routeKey(item.route),
        group: item,
        items: item.children.slice(),
      });
      continue;
    }
    const last = sections.at(-1);
    if (last && last.group === null) last.items.push(item);
    else
      sections.push({
        key: `loose:${routeKey(item.route)}`,
        group: null,
        items: [item],
      });
  }
  return sections;
}

function sectionLabelId(key: string): string {
  return `studio-nav-section-${key.replace(/[^a-zA-Z0-9_-]/gu, '-')}`;
}

function SectionLabel({
  id,
  item,
}: {
  readonly id: string;
  readonly item: RouteNavigationItem;
}): ReactElement {
  const label = useItemLabel(item);
  return <SidebarGroupLabel id={id}>{label}</SidebarGroupLabel>;
}

function useItemLabel(item: RouteNavigationItem): string {
  const { t } = useTranslation(item.route.packageName);
  const title = item.route.navigation?.title ?? '';
  return t(title, { defaultValue: title });
}

/** Closes the mobile sheet once an entry is chosen; the desktop sidebar stays as it is. */
function useCloseOnNavigate(): () => void {
  const { isMobile, setOpenMobile } = useSidebar();
  return () => {
    if (isMobile) setOpenMobile(false);
  };
}

interface ItemProps {
  readonly item: RouteNavigationItem;
  readonly selectedKey: string | undefined;
  /** Rendered inside the icon mode's popover, where tooltips and the icon mode's popovers do not apply. */
  readonly inPopover?: boolean;
  readonly onNavigate?: () => void;
}

/** One top-level entry of a menu: a link, a collapsible sub-menu, or in the icon mode a popover of its children. */
function NavigationItem({
  item,
  selectedKey,
  inPopover = false,
  onNavigate,
}: ItemProps): ReactElement | null {
  const { state, isMobile } = useSidebar();
  const closeSheet = useCloseOnNavigate();
  const navigate = onNavigate ?? closeSheet;
  const label = useItemLabel(item);
  const Icon = item.route.navigation?.icon;
  const isSelected = routeKey(item.route) === selectedKey;
  const children = item.children;
  const disclosure = useDisclosure(item, selectedKey);

  if (children.length > 0 && state === 'collapsed' && !isMobile && !inPopover)
    return (
      <SidebarMenuItem>
        <NavigationPopover
          item={item}
          label={label}
          selectedKey={selectedKey}
        />
      </SidebarMenuItem>
    );

  if (children.length === 0 && !item.route.componentLoader) return null;

  const link = item.route.componentLoader ? (
    <Link
      to={item.route.path}
      onClick={navigate}
      aria-current={isSelected ? 'page' : undefined}
    />
  ) : undefined;

  if (children.length === 0)
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          render={link}
          isActive={isSelected}
          tooltip={inPopover ? undefined : label}
        >
          {Icon ? <Icon /> : null}
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

  const subMenu = (
    <CollapsibleContent>
      <SidebarMenuSub>
        {children.map((child) => (
          <NavigationSubItem
            key={routeKey(child.route)}
            item={child}
            selectedKey={selectedKey}
            onNavigate={navigate}
          />
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  );

  return (
    <Collapsible
      open={disclosure.expanded}
      onOpenChange={disclosure.setExpanded}
      render={<SidebarMenuItem />}
    >
      {link ? (
        <>
          <SidebarMenuButton
            render={link}
            isActive={isSelected}
            tooltip={inPopover ? undefined : label}
          >
            {Icon ? <Icon /> : null}
            <span>{label}</span>
          </SidebarMenuButton>
          <SidebarMenuAction
            render={<CollapsibleTrigger />}
            aria-label={label}
            className='data-panel-open:rotate-90'
          >
            <ChevronRight />
          </SidebarMenuAction>
        </>
      ) : (
        <SidebarMenuButton
          render={<CollapsibleTrigger />}
          tooltip={inPopover ? undefined : label}
        >
          {Icon ? <Icon /> : null}
          <span>{label}</span>
          <ChevronRight className='ml-auto transition-transform group-data-panel-open/menu-button:rotate-90' />
        </SidebarMenuButton>
      )}
      {subMenu}
    </Collapsible>
  );
}

/** An entry inside a sub-menu: a link, or a collapsible sub-menu of its own. */
function NavigationSubItem({
  item,
  selectedKey,
  onNavigate,
}: ItemProps): ReactElement | null {
  const label = useItemLabel(item);
  const Icon = item.route.navigation?.icon;
  const isSelected = routeKey(item.route) === selectedKey;
  const disclosure = useDisclosure(item, selectedKey);
  const children = item.children;
  if (children.length === 0 && !item.route.componentLoader) return null;

  const link = item.route.componentLoader ? (
    <Link
      to={item.route.path}
      onClick={onNavigate}
      aria-current={isSelected ? 'page' : undefined}
    />
  ) : undefined;
  const content = (
    <>
      {Icon ? <Icon /> : null}
      <span>{label}</span>
    </>
  );

  if (children.length === 0)
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton render={link} isActive={isSelected}>
          {content}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );

  return (
    <Collapsible
      open={disclosure.expanded}
      onOpenChange={disclosure.setExpanded}
      render={<SidebarMenuSubItem />}
    >
      {link ? (
        <>
          <SidebarMenuSubButton render={link} isActive={isSelected}>
            {content}
          </SidebarMenuSubButton>
          <SidebarMenuAction
            render={<CollapsibleTrigger />}
            aria-label={label}
            className='top-1 data-panel-open:rotate-90'
          >
            <ChevronRight />
          </SidebarMenuAction>
        </>
      ) : (
        <SidebarMenuSubButton render={<CollapsibleTrigger />}>
          {Icon ? <Icon /> : null}
          <span>{label}</span>
          <ChevronRight className='ml-auto transition-transform in-data-panel-open:rotate-90' />
        </SidebarMenuSubButton>
      )}
      <CollapsibleContent>
        <SidebarMenuSub>
          {children.map((child) => (
            <NavigationSubItem
              key={routeKey(child.route)}
              item={child}
              selectedKey={selectedKey}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * A disclosure that opens when the selection moves into it and otherwise keeps what the person chose, so navigating
 * elsewhere does not discard other groups' state.
 */
function useDisclosure(
  item: RouteNavigationItem,
  selectedKey: string | undefined,
): { expanded: boolean; setExpanded: (expanded: boolean) => void } {
  const selected = containsSelection(item, selectedKey);
  const [disclosure, setDisclosure] = useState({
    key: selectedKey,
    expanded: selected,
  });
  if (disclosure.key !== selectedKey)
    setDisclosure({
      key: selectedKey,
      expanded: selected || disclosure.expanded,
    });
  return {
    expanded: disclosure.expanded,
    setExpanded: (expanded) => setDisclosure({ key: selectedKey, expanded }),
  };
}

function containsSelection(
  item: RouteNavigationItem,
  id: string | undefined,
): boolean {
  return (
    routeKey(item.route) === id ||
    item.children.some((child) => containsSelection(child, id))
  );
}

/**
 * The icon mode's entry with children: the icon opens its children in a popover on hover or keyboard focus, as a
 * tooltip cannot hold links. A parent with a page of its own stays a link.
 */
function NavigationPopover({
  item,
  label,
  selectedKey,
}: {
  readonly item: RouteNavigationItem;
  readonly label: string;
  readonly selectedKey: string | undefined;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const restoringFocusRef = useRef(false);
  const Icon = item.route.navigation?.icon;
  const page = Boolean(item.route.componentLoader);
  const close = () => setOpen(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <SidebarMenuButton
        isActive={containsSelection(item, selectedKey)}
        render={
          <PopoverTrigger
            openOnHover
            delay={0}
            closeDelay={0}
            onClick={
              page
                ? (event) => {
                    event.preventBaseUIHandler();
                    close();
                  }
                : undefined
            }
            onFocus={(event) => {
              if (restoringFocusRef.current) {
                restoringFocusRef.current = false;
                return;
              }
              if (event.currentTarget.matches(':focus-visible')) setOpen(true);
            }}
            nativeButton={!page}
            role={page ? 'link' : undefined}
            render={
              page ? (
                <Link
                  to={item.route.path}
                  aria-current={
                    routeKey(item.route) === selectedKey ? 'page' : undefined
                  }
                />
              ) : (
                <button type='button' />
              )
            }
          />
        }
        aria-label={label}
      >
        {Icon ? <Icon /> : <span>{label}</span>}
      </SidebarMenuButton>
      <PopoverContent
        side='right'
        align='start'
        sideOffset={8}
        initialFocus={false}
        // Returning focus after Escape must not reopen the popup.
        finalFocus={(interaction) => {
          restoringFocusRef.current = interaction === 'keyboard';
          return interaction === 'keyboard';
        }}
        className='max-h-(--available-height) w-max min-w-40 max-w-sm gap-0.5 overflow-y-auto border border-sidebar-border bg-sidebar p-1.5 text-sidebar-foreground'
      >
        <PopoverTitle className='px-2 pt-1 pb-0.5 text-xs font-medium whitespace-nowrap text-sidebar-foreground/70'>
          {label}
        </PopoverTitle>
        <SidebarMenu>
          {item.children.map((child) => (
            <NavigationItem
              key={routeKey(child.route)}
              item={child}
              selectedKey={selectedKey}
              inPopover
              onNavigate={close}
            />
          ))}
        </SidebarMenu>
      </PopoverContent>
    </Popover>
  );
}
