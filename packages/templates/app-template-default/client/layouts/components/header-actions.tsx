import {
  badgeCount,
  useHeaderActions,
  type AppClientBadge,
  type AppClientBadgeHook,
  type AppClientRegisteredHeaderAction,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Ellipsis } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from 'cn';

import { Button } from '#components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#components/ui/popover';
import { TooltipProvider } from '#components/ui/tooltip';
import { useIsMobile } from '#hooks/use-mobile';

import { UserMenu } from './user-menu.js';

/**
 * How many registered actions a phone's header shows beside the account menu. With more, the first stays and the rest
 * move into a More popover, so the header keeps one line at 390px.
 */
const PHONE_INLINE_ACTIONS = 2;

/**
 * The header's right-hand actions, shared by every authenticated page: the buttons the application and its plugins
 * register (`headerActions`), in their order, then the account menu, always last.
 */
export function HeaderActions(): ReactElement {
  return (
    <HeaderActionBar actions={useHeaderActions()}>
      <UserMenu />
    </HeaderActionBar>
  );
}

/** The registered actions, each with its badge, and `children` after them. */
export function HeaderActionBar({
  actions,
  children,
}: {
  readonly actions: readonly AppClientRegisteredHeaderAction[];
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  // Each action's badge hook runs once, in an always-mounted probe, so an action in the closed More popover still
  // counts and its hook is never called twice.
  const [badges, setBadges] = useState<
    Readonly<Record<string, AppClientBadge | undefined>>
  >({});
  const report = useCallback(
    (name: string, badge: AppClientBadge | undefined) =>
      setBadges((current) =>
        sameBadge(current[name], badge)
          ? current
          : { ...current, [name]: badge },
      ),
    [],
  );
  const inline =
    isMobile && actions.length > PHONE_INLINE_ACTIONS
      ? actions.slice(0, PHONE_INLINE_ACTIONS - 1)
      : actions;
  const overflow = actions.slice(inline.length);
  const overflowCount = overflow.reduce(
    (sum, action) => sum + badgeCount(badges[action.name]),
    0,
  );
  const overflowAttention = overflow.some(
    (action) =>
      badgeCount(badges[action.name]) > 0 &&
      badges[action.name]?.tone === 'attention',
  );
  return (
    <TooltipProvider>
      <div
        className='flex shrink-0 items-center gap-2'
        data-testid='header-actions'
      >
        {actions.map((action) =>
          action.badge ? (
            <BadgeProbe
              key={action.name}
              name={action.name}
              useBadge={action.badge}
              report={report}
            />
          ) : null,
        )}
        {inline.map((action) => (
          <HeaderActionSlot
            key={action.name}
            action={action}
            badge={badges[action.name]}
          />
        ))}
        {overflow.length ? (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant='outline'
                  size='icon'
                  className='relative size-10 rounded-xl border-border bg-background/60 text-foreground dark:border-border'
                  aria-label={t('navigation.moreActions')}
                  data-testid='header-actions-more'
                />
              }
            >
              <Ellipsis />
              {overflowCount > 0 ? (
                <CornerBadge
                  count={overflowCount}
                  attention={overflowAttention}
                />
              ) : null}
            </PopoverTrigger>
            <PopoverContent
              align='end'
              className='w-auto flex-row flex-wrap items-center gap-2 p-2'
              aria-label={t('navigation.moreActions')}
            >
              {overflow.map((action) => (
                <HeaderActionSlot
                  key={action.name}
                  action={action}
                  badge={badges[action.name]}
                />
              ))}
            </PopoverContent>
          </Popover>
        ) : null}
        {children}
      </div>
    </TooltipProvider>
  );
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

function HeaderActionSlot({
  action,
  badge,
}: {
  readonly action: AppClientRegisteredHeaderAction;
  readonly badge: AppClientBadge | undefined;
}): ReactElement {
  const Component = action.component;
  const count = badgeCount(badge);
  // An action that renders nothing, such as a feature this viewer cannot use, takes no room.
  return (
    <div
      className='relative flex shrink-0 empty:hidden'
      data-header-action={action.name}
    >
      <Component />
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
