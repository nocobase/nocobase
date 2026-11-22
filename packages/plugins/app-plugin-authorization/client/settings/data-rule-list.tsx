import {
  ApiClientError,
  resolveListState,
  useApiClient,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PlusIcon } from 'lucide-react';
import { useRef, useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { RecordLink } from '#components/record-link';
import { RowActions } from '#components/row-actions';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Spinner } from '#components/ui/spinner';
import { useListLocation } from '#hooks/use-list-location';
import { useTableUrlState } from '#hooks/use-table-url-state';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '../authorization-client.js';
import { useCan } from '../use-can.js';
import { DataRuleEditor } from './data-rule-editor.js';
import type { DataRuleKind } from './data-rule-kinds.js';
import { subjectKey, useSubjectTitles } from './data-rule-subject-titles.js';
import {
  actionKey,
  resourceKey,
  ruleResourceLabels,
  ruleResources,
  ruleScopes,
  type DataRule,
} from './default-access-model.js';
import { useSettingsData } from './hooks.js';
import { ConfirmAction, SettingsError } from './shared.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

/** The search that opens the editor over the list (`create=1` or `edit=<key>`), keeping the list's own query. */
function editorSearch(
  params: URLSearchParams,
  open: { create: true } | { edit: string } | undefined,
): string {
  const next = new URLSearchParams(params);
  next.delete('create');
  next.delete('edit');
  if (open && 'create' in open) next.set('create', '1');
  else if (open) next.set('edit', open.edit);
  const search = next.toString();
  return search ? `?${search}` : '';
}

/**
 * One kind of data rule: a searchable table whose rules open in a side sheet over it, with each rule summarized as a
 * sentence. The rule plugin's settings item gates reading, creating, editing and deleting.
 */
export function DataRuleList({
  kind,
}: {
  readonly kind: DataRuleKind;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const k = (name: string, values?: Record<string, unknown>): string =>
    t(`settings.${kind.texts}.${name}`, values);
  const settings = useAuthorizationSettings();
  const api = useApiClient();
  const toaster = useToaster();
  const { params, setParams, active } = useListLocation();
  const search = params.get('q') ?? '';
  const searchRef = useRef<HTMLInputElement>(null);
  const rules = useSettingsData<{ data: readonly DataRule[] }>(
    `authorization/${kind.path}`,
    { active },
  );
  const catalog = useSettingsData<{ data: AuthorizationOptionsResponse }>(
    `authorization/${kind.path}/options`,
  );
  const settingsResource = { type: 'settings', id: kind.settings };
  const createPermission = useCan({
    resource: settingsResource,
    action: 'create',
  });
  const canCreate = createPermission.can && !createPermission.isPending;
  const canDelete = useCan({
    resource: settingsResource,
    action: 'delete',
  }).can;
  const [removing, setRemoving] = useState<DataRule>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [conflict, setConflict] = useState(false);
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const resources = catalog.data
    ? ruleResources(catalog.data.data, settings.workspace)
    : [];
  // The list names business objects plainly; only a data table that shares a business object's name says so.
  const labels = ruleResourceLabels(resources, text, (title, type) =>
    type === 'table'
      ? t('settings.defaultAccess.kindLabel', {
          title,
          kind: t('settings.defaultAccess.kindTable'),
        })
      : title,
  );
  const all = rules.data?.data ?? [];
  const subjectTitles = useSubjectTitles(
    kind.path,
    kind.subjects ? all.flatMap((rule) => rule.subjects ?? []) : [],
    catalog.data?.data,
  );
  const resourceName = (rule: DataRule): string =>
    labels.get(resourceKey(rule.resource)) ?? rule.resource.id;
  const name = (rule: DataRule): string => {
    if (!kind.subjects) return resourceName(rule);
    if (rule.title === undefined) return rule.key;
    return text(rule.title) || rule.key;
  };
  const scopesSummary = (rule: DataRule): string => {
    const resource = resources.find(
      (entry) => resourceKey(entry) === resourceKey(rule.resource),
    );
    const scopes = catalog.data
      ? ruleScopes(resource, catalog.data.data, settings.workspace)
      : [];
    return rule.actions
      .map((entry) => {
        const scope = scopes.find((item) => item.id === actionKey(entry));
        const label =
          entry.selection.type === 'all'
            ? t('settings.defaultAccess.all')
            : entry.selection.type === 'records'
              ? t('settings.defaultAccess.records', {
                  count: entry.selection.ids.length,
                })
              : text(
                  catalog.data?.data.recordAccess.find(
                    (item) =>
                      entry.selection.type === 'recordAccess' &&
                      item.key === entry.selection.key,
                  )?.title ?? entry.selection.key,
                );
        return `${text(scope?.actionTitle ?? entry.action)}${scope ? ` · ${text(scope.title)}` : entry.scopeKey ? ` · ${entry.scopeKey}` : ''}: ${label}`;
      })
      .join('; ');
  };
  const subjectsSummary = (
    rule: DataRule,
    titles: ReadonlyMap<string, string> = subjectTitles,
  ): string =>
    (rule.subjects ?? [])
      .map((subject) => titles.get(subjectKey(subject)) ?? subject.id)
      .join(', ');
  /** The rule in one sentence, as the person reads it in the list and the editor's preview. */
  const sentence = (
    rule: DataRule,
    titles: ReadonlyMap<string, string> = subjectTitles,
  ): string => {
    const scopes = scopesSummary(rule);
    if (!kind.subjects) return scopes || t('settings.defaultAccess.none');
    return k('sentence', {
      resource: resourceName(rule),
      scopes: scopes || k('none'),
      subjects: subjectsSummary(rule, titles) || k('nobody'),
    });
  };
  // The rule's name, with its object and key in small type under it.
  const nameCell = (rule: DataRule): ReactElement => (
    <div className='flex min-w-0 flex-col'>
      <RecordLink to={{ search: editorSearch(params, { edit: rule.key }) }}>
        {name(rule)}
      </RecordLink>
      {kind.subjects && (
        <span className='truncate text-xs text-muted-foreground'>
          {resourceName(rule)}
        </span>
      )}
      <code
        className='max-w-56 truncate font-mono text-xs text-muted-foreground'
        title={rule.key}
      >
        {rule.key}
      </code>
    </div>
  );
  // Default access sorted its rules by `resource` before it shared this list, and stored links still say so.
  const nameColumn = kind.subjects ? 'name' : 'resource';
  const columns: ColumnDef<DataRule>[] = [
    {
      id: nameColumn,
      accessorFn: name,
      sortingFn: (a, b) =>
        name(a.original).localeCompare(name(b.original), i18n.language),
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={
            kind.subjects ? k('rule') : t('settings.defaultAccess.resource')
          }
        />
      ),
      cell: ({ row }) => nameCell(row.original),
    },
    ...(kind.subjects
      ? [
          {
            id: 'subjects',
            header: t('settings.ruleSubjects.appliesTo'),
            enableSorting: false,
            cell: ({ row }) => {
              const subjects = row.original.subjects ?? [];
              return subjects.length ? (
                <span className='flex max-w-72 flex-wrap gap-1'>
                  {subjects.map((subject) => (
                    <span
                      key={subjectKey(subject)}
                      className='rounded bg-muted px-1.5 text-xs leading-5'
                    >
                      {subjectTitles.get(subjectKey(subject)) ?? subject.id}
                    </span>
                  ))}
                </span>
              ) : (
                <span className='text-muted-foreground'>{k('nobody')}</span>
              );
            },
          } satisfies ColumnDef<DataRule>,
        ]
      : []),
    {
      id: 'summary',
      header: kind.subjects
        ? k('sentenceHeader')
        : t('settings.defaultAccess.scopes'),
      enableSorting: false,
      // The sentence is what the list is read for, so it wraps over two lines instead of being cut short.
      cell: ({ row }) => (
        <span
          className='line-clamp-2 min-w-64 whitespace-normal'
          title={sentence(row.original)}
        >
          {sentence(row.original)}
        </span>
      ),
    },
    ...(kind.subjects
      ? [
          {
            id: 'reason',
            header: k('reason'),
            enableSorting: false,
            cell: ({ row }) => (
              <span
                className='block max-w-48 truncate text-muted-foreground'
                title={row.original.reason}
              >
                {row.original.reason}
              </span>
            ),
          } satisfies ColumnDef<DataRule>,
        ]
      : []),
    {
      id: 'actions',
      enableSorting: false,
      header: () => <span className='sr-only'>{t('settings.actions')}</span>,
      cell: ({ row }) => (
        <RowActions
          label={t('settings.actionsFor', { name: name(row.original) })}
          actions={[
            {
              key: 'open',
              label: t('settings.defaultAccess.open'),
              render: (
                <Link
                  to={{
                    search: editorSearch(params, { edit: row.original.key }),
                  }}
                />
              ),
            },
            canDelete && {
              key: 'delete',
              label: t('settings.defaultAccess.delete'),
              destructive: true,
              onClick: () => {
                setError(undefined);
                setRemoving(row.original);
              },
            },
          ]}
        />
      ),
    },
  ];
  const needle = search.toLocaleLowerCase();
  const rows = all
    .filter((rule) =>
      [
        name(rule),
        rule.key,
        ...(kind.subjects
          ? [resourceName(rule), subjectsSummary(rule), rule.reason ?? '']
          : []),
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(needle),
    )
    .sort((a, b) => name(a).localeCompare(name(b), i18n.language));
  const tableState = useTableUrlState({
    active,
    revision: rules.revision,
    defaultPageSize: 20,
    sortColumns: [nameColumn],
    rowCount:
      rules.data &&
      !rules.loading &&
      !rules.error &&
      catalog.data &&
      !catalog.loading &&
      !catalog.error
        ? rows.length
        : undefined,
  });
  const listError =
    [rules.error, catalog.error].find(
      (next) =>
        next instanceof ApiClientError && [401, 403].includes(next.status),
    ) ??
    tableState.error ??
    rules.error ??
    catalog.error;
  const listData = rules.data && catalog.data ? rows : undefined;
  const listState = resolveListState(
    {
      data: listData,
      error: listError,
      isPending: !listData && (rules.loading || catalog.loading),
    },
    rows.length,
    Boolean(search.trim()),
  );
  const canShowCreate =
    canCreate &&
    (listState === 'empty' ||
      listState === 'ready' ||
      listState === 'no-results' ||
      listState === 'refresh-failed');
  const clearSearch = () =>
    setParams(
      (old) => {
        const next = new URLSearchParams(old);
        next.delete('q');
        next.delete('page');
        return next;
      },
      { replace: true },
    );
  const eligible = resources.some(
    (resource) =>
      !kind.onePerResource ||
      !all.some((rule) => resourceKey(rule.resource) === resourceKey(resource)),
  );
  const create =
    canCreate && rules.data && catalog.data ? (
      eligible ? (
        <Button
          nativeButton={false}
          render={
            <Link to={{ search: editorSearch(params, { create: true }) }} />
          }
        >
          <PlusIcon />
          {k('new')}
        </Button>
      ) : (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-muted-foreground'>
            {t('settings.defaultAccess.noResourcesShort')}
          </span>
          <Button disabled>
            <PlusIcon />
            {k('new')}
          </Button>
        </div>
      )
    ) : null;
  const submission = useSubmission();
  const remove = async () => {
    if (!removing || busy || !canDelete) return;
    setBusy(true);
    setError(undefined);
    let submitted = false;
    try {
      const outcome = await submission.run(
        { key: removing.key },
        async (idempotencyKey, _signal, _snapshot, recovering) => {
          if (!recovering) {
            const latest = await api.request<{ data: readonly DataRule[] }>({
              path: `authorization/${kind.path}`,
            });
            if (
              JSON.stringify(
                latest.data.find((rule) => rule.key === removing.key),
              ) !== JSON.stringify(removing)
            ) {
              rules.reload();
              setRemoving(undefined);
              setConflict(true);
              requestAnimationFrame(() => searchRef.current?.focus());
              return undefined;
            }
          }
          submitted = true;
          await api.request({
            path: `authorization/${kind.path}/${encodeURIComponent(removing.key)}`,
            method: 'DELETE',
            headers: { 'Idempotency-Key': idempotencyKey },
          });
          return true;
        },
      );
      if (!outcome) return;
      toaster.show({
        type: 'success',
        title: k('deleted', { name: name(removing) }),
      });
      setRemoving(undefined);
      rules.reload();
      requestAnimationFrame(() => searchRef.current?.focus());
    } catch (next) {
      setError(next);
      if (
        submitted &&
        (!(next instanceof ApiClientError) || next.status >= 500)
      ) {
        // The write may have committed before the response was lost. Verify without replaying it.
        rules.reload();
      }
    } finally {
      setBusy(false);
    }
  };
  const editKey = params.get('edit');
  const editing =
    editKey === null ? undefined : all.find((rule) => rule.key === editKey);
  const creating = params.get('create') === '1';
  // Closing replaces the editor's entry, so Back after a save or a cancel does not reopen the rule.
  const closeEditor = () =>
    setParams((old) => new URLSearchParams(editorSearch(old, undefined)), {
      replace: true,
    });
  const replace = (updated: DataRule, previous?: string) => {
    rules.replaceData({
      data: [
        ...all.filter(
          (rule) => rule.key !== updated.key && rule.key !== previous,
        ),
        updated,
      ],
    });
    rules.reload();
  };
  return (
    <div className='space-y-6'>
      <p className='text-sm text-muted-foreground'>{k('description')}</p>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          ref={searchRef}
          className='sm:max-w-xs'
          value={search}
          placeholder={k('search')}
          aria-label={k('search')}
          onChange={(event) =>
            setParams(
              (old) => {
                const next = new URLSearchParams(old);
                next.delete('page');
                if (event.target.value) next.set('q', event.target.value);
                else next.delete('q');
                return next;
              },
              { replace: true },
            )
          }
        />
        {search && listState !== 'no-results' && (
          <Button variant='ghost' onClick={clearSearch}>
            {t('settings.clear')}
          </Button>
        )}
        {active &&
        (rules.loading || catalog.loading) &&
        (rules.data || catalog.data) ? (
          <Spinner className='text-muted-foreground' />
        ) : null}
        {canShowCreate && create ? (
          <div className='ms-auto'>{create}</div>
        ) : null}
      </div>
      {conflict && (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('settings.defaultAccess.deleteChanged')}
          </AlertDescription>
        </Alert>
      )}
      <SettingsError error={!removing && error} />
      <DataTable
        {...tableState}
        columns={columns}
        data={rows}
        getRowId={(rule) => rule.key}
        showSelectedCount={false}
        pageSize={20}
        loading={active && (rules.loading || catalog.loading)}
        listState={listState}
        onRetry={() => {
          rules.reload();
          catalog.reload();
        }}
        onClearFilters={clearSearch}
        renderCard={(row) => (
          <div className='flex min-w-0 flex-col gap-2'>
            {nameCell(row.original)}
            {kind.subjects && row.original.subjects?.length ? (
              <span className='text-xs text-muted-foreground'>
                {t('settings.ruleSubjects.appliesTo')}:{' '}
                {subjectsSummary(row.original)}
              </span>
            ) : null}
            <span className='line-clamp-3 text-sm'>
              {sentence(row.original)}
            </span>
          </div>
        )}
      />
      <ConfirmAction
        error={<SettingsError error={error} />}
        open={Boolean(removing)}
        title={k('deleteTitle', { name: removing ? name(removing) : '' })}
        description={k('deleteHint')}
        confirmLabel={t('settings.defaultAccess.delete')}
        busy={busy}
        onCancel={() => {
          setRemoving(undefined);
          setError(undefined);
        }}
        onConfirm={() => {
          void remove();
        }}
      />
      {rules.data && catalog.data && (creating || editing) ? (
        <DataRuleEditor
          // A different rule is a fresh draft.
          key={editing?.key ?? '\ncreate'}
          kind={kind}
          rule={editing}
          rules={all}
          catalog={catalog.data.data}
          preview={sentence}
          onClose={closeEditor}
          onSaved={(saved) => replace(saved, editing?.key)}
          onDeleted={() => rules.reload()}
          onStale={() => rules.reload()}
        />
      ) : null}
    </div>
  );
}
