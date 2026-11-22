import { cn } from 'cn';
import { ChevronRightIcon, TriangleAlertIcon } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { useAuthenticationTranslation } from './i18n.js';
import { Badge } from '../components/ui/badge.js';
import type { ConfigOrigin } from '../settings/data.js';

/** The frame of a settings page: padding, spacing and the heading. */
export function SettingsPage({
  title,
  description,
  eyebrow,
  actions,
  children,
}: {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly eyebrow?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className='w-full space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8'>
      <header className='flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-48 flex-1'>
          {eyebrow ? (
            <div className='mb-1 text-xs font-medium text-muted-foreground'>
              {eyebrow}
            </div>
          ) : null}
          <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em] break-words'>
            {title}
          </h1>
          {description ? (
            <p className='mt-1 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-2'>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className='flex flex-wrap items-center gap-2'>{actions}</div>
        ) : null}
      </header>
      {children}
    </section>
  );
}

/** A bordered block with an optional title row. */
export function Panel({
  title,
  meta,
  actions,
  children,
  className,
}: {
  readonly title?: ReactNode;
  readonly meta?: ReactNode;
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-card text-card-foreground',
        className,
      )}
    >
      {title || actions ? (
        <div className='flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-3'>
          <h2 className='text-sm font-semibold'>{title}</h2>
          {meta ? (
            <span className='text-xs text-muted-foreground'>{meta}</span>
          ) : null}
          {actions ? (
            <div className='ml-auto flex flex-wrap items-center gap-2'>
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

const SOURCE_STYLES: Record<ConfigOrigin['source'], string> = {
  env: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  file: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  code: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  default: 'border-border text-muted-foreground',
};

/** Where a value comes from: an environment variable (named), `config.yml`, code or a default. */
export function SourceBadge({
  origin,
}: {
  readonly origin: ConfigOrigin;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  return (
    <span className='inline-flex flex-wrap items-center gap-1'>
      <Badge
        variant='outline'
        className={cn('border-transparent', SOURCE_STYLES[origin.source])}
      >
        {t(`settings.source.${origin.source}`)}
      </Badge>
      {origin.env ? (
        <code className='text-xs text-muted-foreground'>{origin.env}</code>
      ) : null}
    </span>
  );
}

/** A green "on" or a muted "not configured" status. */
export function StatusBadge({
  on,
  children,
  tone = 'muted',
}: {
  readonly on: boolean;
  readonly children: ReactNode;
  readonly tone?: 'muted' | 'warning';
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
        on
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
          : tone === 'warning'
            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
            : 'bg-muted text-muted-foreground',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          on
            ? 'bg-emerald-600'
            : tone === 'warning'
              ? 'bg-amber-600'
              : 'border border-current',
        )}
      />
      {children}
    </span>
  );
}

/** A configuration snippet that shows how to change a group of settings; the page itself saves nothing. */
export function HowToChange({
  snippet,
  note,
}: {
  readonly snippet: string;
  readonly note?: ReactNode;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className='border-t px-4 py-3'>
      <button
        type='button'
        className='inline-flex items-center gap-1 text-sm text-primary hover:underline'
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronRightIcon
          className={cn('size-4 transition-transform', open && 'rotate-90')}
        />
        {t('settings.howToChange')}
      </button>
      {open ? (
        <div className='mt-2 space-y-2'>
          <pre className='overflow-x-auto rounded-lg bg-muted px-3 py-2 text-xs leading-5'>
            {snippet}
          </pre>
          <p className='text-xs text-muted-foreground'>
            {note ?? t('settings.howToChangeNote')}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** A label, its effective value and the value's origin; stacks on a phone. */
export function SettingRow({
  label,
  hint,
  value,
  origin,
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly value: ReactNode;
  readonly origin?: ConfigOrigin;
}): ReactElement {
  return (
    <div className='grid gap-1 border-t px-4 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_10rem] sm:items-center sm:gap-4'>
      <div className='min-w-0'>
        <div className='text-sm font-medium'>{label}</div>
        {hint ? (
          <div className='text-xs text-muted-foreground'>{hint}</div>
        ) : null}
      </div>
      <div className='min-w-0 text-sm break-words'>{value}</div>
      <div>{origin ? <SourceBadge origin={origin} /> : null}</div>
    </div>
  );
}

/** The column headings above `SettingRow`s, hidden on a phone where rows stack. */
export function SettingHeader({
  title,
}: {
  readonly title: ReactNode;
}): ReactElement {
  const { t } = useAuthenticationTranslation();
  return (
    <div className='grid gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_10rem]'>
      <div>{title}</div>
      <div className='hidden sm:block'>{t('settings.columns.value')}</div>
      <div className='hidden sm:block'>{t('settings.columns.source')}</div>
    </div>
  );
}

/** A step of a guide: its label beside its content, stacked on narrow screens. */
export function GuideStep({
  label,
  children,
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className='grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4'>
      <div className='pt-1.5 text-sm font-semibold'>{label}</div>
      <div className='min-w-0'>{children}</div>
    </div>
  );
}

/** The warning a guide shows while `app.publicOrigin` is not set. */
export function PublicOriginWarning({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <p className='mt-2 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200'>
      <TriangleAlertIcon className='mt-0.5 size-3.5 shrink-0' aria-hidden />
      {children}
    </p>
  );
}
