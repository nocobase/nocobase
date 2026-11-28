import { copyText } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { CircleAlert, Info, Search } from 'lucide-react';
import { useMemo, useRef, useState, type ReactElement } from 'react';

import { FOUNDATION_PACKAGE } from '../../shared/access.js';
import { usePlugins } from '../api.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import { Input } from '../components/ui/input.js';
import {
  dependentsOf,
  matchesSearch,
  pluginRows,
  registerCommand,
  registrationOrder,
  titleOf,
  type PluginAttention,
  type PluginRow,
  type PluginStatus,
} from '../model.js';

type Filter = 'all' | 'enabled' | 'disabled' | 'attention';
type Translate = (key: string, options?: Record<string, unknown>) => string;

function useFoundationTranslation(): { t: Translate; locale: string } {
  const { t, i18n } = useTranslation(FOUNDATION_PACKAGE);
  return { t, locale: i18n.language };
}

const GRID =
  'grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_9rem_13rem_8rem] sm:items-center';

/**
 * System settings › System › Plugins: which plugins the application uses, in two groups, with the commands that
 * enable, update or disable each one. The page changes nothing itself: enabling a plugin changes the application's
 * code and takes effect after a restart.
 */
export default function PluginsPage(): ReactElement {
  const { t, locale } = useFoundationTranslation();
  const query = usePlugins();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<{
    readonly kind: 'commands' | 'enable';
    readonly row: PluginRow;
  }>();

  const rows = useMemo(
    () => (query.data ? pluginRows(query.data.data, locale) : []),
    [query.data, locale],
  );
  const counts = {
    all: rows.length,
    enabled: rows.filter((row) => row.enabled).length,
    disabled: rows.filter((row) => !row.enabled).length,
    attention: rows.filter((row) => row.attention.length > 0).length,
  };
  const visible = rows.filter(
    (row) =>
      matchesSearch(row, search) &&
      (filter === 'all' ||
        (filter === 'enabled' && row.enabled) ||
        (filter === 'disabled' && !row.enabled) ||
        (filter === 'attention' && row.attention.length > 0)),
  );
  const groups = [
    { key: 'enabled', rows: visible.filter((row) => row.enabled) },
    { key: 'disabled', rows: visible.filter((row) => !row.enabled) },
  ].filter((group) => group.rows.length > 0);
  const filters: Filter[] =
    counts.attention > 0
      ? ['all', 'enabled', 'disabled', 'attention']
      : ['all', 'enabled', 'disabled'];

  return (
    <section className='w-full space-y-4 p-4 sm:space-y-6 sm:p-6 md:p-8'>
      <header>
        <h1 className='font-heading text-2xl font-semibold tracking-[-0.035em]'>
          {t('page.title')}
        </h1>
        <p className='mt-1 max-w-3xl text-sm leading-6 text-muted-foreground sm:mt-2'>
          {t('page.description')}
        </p>
      </header>

      {query.data?.meta.deployed ? (
        <Notice tone='info'>{t('page.deployed')}</Notice>
      ) : null}
      {counts.attention > 0 ? (
        <Notice tone='warning'>
          {t('page.attention', { count: counts.attention })}
        </Notice>
      ) : null}

      {query.isError ? (
        <div role='alert' className='flex items-center gap-3 text-sm'>
          <span className='text-destructive'>{t('page.loadFailed')}</span>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void query.refetch()}
          >
            {t('page.retry')}
          </Button>
        </div>
      ) : query.isPending ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('page.loading')}
        </p>
      ) : (
        <>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <div
              role='group'
              aria-label={t('filters.label')}
              className='flex flex-wrap gap-2'
            >
              {filters.map((key) => (
                <Button
                  key={key}
                  size='sm'
                  variant={filter === key ? 'secondary' : 'outline'}
                  aria-pressed={filter === key}
                  className='rounded-full'
                  onClick={() => setFilter(key)}
                >
                  {t(`filters.${key}`, { count: counts[key] })}
                </Button>
              ))}
            </div>
            <div className='relative sm:ml-auto sm:w-64'>
              <Search className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='search'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('page.search')}
                aria-label={t('page.search')}
                className='pl-8'
              />
            </div>
          </div>

          <div className='overflow-hidden rounded-xl border bg-card text-sm'>
            <div
              aria-hidden
              className={cn(
                GRID,
                'hidden border-b px-4 py-2 text-xs font-medium text-muted-foreground sm:grid',
              )}
            >
              <span>{t('columns.plugin')}</span>
              <span>{t('columns.version')}</span>
              <span>{t('columns.status')}</span>
              <span className='sr-only'>{t('columns.actions')}</span>
            </div>
            {groups.length === 0 ? (
              <p className='px-4 py-6 text-muted-foreground'>
                {t('page.empty')}
              </p>
            ) : (
              groups.map((group) => (
                <section
                  key={group.key}
                  aria-label={t(`groups.${group.key}`, {
                    count: group.rows.length,
                  })}
                >
                  <h2 className='border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground'>
                    {t(`groups.${group.key}`, { count: group.rows.length })}
                  </h2>
                  <ul className='divide-y'>
                    {group.rows.map((row) => (
                      <PluginListItem
                        key={row.plugin.packageName}
                        row={row}
                        rows={rows}
                        onOpen={(kind) => setOpen({ kind, row })}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </>
      )}

      <CommandDialog
        open={open}
        rows={rows}
        onClose={() => setOpen(undefined)}
      />
    </section>
  );
}

function Notice({
  tone,
  children,
}: {
  readonly tone: 'info' | 'warning';
  readonly children: string;
}): ReactElement {
  const Icon = tone === 'warning' ? CircleAlert : Info;
  return (
    <p
      role='status'
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
        tone === 'warning'
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
          : 'bg-muted/50 text-muted-foreground',
      )}
    >
      <Icon className='mt-0.5 size-4 shrink-0' />
      <span>{children}</span>
    </p>
  );
}

const STATUS_STYLES: Record<PluginStatus, string> = {
  enabled:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent',
  skillsOnly:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-transparent',
  enabledAttention:
    'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-transparent',
  disabledAttention:
    'bg-amber-500/15 text-amber-800 dark:text-amber-200 border-transparent',
  disabled: 'bg-muted text-muted-foreground border-transparent',
  unknown: 'bg-muted text-muted-foreground border-transparent',
};

function attentionText(
  t: Translate,
  row: PluginRow,
  attention: PluginAttention,
  rows: readonly PluginRow[],
): string {
  if (attention.kind === 'missingRequires')
    return t('reasons.missingRequires', {
      title: row.title,
      names: attention.packages.map((name) => titleOf(name, rows)).join(', '),
    });
  return t(`reasons.${attention.kind}`);
}

function PluginListItem({
  row,
  rows,
  onOpen,
}: {
  readonly row: PluginRow;
  readonly rows: readonly PluginRow[];
  readonly onOpen: (kind: 'commands' | 'enable') => void;
}): ReactElement {
  const { t } = useFoundationTranslation();
  // Whether it is enabled cannot be told, so there is no command to give: enabling it may already be done.
  const unknown = row.status === 'unknown';
  const missing = row.enabled || unknown ? [] : row.plugin.missingRequires;
  return (
    <li className={cn(GRID, 'px-4 py-3')} data-package={row.plugin.packageName}>
      <div className='min-w-0'>
        <div className='font-medium break-words'>{row.title}</div>
        {row.description ? (
          <div className='text-xs text-muted-foreground'>{row.description}</div>
        ) : null}
      </div>
      <span className='hidden font-mono text-xs text-muted-foreground tabular-nums sm:block'>
        {row.plugin.version ?? '—'}
      </span>
      <span className='justify-self-end sm:justify-self-start'>
        <Badge variant='outline' className={STATUS_STYLES[row.status]}>
          {t(`status.${row.status}`)}
        </Badge>
      </span>
      <span className='col-span-2 flex items-center gap-3 sm:col-span-1 sm:justify-self-end'>
        <span className='font-mono text-xs text-muted-foreground tabular-nums sm:hidden'>
          {row.plugin.version}
        </span>
        {unknown ? null : (
          <Button
            size='sm'
            variant='outline'
            aria-label={t(
              row.enabled ? 'actions.commandsFor' : 'actions.enableFor',
              {
                title: row.title,
              },
            )}
            onClick={() => onOpen(row.enabled ? 'commands' : 'enable')}
          >
            {t(row.enabled ? 'actions.commands' : 'actions.enable')}
          </Button>
        )}
      </span>
      {unknown ? (
        <p className='col-span-full flex items-start gap-1.5 rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground'>
          <Info className='mt-px size-3.5 shrink-0' />
          <span>{t('reasons.unknown')}</span>
        </p>
      ) : null}
      {row.attention.map((attention) => (
        <p
          key={attention.kind}
          className='col-span-full flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-xs text-amber-900 dark:text-amber-200'
        >
          <CircleAlert className='mt-px size-3.5 shrink-0' />
          <span>{attentionText(t, row, attention, rows)}</span>
        </p>
      ))}
      {missing.length > 0 ? (
        <p className='col-span-full rounded-md bg-muted px-2 py-1.5 text-xs text-muted-foreground'>
          {t('reasons.requiresFirst', {
            names: missing.map((name) => titleOf(name, rows)).join(', '),
          })}
        </p>
      ) : null}
    </li>
  );
}

function CommandDialog({
  open,
  rows,
  onClose,
}: {
  readonly open?: {
    readonly kind: 'commands' | 'enable';
    readonly row: PluginRow;
  };
  readonly rows: readonly PluginRow[];
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useFoundationTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<'copied' | 'failed'>();
  const row = open?.row;

  let title = '';
  let commands: { readonly line: string; readonly note?: string }[] = [];
  let body: ReactElement | null = null;
  if (row && open.kind === 'commands') {
    const dependents = dependentsOf(row, rows);
    title = t('commands.title', { title: row.title });
    commands = [
      ...(row.attention.length > 0
        ? [
            {
              line: registerCommand(registrationOrder(row, rows)),
              note: t('commands.fix'),
            },
          ]
        : []),
      {
        line: `pnpm nocobase plugin update ${row.plugin.name}`,
        note: t('commands.update'),
      },
      {
        line: `pnpm nocobase plugin unregister ${row.plugin.name}`,
        note: t('commands.unregister'),
      },
    ];
    const names = (items: readonly PluginRow[]) =>
      items.map((item) => item.title).join(', ');
    body = (
      <>
        <p
          className={cn(
            'flex items-start gap-2 rounded-lg px-3 py-2 text-xs',
            dependents.required.length > 0
              ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200'
              : 'bg-muted text-muted-foreground',
          )}
        >
          <Info className='mt-px size-3.5 shrink-0' />
          <span>
            {dependents.required.length > 0
              ? t('commands.dependents', {
                  names: names(dependents.required),
                })
              : t('commands.noDependents')}
          </span>
        </p>
        {dependents.optional.length > 0 ? (
          <p className='flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground'>
            <Info className='mt-px size-3.5 shrink-0' />
            <span>
              {t('commands.optionalDependents', {
                names: names(dependents.optional),
              })}
            </span>
          </p>
        ) : null}
      </>
    );
  } else if (row) {
    const order = registrationOrder(row, rows);
    const required = order.filter((name) => name !== row.plugin.packageName);
    title = t('enable.title', { title: row.title });
    commands = [{ line: registerCommand(order) }];
    body = (
      <>
        {required.length > 0 ? (
          <p className='flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200'>
            <CircleAlert className='mt-px size-3.5 shrink-0' />
            <span>
              {t('enable.requires', {
                title: row.title,
                names: required.map((name) => titleOf(name, rows)).join(', '),
              })}
            </span>
          </p>
        ) : null}
        <ol className='list-decimal space-y-1 pl-5 text-xs text-muted-foreground'>
          <li>{t('enable.development')}</li>
          <li>{t('enable.live')}</li>
          <li>{t('enable.data')}</li>
        </ol>
      </>
    );
  }
  const text = commands.map(({ line }) => line).join('\n');

  return (
    <Dialog
      open={open !== undefined}
      onOpenChange={(next) => {
        if (!next) {
          setCopied(undefined);
          onClose();
        }
      }}
    >
      <DialogContent ref={contentRef} className='gap-3 sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {open?.kind === 'enable'
              ? t('enable.description')
              : t('commands.description')}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2 rounded-lg bg-muted px-3 py-2 font-mono text-xs'>
          {commands.map(({ line, note }) => (
            <div key={line}>
              <code className='block break-words whitespace-pre-wrap select-all'>
                {line}
              </code>
              {note ? (
                <div className='font-sans text-muted-foreground'>{note}</div>
              ) : null}
            </div>
          ))}
        </div>
        {body}
        {copied === 'failed' ? (
          <p role='alert' className='text-xs text-destructive'>
            {t('dialog.copyFailed')}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => {
              void copyText(text, {
                container: contentRef.current ?? undefined,
              }).then((done) => setCopied(done ? 'copied' : 'failed'));
            }}
          >
            {copied === 'copied' ? t('dialog.copied') : t('dialog.copy')}
          </Button>
          <Button
            onClick={() => {
              setCopied(undefined);
              onClose();
            }}
          >
            {t('dialog.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
