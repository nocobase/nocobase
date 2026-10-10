/**
 * The dashboard's frame pieces, shared by its cards: one card header (title, a definition behind ⓘ, a description and
 * an action), a figure's change against the period before, the "View all" link, a card's empty and failed states (UI
 * guidelines T5.4, S2, S4, S6) and skeletons drawn in a tone that shows on the page and on a card alike.
 */
import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertCircleIcon,
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  InfoIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router';

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';

import { formatTrend, type Trend } from './model.js';
import { useFormatLocale } from './use-format-locale.js';

/** A skeleton bar in a tone visible on the page's background and on a card's (`bg-muted` is close to both). */
export function Bone({
  className,
}: {
  readonly className?: string;
}): ReactElement {
  return <Skeleton className={cn('bg-muted-foreground/15', className)} />;
}

/** ⓘ beside a label, showing how the figure is defined. */
export function InfoTip({
  label,
  text,
}: {
  /** What the figure is called, for the button's accessible name. */
  readonly label: string;
  readonly text: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type='button'
            aria-label={t('dashboard.definition', { name: label })}
            className='inline-flex shrink-0 rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
          />
        }
      >
        <InfoIcon className='size-3.5' aria-hidden='true' />
      </TooltipTrigger>
      <TooltipContent className='max-w-72 text-pretty'>{text}</TooltipContent>
    </Tooltip>
  );
}

/** A dashboard card: every card's header has the same shape. */
export function DashboardCard({
  title,
  info,
  description,
  action,
  className,
  children,
}: {
  readonly title: ReactNode;
  /** The definition behind ⓘ beside the title. */
  readonly info?: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader>
        <CardTitle className='flex items-center gap-1.5'>
          {title}
          {info && typeof title === 'string' ? (
            <InfoTip label={title} text={info} />
          ) : null}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/**
 * A figure's change against the period before: an arrow and a signed size, colored only by whether it is good news
 * (the accent) or bad (destructive), so the sign and the arrow say it without color (A2).
 */
export function TrendText({
  trend,
}: {
  readonly trend: Trend | null;
}): ReactElement {
  const { t } = useTranslation();
  const locale = useFormatLocale();
  if (!trend || trend.good === null)
    return (
      <span className='text-xs text-muted-foreground'>
        {trend ? t('dashboard.unchanged') : '—'}
      </span>
    );
  const Arrow = trend.change < 0 ? ArrowDownRightIcon : ArrowUpRightIcon;
  const size = formatTrend(trend, locale);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        trend.good ? 'text-primary' : 'text-destructive',
      )}
    >
      <Arrow className='size-3.5' aria-hidden='true' />
      {trend.unit === 'points' ? t('dashboard.points', { value: size }) : size}
    </span>
  );
}

/** A card's link to the full list. */
export function ViewAllLink({
  to,
  label,
}: {
  readonly to: string;
  readonly label?: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Button
      variant='ghost'
      size='sm'
      nativeButton={false}
      render={<Link to={to} />}
    >
      {label ?? t('dashboard.viewAll')}
    </Button>
  );
}

/** A card with nothing to show yet: what stands, and what to do next. */
export function CardEmpty({
  icon: Icon,
  title,
  description,
  className,
}: {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly className?: string;
}): ReactElement {
  return (
    <Empty className={cn('min-h-40 border p-6 md:p-6', className)}>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

/**
 * Data that did not load: without the right to see it, says so (no retry helps); otherwise says it failed and offers
 * "Retry".
 */
export function CardError({
  error,
  onRetry,
}: {
  readonly error: unknown;
  readonly onRetry: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const status = error instanceof ApiClientError ? error.status : null;
  if (status === 403)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('dashboard.states.noAccess')}
      </p>
    );
  return (
    <Alert variant='destructive'>
      <AlertCircleIcon />
      <AlertDescription>
        {status === 401
          ? t('dashboard.states.signedOut')
          : t('dashboard.states.failed')}
      </AlertDescription>
      {status === 401 ? null : (
        <AlertAction>
          <Button variant='outline' size='sm' onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}

/** Rows shaped like a list while it loads. */
export function ListSkeleton({
  rows = 3,
}: {
  readonly rows?: number;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('dashboard.states.loading')}
      className='flex flex-col gap-3'
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className='flex items-center gap-3'>
          <Bone className='h-3.5 w-16' />
          <Bone className='h-3.5 flex-1' />
          <Bone className='h-3.5 w-10' />
        </div>
      ))}
    </div>
  );
}
