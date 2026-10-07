/**
 * Deployment variables: an App's (as its most recent build declares them, with where each value comes from) and an
 * environment's (its values and what its Apps' most recent builds declare), in one table each. A Secret's value never comes back from the server; it reads "Set" or "Not set" and can be
 * replaced or cleared. Values are set one at a time in a dialog or many at once as `.env` text
 * (`variable-dialogs.tsx`); either way each change is saved at once and reaches the App with its next deployment.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import {
  EraserIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  ServerIcon,
  VariableIcon,
} from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  AppVariableView,
  AppVariablesMeta,
  EnvironmentDeclaredVariableView,
  EnvironmentVariableView,
} from '../../shared/releases.js';
import { useNotify } from '../hooks/use-notify.js';
import { useLoad, useReleasesApi } from '../hooks/use-releases.js';
import { compactAppIds } from '../lib/app-groups.js';
import { formatDate } from '../lib/format.js';
import {
  applyVariableChanges,
  type CurrentVariable,
  type FailedChange,
  type VariableChange,
} from '../lib/variables-text.js';
import { DataTable } from './data-table.js';
import { RowActions } from './row-actions.js';
import { Section } from './section.js';
import { EmptyState, ListSkeleton, LoadError } from './states.js';
import { Tag } from './tag.js';
import { Button } from './ui/button.js';
import { DropdownMenuItem, DropdownMenuSeparator } from './ui/dropdown-menu.js';
import {
  BulkVariablesDialog,
  VariableDialog,
  type VariableDraft,
} from './variable-dialogs.js';

/** A value as the table shows it: plain text, or for a Secret only whether it is set. */
function ValueCell({
  secret,
  set,
  value,
}: {
  readonly secret: boolean;
  readonly set: boolean;
  readonly value: string | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (secret || value === null)
    return (
      <span className='text-muted-foreground'>
        {set ? t('ui.variables.set') : t('ui.variables.notSet')}
      </span>
    );
  return <span className='font-mono text-xs break-all'>{value}</span>;
}

function NameCell({
  name,
  description,
}: {
  readonly name: string;
  readonly description: string | null;
}): ReactElement {
  return (
    <div className='min-w-0'>
      <div className='font-mono text-xs font-medium'>{name}</div>
      {description ? (
        <div className='text-xs text-muted-foreground'>{description}</div>
      ) : null}
    </div>
  );
}

/** "Bulk edit" and "Add variable", for those who may change the values. */
function EditActions({
  onBulk,
  onAdd,
}: {
  readonly onBulk: () => void;
  readonly onAdd: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <>
      <Button variant='outline' size='sm' onClick={onBulk}>
        <FileTextIcon data-icon='inline-start' />
        {t('ui.variables.bulk.edit')}
      </Button>
      <Button variant='outline' size='sm' onClick={onAdd}>
        <PlusIcon data-icon='inline-start' />
        {t('ui.variables.add')}
      </Button>
    </>
  );
}

/** The table's state: failed, loading, empty or the rows. */
function VariablesContent<T>({
  loaded,
  empty,
  children,
}: {
  readonly loaded: {
    readonly data: readonly T[] | undefined;
    readonly error: unknown;
    readonly reload: () => void;
  };
  readonly empty: ReactNode;
  readonly children: (rows: readonly T[]) => ReactNode;
}): ReactNode {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (loaded.error !== undefined && !loaded.data)
    return (
      <LoadError
        title={t('ui.variables.loadFailed')}
        error={loaded.error}
        onRetry={loaded.reload}
      />
    );
  if (!loaded.data) return <ListSkeleton rows={3} />;
  if (loaded.data.length === 0) return empty;
  return children(loaded.data);
}

/** Missing first, then by name: what blocks a deployment is what the reader looks for. */
function missingFirst(items: readonly AppVariableView[]): AppVariableView[] {
  return [...items].sort(
    (a, b) =>
      Number(b.missing) - Number(a.missing) ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
}

/**
 * The variables of an App, as its most recent build declares them (the server's `meta.releaseId`), each with where
 * its value comes from: the App's own value, its environment's, `config.yml`, generated, the build's default, or
 * nothing. Values the App or its environment set that the build does not declare follow under "Undeclared", where the
 * App's own can be cleared. Before any build the App's own values are listed and can be added by hand.
 */
export function AppVariables({
  appId,
  canEdit,
  environmentTo,
  reloadKey,
  onChanged,
}: {
  readonly appId: string;
  /** Read again when it changes, such as after a deployment. */
  readonly reloadKey?: string;
  readonly canEdit: boolean;
  /** The environment's Variables tab, where a value every App there gets is set; absent for a reader who may not open it. */
  readonly environmentTo?: string;
  /** After a value changed: the App's summary says whether something is missing or changed. */
  readonly onChanged?: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<VariableDraft | null>(null);
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const variables = useLoad(
    () => api.list<AppVariableView>(`apps/${appId}/variables`),
    `variables:${appId}:${reloadKey ?? ''}`,
  );
  const meta = variables.data?.meta as AppVariablesMeta | undefined;
  const items = variables.data?.items;
  const path = (name: string): string =>
    `apps/${appId}/variables/${encodeURIComponent(name)}`;
  const refresh = (): void => {
    variables.reload();
    onChanged?.();
  };
  const save = async (
    name: string,
    value: string,
    secret: boolean,
  ): Promise<void> => {
    try {
      await api.send('PUT', path(name), {
        value,
        ...(draft?.name === null ? { secret } : {}),
      });
      notify.success(t('ui.variables.saved', { name }));
      setDraft(null);
      refresh();
    } catch (reason) {
      notify.error(reason);
    }
  };
  const clear = async (name: string): Promise<void> => {
    setBusy(name);
    try {
      await api.send('DELETE', path(name));
      notify.success(t('ui.variables.cleared', { name }));
      refresh();
    } catch (reason) {
      notify.error(reason);
    } finally {
      setBusy(null);
    }
  };
  // The App's own values are what the text edits; every other name the App knows keeps its own secrecy.
  const own: CurrentVariable[] = (items ?? [])
    .filter((item) => item.app?.set === true)
    .map((item) => ({
      name: item.name,
      secret: item.secret,
      value: item.secret ? null : (item.app?.value ?? null),
    }));
  const known = new Map((items ?? []).map((item) => [item.name, item.secret]));
  const applyBulk = async (
    changes: readonly VariableChange[],
  ): Promise<readonly FailedChange[]> => {
    const failed = await applyVariableChanges(changes, {
      put: (change) =>
        api.send('PUT', path(change.name), {
          value: change.value ?? '',
          ...(change.known ? {} : { secret: change.secret }),
        }),
      remove: (change) => api.send('DELETE', path(change.name)),
    });
    const saved = changes.length - failed.length;
    if (saved > 0) refresh();
    if (failed.length === 0) {
      notify.success(t('ui.variables.bulk.saved', { count: saved }));
      setBulk(false);
    }
    return failed;
  };

  const columns: ColumnDef<AppVariableView, unknown>[] = [
    {
      id: 'name',
      header: t('ui.variables.name'),
      meta: { className: 'min-w-48' },
      cell: ({ row }) => (
        <NameCell
          name={row.original.name}
          description={row.original.description}
        />
      ),
    },
    {
      id: 'value',
      header: t('ui.variables.value'),
      meta: { className: 'min-w-40' },
      cell: ({ row }) => (
        <ValueCell
          secret={row.original.secret}
          set={row.original.source !== 'unset'}
          value={row.original.value}
        />
      ),
    },
    {
      id: 'source',
      header: t('ui.variables.source'),
      meta: { className: 'w-44' },
      cell: ({ row }) => {
        const item = row.original;
        const inherited = item.source === 'environment';
        return (
          <span className='flex flex-wrap items-center gap-1.5'>
            <Tag
              tone={
                item.missing ? 'red' : item.source === 'unset' ? 'grey' : 'blue'
              }
            >
              {t(`ui.variables.sources.${item.source}`)}
            </Tag>
            {inherited && canEdit ? (
              <Button
                variant='link'
                size='xs'
                className='h-auto px-0'
                aria-label={t('ui.variables.overrideOf', { name: item.name })}
                onClick={() =>
                  setDraft({
                    name: item.name,
                    secret: item.secret,
                    override: true,
                  })
                }
              >
                {t('ui.variables.override')}
              </Button>
            ) : null}
          </span>
        );
      },
    },
    {
      id: 'tags',
      header: () => (
        <span className='sr-only'>{t('ui.variables.tags.required')}</span>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span className='flex flex-wrap gap-1'>
            {item.missing ? (
              <Tag tone='red'>{t('ui.variables.tags.missing')}</Tag>
            ) : null}
            {item.required && !item.missing ? (
              <Tag tone='grey'>{t('ui.variables.tags.required')}</Tag>
            ) : null}
            {item.secret ? (
              <Tag tone='violet'>{t('ui.variables.tags.secret')}</Tag>
            ) : null}
            {item.firstStartOnly ? (
              <Tag tone='grey'>{t('ui.variables.tags.firstStartOnly')}</Tag>
            ) : null}
            {item.changed ? (
              <Tag tone='amber'>{t('ui.variables.tags.changed')}</Tag>
            ) : null}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <span className='sr-only'>{t('ui.common.actions')}</span>,
      meta: { className: 'w-12 text-right' },
      cell: ({ row }) => {
        const item = row.original;
        const toEnvironment = environmentTo !== undefined && item.declared;
        if (!canEdit && !toEnvironment) return null;
        const owned = item.app?.set === true;
        return (
          <RowActions name={item.name} busy={busy === item.name}>
            {canEdit ? (
              <DropdownMenuItem
                onClick={() =>
                  setDraft({
                    name: item.name,
                    secret: item.secret,
                    override: !owned && item.source === 'environment',
                  })
                }
              >
                <PencilIcon />
                {owned
                  ? t('ui.variables.replace')
                  : item.source === 'environment'
                    ? t('ui.variables.override')
                    : t('ui.variables.setValue')}
              </DropdownMenuItem>
            ) : null}
            {toEnvironment ? (
              <DropdownMenuItem onClick={() => void navigate(environmentTo)}>
                <ServerIcon />
                {t('ui.variables.setOnEnvironment')}
              </DropdownMenuItem>
            ) : null}
            {canEdit && owned ? <DropdownMenuSeparator /> : null}
            {canEdit && owned ? (
              <DropdownMenuItem
                variant='destructive'
                onClick={() => void clear(item.name)}
              >
                <EraserIcon />
                {t('ui.variables.clear')}
              </DropdownMenuItem>
            ) : null}
          </RowActions>
        );
      },
    },
  ];

  const actions = canEdit ? (
    <EditActions
      onBulk={() => setBulk(true)}
      onAdd={() => setDraft({ name: null, secret: false })}
    />
  ) : null;
  const noBuild = meta !== undefined && meta.releaseId === null;
  const declared = meta?.declared === true;
  const table = (rows: readonly AppVariableView[]): ReactElement => (
    <DataTable
      columns={columns}
      data={missingFirst(rows)}
      getRowId={(item) => item.name}
      scroll
    />
  );

  return (
    <Section
      title={t('ui.variables.title')}
      count={items?.length}
      description={
        declared && meta?.releaseVersion
          ? t('ui.variables.basis', { version: meta.releaseVersion })
          : t('ui.variables.description')
      }
      actions={items && items.length > 0 ? actions : null}
      className='scroll-mt-4'
    >
      <VariablesContent
        loaded={{ ...variables, data: items }}
        empty={
          <EmptyState
            className='min-h-36'
            icon={<VariableIcon />}
            title={
              noBuild
                ? t('ui.variables.noBuildTitle')
                : t('ui.variables.emptyTitle')
            }
            description={
              noBuild
                ? t('ui.variables.noBuildDescription')
                : t('ui.variables.emptyDescription')
            }
            action={actions}
          />
        }
      >
        {(rows) => {
          const ofBuild = rows.filter((item) => item.declared);
          const undeclared = rows.filter((item) => !item.declared);
          return (
            <div className='flex flex-col gap-4'>
              {noBuild ? (
                <p className='text-sm text-muted-foreground'>
                  {t('ui.variables.noBuild')}
                </p>
              ) : !declared ? (
                <p className='text-sm text-muted-foreground'>
                  {t('ui.variables.noManifest')}
                </p>
              ) : null}
              {declared ? (
                <>
                  {ofBuild.length > 0 ? table(ofBuild) : null}
                  {undeclared.length > 0 ? (
                    <div
                      className='flex flex-col gap-2'
                      data-slot='undeclared-variables'
                    >
                      <div>
                        <h3 className='text-sm font-medium'>
                          {t('ui.variables.undeclaredTitle')}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          {t('ui.variables.undeclaredDescription')}
                        </p>
                      </div>
                      {table(undeclared)}
                    </div>
                  ) : null}
                </>
              ) : (
                table(rows)
              )}
            </div>
          );
        }}
      </VariablesContent>
      <VariableDialog
        draft={draft}
        onCancel={() => setDraft(null)}
        onSave={save}
      />
      <BulkVariablesDialog
        open={bulk}
        hint={t('ui.variables.bulk.appHint')}
        current={own}
        known={known}
        onClose={() => setBulk(false)}
        onApply={applyBulk}
      />
    </Section>
  );
}

/** The Apps declaring a variable, said briefly: previews of one App folded together, at most three entries. */
function AppsCell({ ids }: { readonly ids: readonly string[] }): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (ids.length === 0)
    return (
      <span className='text-muted-foreground'>{t('ui.variables.noApps')}</span>
    );
  const { shown, more } = compactAppIds(ids);
  return (
    <span
      className='flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs'
      title={ids.join(', ')}
    >
      {shown.map((group) => (
        <span key={group.label} data-app-group={group.label}>
          {group.ids.length > 1
            ? t('ui.variables.appGroup', {
                label: group.label,
                count: group.ids.length,
              })
            : group.label}
        </span>
      ))}
      {more > 0 ? (
        <span className='text-muted-foreground'>
          {t('ui.variables.moreApps', { count: more })}
        </span>
      ) : null}
    </span>
  );
}

/** One row of an environment's variables: what it sets, what its Apps' most recent builds declare, or both. */
interface EnvironmentRow {
  readonly name: string;
  readonly description: string | null;
  readonly secret: boolean;
  readonly stored: EnvironmentVariableView | null;
  readonly declared: EnvironmentDeclaredVariableView | null;
}

/** The environment's values and the declared variables, merged by name; what some App misses first. */
function environmentRows(
  stored: readonly EnvironmentVariableView[],
  declared: readonly EnvironmentDeclaredVariableView[],
): EnvironmentRow[] {
  const rows = new Map<string, EnvironmentRow>();
  for (const item of declared)
    rows.set(item.name, {
      name: item.name,
      description: item.description,
      secret: item.secret,
      stored: null,
      declared: item,
    });
  for (const item of stored) {
    const existing = rows.get(item.name);
    rows.set(item.name, {
      name: item.name,
      description: item.description ?? existing?.description ?? null,
      secret: item.secret || (existing?.secret ?? false),
      stored: item,
      declared: existing?.declared ?? null,
    });
  }
  const missing = (row: EnvironmentRow) =>
    (row.declared?.missingIn.length ?? 0) > 0 ? 1 : 0;
  return [...rows.values()].sort(
    (a, b) =>
      missing(b) - missing(a) ||
      (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  );
}

/**
 * An environment's variables, editable for those who manage environments: the values it sets, and every variable the
 * most recent build of one of its Apps declares, with which Apps declare it and which of them would get no value.
 */
export function EnvironmentVariables({
  environmentId,
  canEdit,
}: {
  readonly environmentId: string;
  readonly canEdit: boolean;
}): ReactElement {
  const { t, i18n } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const [draft, setDraft] = useState<VariableDraft | null>(null);
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const variables = useLoad(
    () =>
      Promise.all([
        api
          .list<EnvironmentVariableView>(
            `environments/${environmentId}/variables`,
          )
          .then((page) => page.items),
        api
          .list<EnvironmentDeclaredVariableView>(
            `environments/${environmentId}/declaredVariables`,
          )
          .then((page) => page.items),
      ]),
    `environment-variables:${environmentId}`,
  );
  const stored = variables.data?.[0];
  const rows = variables.data
    ? environmentRows(variables.data[0], variables.data[1])
    : undefined;
  const path = (name: string): string =>
    `environments/${environmentId}/variables/${encodeURIComponent(name)}`;
  const save = async (
    name: string,
    value: string,
    secret: boolean,
  ): Promise<void> => {
    try {
      await api.send('PUT', path(name), {
        value,
        ...(draft?.name === null ? { secret } : {}),
      });
      notify.success(t('ui.variables.saved', { name }));
      setDraft(null);
      variables.reload();
    } catch (reason) {
      notify.error(reason);
    }
  };
  const clear = async (name: string): Promise<void> => {
    setBusy(name);
    try {
      await api.send('DELETE', path(name));
      notify.success(t('ui.variables.cleared', { name }));
      variables.reload();
    } catch (reason) {
      notify.error(reason);
    } finally {
      setBusy(null);
    }
  };
  const current: CurrentVariable[] = (stored ?? []).map((item) => ({
    name: item.name,
    secret: item.secret,
    value: item.secret ? null : item.value,
  }));
  const applyBulk = async (
    changes: readonly VariableChange[],
  ): Promise<readonly FailedChange[]> => {
    const failed = await applyVariableChanges(changes, {
      put: (change) =>
        api.send('PUT', path(change.name), {
          value: change.value ?? '',
          ...(change.known ? {} : { secret: change.secret }),
        }),
      remove: (change) => api.send('DELETE', path(change.name)),
    });
    const saved = changes.length - failed.length;
    if (saved > 0) variables.reload();
    if (failed.length === 0) {
      notify.success(t('ui.variables.bulk.saved', { count: saved }));
      setBulk(false);
    }
    return failed;
  };
  const columns: ColumnDef<EnvironmentRow, unknown>[] = [
    {
      id: 'name',
      header: t('ui.variables.name'),
      meta: { className: 'min-w-40' },
      cell: ({ row }) => (
        <NameCell
          name={row.original.name}
          description={row.original.description}
        />
      ),
    },
    {
      id: 'value',
      header: t('ui.variables.value'),
      cell: ({ row }) => (
        <ValueCell
          secret={row.original.secret}
          set={row.original.stored?.set ?? false}
          value={row.original.stored?.value ?? null}
        />
      ),
    },
    {
      id: 'apps',
      header: t('ui.variables.declaredBy'),
      meta: { className: 'min-w-40' },
      cell: ({ row }) => <AppsCell ids={row.original.declared?.apps ?? []} />,
    },
    {
      id: 'status',
      header: t('ui.variables.status'),
      cell: ({ row }) => {
        const item = row.original;
        const missingIn = item.declared?.missingIn ?? [];
        return (
          <span className='flex flex-wrap gap-1'>
            {missingIn.length > 0 ? (
              <Tag
                tone='red'
                title={t('ui.variables.missingInTitle', {
                  apps: missingIn.join(', '),
                })}
              >
                {t('ui.variables.missingIn', { count: missingIn.length })}
              </Tag>
            ) : null}
            {item.declared?.required && missingIn.length === 0 ? (
              <Tag tone='grey'>{t('ui.variables.tags.required')}</Tag>
            ) : null}
            {item.secret ? (
              <Tag tone='violet'>{t('ui.variables.tags.secret')}</Tag>
            ) : null}
          </span>
        );
      },
    },
    {
      id: 'updated',
      header: t('ui.variables.updated'),
      meta: { className: 'w-44' },
      cell: ({ row }) =>
        row.original.stored ? (
          <span className='text-muted-foreground tabular-nums'>
            {formatDate(row.original.stored.updatedAt, i18n.language)}
          </span>
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
    },
    ...(canEdit
      ? [
          {
            id: 'actions',
            header: () => (
              <span className='sr-only'>{t('ui.common.actions')}</span>
            ),
            meta: { className: 'w-12 text-right' },
            cell: ({ row }) => (
              <RowActions
                name={row.original.name}
                busy={busy === row.original.name}
              >
                <DropdownMenuItem
                  onClick={() =>
                    setDraft({
                      name: row.original.name,
                      secret: row.original.secret,
                    })
                  }
                >
                  <PencilIcon />
                  {row.original.stored
                    ? t('ui.variables.replace')
                    : t('ui.variables.setValue')}
                </DropdownMenuItem>
                {row.original.stored ? <DropdownMenuSeparator /> : null}
                {row.original.stored ? (
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() => void clear(row.original.name)}
                  >
                    <EraserIcon />
                    {t('ui.variables.clear')}
                  </DropdownMenuItem>
                ) : null}
              </RowActions>
            ),
          } satisfies ColumnDef<EnvironmentRow, unknown>,
        ]
      : []),
  ];
  const actions = canEdit ? (
    <EditActions
      onBulk={() => setBulk(true)}
      onAdd={() => setDraft({ name: null, secret: false })}
    />
  ) : null;
  return (
    <Section
      title={t('ui.variables.title')}
      count={rows?.length}
      description={t('ui.variables.environmentDescription')}
      actions={rows && rows.length > 0 ? actions : null}
    >
      <div data-slot='environment-variables'>
        <VariablesContent
          loaded={{ ...variables, data: rows }}
          empty={
            <EmptyState
              className='min-h-36'
              icon={<VariableIcon />}
              title={t('ui.variables.emptyEnvironmentTitle')}
              description={
                canEdit
                  ? t('ui.variables.emptyEnvironment')
                  : t('ui.variables.emptyEnvironmentReadOnly')
              }
              action={actions}
            />
          }
        >
          {(items) => (
            <DataTable
              columns={columns}
              data={items}
              getRowId={(item) => item.name}
              scroll
            />
          )}
        </VariablesContent>
      </div>
      <VariableDialog
        draft={draft}
        onCancel={() => setDraft(null)}
        onSave={save}
      />
      <BulkVariablesDialog
        open={bulk}
        hint={t('ui.variables.bulk.environmentHint')}
        current={current}
        onClose={() => setBulk(false)}
        onApply={applyBulk}
      />
    </Section>
  );
}
