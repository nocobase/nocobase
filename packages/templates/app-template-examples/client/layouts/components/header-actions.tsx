import {
  badgeCount,
  useHeaderActions,
  type AppClientBadge,
  type AppClientBadgeHook,
  type AppClientRegisteredHeaderAction,
} from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Ellipsis } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type ReactPortal,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from 'cn';

import { Button } from '#components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { TooltipProvider } from '#components/ui/tooltip';
import { useIsMobile } from '#hooks/use-mobile';

import { useRouteAccess, useRouteTree } from '../../routing/route-context.js';
import { routeKey } from '../../routing/route-navigation.js';
import { UserMenu } from './user-menu.js';

/**
 * How many shown actions a phone's header holds beside the account menu. With more, the first stays and the rest move
 * into a More popover, so the header keeps one line at 390px.
 */
const PHONE_INLINE_ACTIONS = 2;

/**
 * The header's right-hand actions: the buttons the application and its plugins register (`headerActions`) that the
 * viewer may see, in their order, then the account menu, always last.
 */
export function HeaderActions(): ReactElement {
  const { session } = useAuthentication();
  const actions = useHeaderActions({ signedIn: Boolean(session?.user) });
  const routes = useRouteTree();
  const { denied, loading } = useRouteAccess();
  const visible = useMemo(() => {
    const allowedPages = new Set<string>();
    const visit = (route: AppClientRegisteredRoute): void => {
      if (denied.has(routeKey(route))) return;
      if (route.componentLoader) allowedPages.add(route.id);
      route.children?.forEach(visit);
    };
    if (!loading) routes.forEach(visit);
    return actions.filter(
      ({ routeId }) => routeId === undefined || allowedPages.has(routeId),
    );
  }, [actions, denied, loading, routes]);
  return (
    <HeaderActionBar actions={visible}>
      <UserMenu />
    </HeaderActionBar>
  );
}

/**
 * The actions, each with its badge, and `children` after them. An action that renders nothing, such as a feature this
 * viewer cannot use, takes no place: the phone's More popover holds only actions that render something, and a badge
 * shows only on a shown action.
 */
export function HeaderActionBar({
  actions,
  children,
}: {
  readonly actions: readonly AppClientRegisteredHeaderAction[];
  readonly children?: ReactNode;
}): ReactElement {
  const isMobile = useIsMobile();
  // Each action's component and badge hook stay mounted once, whether the action sits in the bar, in the More popover
  // or nowhere: the component renders into an element of its own, which moves between those places as plain DOM, so
  // moving it never remounts the component or calls its hooks twice.
  const [hosts] = useState(() => new Map<string, HTMLElement>());
  const hostOf = (name: string): HTMLElement => {
    let host = hosts.get(name);
    if (!host) {
      host = document.createElement('div');
      host.style.display = 'contents';
      hosts.set(name, host);
    }
    return host;
  };
  const [rendered, setRendered] = useState<Readonly<Record<string, boolean>>>(
    {},
  );
  const [badges, setBadges] = useState<Badges>({});
  const reportRendered = useCallback(
    (name: string, value: boolean) =>
      setRendered((current) =>
        current[name] === value ? current : { ...current, [name]: value },
      ),
    [],
  );
  const reportBadge = useCallback(
    (name: string, badge: AppClientBadge | undefined) =>
      setBadges((current) =>
        sameBadge(current[name], badge)
          ? current
          : { ...current, [name]: badge },
      ),
    [],
  );
  // An action that held focus when it moved into the closed More popover hands focus to More, so keyboard focus is not
  // dropped on the page.
  const moreRef = useRef<HTMLButtonElement>(null);
  const focusLostRef = useRef(false);
  const onFocusedDetach = useCallback(() => {
    focusLostRef.current = true;
  }, []);
  useLayoutEffect(() => {
    if (!focusLostRef.current) return;
    focusLostRef.current = false;
    moreRef.current?.focus();
  });
  const shown = actions.filter((action) => rendered[action.name]);
  const inlineCount =
    isMobile && shown.length > PHONE_INLINE_ACTIONS
      ? PHONE_INLINE_ACTIONS - 1
      : shown.length;
  const inline = shown.slice(0, inlineCount);
  const overflow = shown.slice(inlineCount);
  return (
    <TooltipProvider>
      <div
        className='flex shrink-0 items-center gap-2'
        data-testid='header-actions'
      >
        {actions.map((action) => (
          <ActionHost
            key={action.name}
            action={action}
            host={hostOf(action.name)}
            report={reportRendered}
          />
        ))}
        {actions.map((action) =>
          action.badge ? (
            <BadgeProbe
              key={action.name}
              name={action.name}
              useBadge={action.badge}
              report={reportBadge}
            />
          ) : null,
        )}
        {inline.map((action) => (
          <HeaderActionSlot
            key={action.name}
            name={action.name}
            host={hostOf(action.name)}
            badge={badges[action.name]}
            onFocusedDetach={onFocusedDetach}
          />
        ))}
        {overflow.length ? (
          <MoreActions
            actions={overflow}
            hostOf={hostOf}
            badges={badges}
            triggerRef={moreRef}
          />
        ) : null}
        {children}
      </div>
    </TooltipProvider>
  );
}

type Badges = Readonly<Record<string, AppClientBadge | undefined>>;

/** The phone's More popover, its button carrying the sum of the badges inside. */
function MoreActions({
  actions,
  hostOf,
  badges,
  triggerRef,
}: {
  readonly actions: readonly AppClientRegisteredHeaderAction[];
  readonly hostOf: (name: string) => HTMLElement;
  readonly badges: Badges;
  readonly triggerRef: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  const { t } = useTranslation();
  const count = actions.reduce(
    (sum, action) => sum + badgeCount(badges[action.name]),
    0,
  );
  const attention = actions.some(
    (action) =>
      badgeCount(badges[action.name]) > 0 &&
      badges[action.name]?.tone === 'attention',
  );
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            ref={triggerRef}
            variant='outline'
            size='icon'
            className='relative size-10 rounded-xl border-border bg-background/60 text-foreground dark:border-border'
            aria-label={t('navigation.moreActions')}
            data-testid='header-actions-more'
          />
        }
      >
        <Ellipsis />
        {count > 0 ? <CornerBadge count={count} attention={attention} /> : null}
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-auto flex-row flex-wrap items-center gap-2 p-2'
        aria-label={t('navigation.moreActions')}
      >
        {actions.map((action) => (
          <HeaderActionSlot
            key={action.name}
            name={action.name}
            host={hostOf(action.name)}
            badge={badges[action.name]}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Renders one action's component into its own element and tells the bar whether it rendered anything. */
function ActionHost({
  action,
  host,
  report,
}: {
  readonly action: AppClientRegisteredHeaderAction;
  readonly host: HTMLElement;
  readonly report: (name: string, rendered: boolean) => void;
}): ReactPortal {
  const { name, component: Component } = action;
  useLayoutEffect(() => {
    const update = () => report(name, host.hasChildNodes());
    update();
    const observer = new MutationObserver(update);
    observer.observe(host, { childList: true });
    return () => {
      observer.disconnect();
      report(name, false);
    };
  }, [name, host, report]);
  return createPortal(<Component />, host);
}

/** Calls one action's badge hook and hands its result to the bar. */
function BadgeProbe({
  name,
  useBadge,
  report,
}: {
  readonly name: string;
  readonly useBadge: AppClientBadgeHook;
  readonly report: (name: string, badge: AppClientBadge | undefined) => void;
}): null {
  const badge = useBadge();
  const count = badgeCount(badge);
  const tone = badge?.tone;
  useEffect(() => {
    report(name, count > 0 ? { count, ...(tone ? { tone } : {}) } : undefined);
  }, [name, count, tone, report]);
  useEffect(() => () => report(name, undefined), [name, report]);
  return null;
}

/** Where a shown action sits, in the bar or in More: its rendered element moved in, and its badge on the corner. */
function HeaderActionSlot({
  name,
  host,
  badge,
  onFocusedDetach,
}: {
  readonly name: string;
  readonly host: HTMLElement;
  readonly badge: AppClientBadge | undefined;
  /** Called when the slot goes away while its action holds focus. */
  readonly onFocusedDetach?: () => void;
}): ReactElement {
  const anchorRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const target = anchorRef.current;
    if (!target) return;
    target.append(host);
    return () => {
      if (host.parentNode !== target) return;
      if (host.contains(document.activeElement)) onFocusedDetach?.();
      target.removeChild(host);
    };
  }, [host, onFocusedDetach]);
  const count = badgeCount(badge);
  return (
    <div className='relative flex shrink-0' data-header-action={name}>
      <div ref={anchorRef} className='contents' />
      {count > 0 ? (
        <CornerBadge count={count} attention={badge?.tone === 'attention'} />
      ) : null}
    </div>
  );
}

/**
 * A count on a button's top-right corner, ringed in the background so it stays apart from the border. The action's own
 * accessible name carries what the count means, so this is hidden from screen readers.
 */
function CornerBadge({
  count,
  attention,
}: {
  readonly count: number;
  readonly attention: boolean;
}): ReactElement {
  return (
    <span
      aria-hidden
      data-slot='header-action-badge'
      data-tone={attention ? 'attention' : 'default'}
      className={cn(
        'pointer-events-none absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[0.6875rem] leading-none font-medium tabular-nums ring-2 ring-background',
        attention
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted-foreground text-background',
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function sameBadge(
  left: AppClientBadge | undefined,
  right: AppClientBadge | undefined,
): boolean {
  return left?.count === right?.count && left?.tone === right?.tone;
}
