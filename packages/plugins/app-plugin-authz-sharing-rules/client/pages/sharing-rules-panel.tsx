import { selectionLabel } from '@nocobase/app-plugin-authorization/client/management';
import { humanize } from '@nocobase/app-plugin-authorization/client/management';
import {
  findResource,
  resourceLabel,
  workspaceSubsections,
} from '@nocobase/app-plugin-authorization/client/management';
import { collectionFields } from '@nocobase/app-plugin-authorization/client/management';
import { titleText } from '@nocobase/app-plugin-authorization/client/management';
import { DataScopesEditor } from '@nocobase/app-plugin-authorization/client/management';
import type { SharingRule } from '../api.js';
import { Checkbox } from '../components/ui/checkbox.js';
import { SelectField } from '@nocobase/app-plugin-authorization/client/management';
import { incompleteSelection } from '@nocobase/app-plugin-authorization/client/management';
import {
  useSubjectNames,
  subjectKey,
} from '@nocobase/app-plugin-authorization/client/management';
import {
  RuleDrawer,
  RuleForm,
} from '@nocobase/app-plugin-authorization/client/management';
import { useRuleDraft } from '@nocobase/app-plugin-authorization/client/management';
import { actionLabel } from '@nocobase/app-plugin-authorization/client/management';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react';
import type {
  AuthorizationOptions,
  AuthorizationRecordOption,
  RecordSelection,
} from '@nocobase/app-plugin-authorization/client/management';
import { ConfirmDialog } from '@nocobase/app-plugin-authorization/client/management';
import { SearchField } from '@nocobase/app-plugin-authorization/client/management';
import {
  ActionsEditor,
  Field,
  ResourceEditor,
  SelectionEditor,
  SubjectsEditor,
} from '@nocobase/app-plugin-authorization/client/management';
import {
  ErrorBox,
  errorMessage as message,
} from '@nocobase/app-plugin-authorization/client/management';
import {
  EmptyTableRow,
  ManagementTable,
  ManagementToolbar,
} from '@nocobase/app-plugin-authorization/client/management';
import { TablePager } from '@nocobase/app-plugin-authorization/client/management';
import { useAuthorizationTranslation } from '../i18n.js';
import { pageSlice } from '@nocobase/app-plugin-authorization/client/management';
import {
  defaultSelection,
  firstActions,
} from '@nocobase/app-plugin-authorization/client/management';
import { useSharingRulesClient } from '../api.js';

const COMPOSITE = 'composite';

export function SharingRulesPanel({
  options,
}: {
  options: AuthorizationOptions;
}): ReactElement {
  const authz = useSharingRulesClient();
  const loadCompositeRecords = useCallback(
    (collection: string) => authz.listSharingRecords(collection),
    [authz],
  );
  const t = useAuthorizationTranslation();
  const [rules, setRules] = useState<readonly SharingRule[]>([]);
  const subjectNames = useSubjectNames(
    'sharingRules',
    options.subjectTypes,
    rules.flatMap((rule) => rule.subjects),
  );
  const { draft, setDraft, originalKey, edit, close, dirty } = useRuleDraft(
    rules,
    () => fresh(options),
  );
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [sectionKey, setSectionKey] = useState('');
  const subsections = useMemo(
    () =>
      workspaceSubsections(options).filter((item) => item.resources.length > 0),
    [options],
  );
  const hasResources = subsections.length > 0;
  const [page, setPage] = useState(1);
  const [errorCause, setErrorCause] = useState<unknown>();
  const error = errorCause === undefined ? undefined : message(t, errorCause);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const load = useCallback(async (): Promise<void> => {
    try {
      setRules(await authz.listSharingRules());
    } catch (cause) {
      setErrorCause(cause);
    }
  }, [authz]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const visibleRules = useMemo(() => {
    const query = search.trim().toLowerCase();
    const section = subsections.find((item) => item.value === sectionKey);
    const selectedRules = section
      ? rules.filter((rule) =>
          section.resources.some(
            (item) =>
              item.type === rule.resource.type &&
              item.value === rule.resource.id,
          ),
        )
      : rules;
    return query
      ? selectedRules.filter((rule) =>
          [titleText(rule.title, t), rule.key, rule.resource.id].some((value) =>
            value?.toLowerCase().includes(query),
          ),
        )
      : selectedRules;
  }, [rules, search, subsections, sectionKey, t]);
  const pagedRules = pageSlice(visibleRules, page);
  // Narrowing the search can leave the current page past the end of the list.
  function changeSearch(value: string): void {
    setSearch(value);
    setPage(1);
  }
  async function save(): Promise<void> {
    if (!draft || busy) return;
    setBusy(true);
    setErrorCause(undefined);
    try {
      if (
        !draft.key ||
        !draft.resource.id ||
        draft.actions.length === 0 ||
        draft.actions.some(
          (item) =>
            item.selection.type === 'all' ||
            incompleteSelection(item.selection),
        ) ||
        draft.actions.some(
          (item) =>
            item.selection.type === 'records' &&
            item.selection.ids.length === 0,
        ) ||
        draft.subjects.length === 0 ||
        draft.subjects.some((item) => !item.id)
      )
        throw new TypeError(t('errors.completeRule'));
      if (originalKey) await authz.updateSharingRule(originalKey, draft);
      else await authz.createSharingRule(draft);
      close();
      await load();
    } catch (cause) {
      setErrorCause(cause);
    } finally {
      setBusy(false);
    }
  }
  async function remove(): Promise<void> {
    if (!originalKey || busy) return;
    setBusy(true);
    try {
      await authz.deleteSharingRule(originalKey);
      close();
      await load();
    } catch (cause) {
      setErrorCause(cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error ? <ErrorBox value={error} /> : null}
      <ManagementToolbar
        filters={
          subsections.length > 1 ? (
            <SelectField
              aria-label={t('editors.resourceGroup')}
              value={sectionKey}
              onValueChange={(value) => {
                setSectionKey(value);
                setPage(1);
              }}
              options={[
                { value: '', label: t('common.all') },
                ...subsections.map((item) => ({
                  value: item.value,
                  label: item.label,
                })),
              ]}
            />
          ) : undefined
        }
        search={search}
        searchLabel={t('sharingRules.search')}
        searchPlaceholder={t('sharingRules.search')}
        onSearch={changeSearch}
        actionLabel={t('sharingRules.create')}
        actionDisabled={!hasResources}
        onAction={() => {
          if (hasResources) edit();
        }}
      />
      {!hasResources && rules.length > 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('sharingRules.noResources')}
        </p>
      ) : null}
      <ManagementTable>
        <Table className='min-w-[64rem] table-fixed'>
          <colgroup>
            <col className='w-[25%]' />
            <col className='w-[12%]' />
            <col className='w-[21%]' />
            <col />
            <col className='w-20' />
          </colgroup>
          <TableHeader className='bg-muted/30 uppercase'>
            <TableRow>
              <TableHead className='px-5 py-3 font-medium'>
                {t('sharingRules.ruleHeader')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('common.resource')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('sharingRules.sharedWithHeader')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('sharingRules.accessHeading')}
              </TableHead>
              <TableHead className='w-20 px-5 py-3' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRules.map((rule) => (
              <TableRow key={rule.key}>
                <TableCell className='px-5 py-4 align-top'>
                  <button
                    type='button'
                    className='font-medium text-primary hover:underline'
                    onClick={() => edit(rule)}
                  >
                    {titleText(rule.title, t, humanize(rule.key))}
                  </button>
                  <p className='mt-1 break-all text-xs text-muted-foreground'>
                    {rule.key}
                  </p>
                </TableCell>
                <TableCell className='px-5 py-4 align-top'>
                  {resourceLabel(options, rule.resource)}
                </TableCell>
                <TableCell className='px-5 py-4 align-top'>
                  <div className='flex flex-wrap gap-x-3 gap-y-1'>
                    {rule.subjects.map((subject) => (
                      <span key={subjectKey(subject)} className='inline-block'>
                        {subjectNames[subjectKey(subject)] ??
                          `${subject.type}: ${subject.id}`}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className='px-5 py-4 align-top whitespace-normal break-words'>
                  <div className='space-y-2 text-sm'>
                    {[...new Set(rule.actions.map((item) => item.action))].map(
                      (action) => {
                        const entries = rule.actions.filter(
                          (item) => item.action === action,
                        );
                        const declared = findResource(options, rule.resource)
                          ?.dataScopes?.[action];
                        const grouped =
                          (declared?.length ?? entries.length) > 1;
                        return (
                          <div key={action}>
                            {grouped && (
                              <div className='mb-1'>
                                {actionLabel(
                                  options,
                                  rule.resource.type,
                                  action,
                                  rule.resource.id,
                                )}
                              </div>
                            )}
                            <div
                              className={
                                grouped ? 'ml-1 space-y-1 border-l pl-3' : ''
                              }
                            >
                              {entries.map((item) => {
                                const targets = findResource(
                                  options,
                                  rule.resource,
                                )?.dataScopes?.[item.action];
                                const scopeLabel = targets?.find(
                                  (target) => target.key === item.scopeKey,
                                )?.label;
                                const multiple = (targets?.length ?? 0) > 1;
                                return (
                                  <div
                                    key={JSON.stringify([
                                      item.action,
                                      item.scopeKey,
                                    ])}
                                    className='flex flex-wrap items-baseline gap-x-2 gap-y-1'
                                  >
                                    <span>
                                      {multiple
                                        ? (scopeLabel ?? item.scopeKey)
                                        : actionLabel(
                                            options,
                                            rule.resource.type,
                                            item.action,
                                            rule.resource.id,
                                          )}
                                    </span>
                                    <span
                                      aria-hidden='true'
                                      className='text-muted-foreground'
                                    >
                                      →
                                    </span>
                                    <span>
                                      {selectionLabel(
                                        t,
                                        item.selection,
                                        options,
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </TableCell>
                <TableCell className='px-5 py-4 text-right'>
                  <Button size='sm' variant='ghost' onClick={() => edit(rule)}>
                    {t('common.edit')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visibleRules.length === 0 ? (
              <EmptyTableRow colSpan={5}>
                {rules.length === 0
                  ? t(
                      hasResources
                        ? 'sharingRules.emptyNone'
                        : 'sharingRules.noResources',
                    )
                  : t('sharingRules.emptySearch')}
              </EmptyTableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePager
          label={t('sharingRules.pagerLabel')}
          page={page}
          total={visibleRules.length}
          onPage={setPage}
        />
      </ManagementTable>
      <ConfirmDialog
        confirmLabel={t('sharingRules.deleteRule')}
        open={confirmDelete}
        title={t('sharingRules.confirmDeleteTitle')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void remove();
        }}
      >
        {t('sharingRules.confirmDeleteBody', {
          title: titleText(draft?.title, t, humanize(originalKey ?? '')),
        })}
      </ConfirmDialog>
      {draft && (originalKey || hasResources) ? (
        <RuleDrawer
          title={t(
            originalKey ? 'sharingRules.editTitle' : 'sharingRules.newTitle',
          )}
          description={t('sharingRules.editorDescription')}
          onClose={close}
          dirty={dirty}
          busy={busy}
        >
          <RuleForm
            footer={
              <>
                {originalKey ? (
                  <Button
                    variant='outline'
                    className='mr-auto text-destructive'
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                  >
                    {t('sharingRules.deleteRule')}
                  </Button>
                ) : null}
                <Button disabled={busy} onClick={() => void save()}>
                  {t('sharingRules.save')}
                </Button>
              </>
            }
          >
            {error ? <ErrorBox value={error} /> : null}
            <>
              <section className='space-y-5'>
                <div>
                  <h3 className='text-base font-semibold'>
                    {t('sharingRules.ruleHeading')}
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('sharingRules.ruleDescription')}
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field label={t('sharingRules.ruleName')}>
                    <Input
                      value={titleText(draft.title, t)}
                      onChange={(event) =>
                        setDraft({ ...draft, title: event.target.value })
                      }
                    />
                  </Field>
                  <Field label={t('common.key')} hint={t('common.keyHint')}>
                    <Input
                      required
                      disabled={Boolean(originalKey)}
                      value={draft.key}
                      onChange={(event) =>
                        setDraft({ ...draft, key: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <ResourceEditor
                    options={options}
                    type={draft.resource.type}
                    id={draft.resource.id}
                    onChange={(resource) =>
                      setDraft({
                        ...draft,
                        resource,
                        actions:
                          resource.type === COMPOSITE
                            ? []
                            : firstActions(
                                options,
                                resource.type,
                                resource.id,
                              ).map((action) => ({
                                action,
                                selection: {
                                  type: 'records' as const,
                                  ids: [],
                                },
                              })),
                      })
                    }
                  />
                </div>
                <Field label={t('sharingRules.description')}>
                  <Input
                    value={draft.reason ?? ''}
                    onChange={(event) =>
                      setDraft({ ...draft, reason: event.target.value })
                    }
                  />
                </Field>
              </section>
            </>
            <>
              <section className='space-y-5'>
                <div>
                  <h3 className='text-base font-semibold'>
                    {t('sharingRules.assignmentsHeading')}
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('sharingRules.assignmentsDescription')}
                  </p>
                </div>
                <SubjectsEditor
                  types={options.subjectTypes}
                  settings='sharingRules'
                  value={draft.subjects}
                  onChange={(subjects) => setDraft({ ...draft, subjects })}
                />
              </section>
            </>
            <>
              <section className='space-y-5'>
                <div>
                  <h3 className='text-base font-semibold'>
                    {t('sharingRules.accessHeading')}
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('sharingRules.accessDescription')}
                  </p>
                </div>
                {draft.resource.type === COMPOSITE ? (
                  <DataScopesEditor
                    options={options}
                    resourceId={draft.resource.id}
                    allowAll={false}
                    value={draft.actions}
                    onChange={(actions) => setDraft({ ...draft, actions })}
                    loadRecords={loadCompositeRecords}
                  />
                ) : (
                  <SharingActionsEditor
                    options={options}
                    resourceType={draft.resource.type}
                    collection={draft.resource.id}
                    value={draft.actions}
                    onChange={(actions) => setDraft({ ...draft, actions })}
                  />
                )}
              </section>
            </>
          </RuleForm>
        </RuleDrawer>
      ) : null}
    </>
  );
}

function fresh(options: AuthorizationOptions): SharingRule {
  const resources = workspaceSubsections(options).flatMap(
    (item) => item.resources,
  );
  const first =
    resources.find((item) => item.type === COMPOSITE) ?? resources[0];
  return {
    key: '',
    title: '',
    resource: {
      type: first?.type ?? COMPOSITE,
      id: first?.value ?? '',
    },
    actions:
      first?.type === COMPOSITE
        ? []
        : firstActions(options, first?.type ?? '', first?.value).map(
            (action) => ({
              action,
              selection: { type: 'records' as const, ids: [] },
            }),
          ),
    subjects: [],
    reason: '',
  };
}

function SharingActionsEditor({
  options,
  resourceType,
  collection,
  value,
  onChange,
}: {
  options: AuthorizationOptions;
  resourceType: string;
  collection: string;
  value: SharingRule['actions'];
  onChange: (value: SharingRule['actions']) => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const authz = useSharingRulesClient();
  const [records, setRecords] = useState<readonly AuthorizationRecordOption[]>(
    [],
  );
  const [recordSearch, setRecordSearch] = useState('');
  useEffect(() => {
    let active = true;
    void authz.listSharingRecords(collection).then(
      (items) => {
        if (active) setRecords(items);
      },
      () => {
        if (active) setRecords([]);
      },
    );
    return () => {
      active = false;
    };
  }, [authz, collection]);
  return (
    <div className='space-y-3'>
      <ActionsEditor
        options={options}
        resourceType={resourceType}
        resourceId={collection}
        value={value.map((item) => item.action)}
        onChange={(actions) => {
          onChange(
            actions.map(
              (action) =>
                value.find((item) => item.action === action) ?? {
                  action,
                  selection: { type: 'records', ids: [] },
                },
            ),
          );
        }}
      />
      {value.map((current) => (
        <section
          key={current.action}
          className='overflow-hidden rounded-lg border'
        >
          <h4 className='border-b bg-muted/20 px-4 py-3 font-medium'>
            {actionLabel(options, resourceType, current.action)}
          </h4>
          <div className='space-y-4 p-4'>
            <Field label={t('sharingRules.recordsToShare')}>
              <SelectField
                aria-label={t('sharingRules.recordsToShare')}
                className='h-8 w-full rounded-lg border bg-transparent px-3 text-sm'
                value={
                  current.selection.type === 'records' ? 'records' : 'policy'
                }
                onValueChange={(selectedValue) =>
                  changeSharingAction(
                    value,
                    current.action,
                    onChange,
                    selectedValue === 'records'
                      ? { type: 'records', ids: [] }
                      : defaultPolicy(options),
                  )
                }
                options={[
                  {
                    value: 'records',
                    label: t('sharingRules.selectedRecords'),
                  },
                  { value: 'policy', label: t('sharingRules.policyRecords') },
                ]}
              />
            </Field>
            {current.selection.type !== 'recordAccess' ? (
              <RecordPicker
                records={records}
                search={recordSearch}
                onSearch={setRecordSearch}
                value={
                  current.selection.type === 'records'
                    ? current.selection.ids
                    : []
                }
                onChange={(ids) =>
                  changeSharingAction(value, current.action, onChange, {
                    type: 'records',
                    ids,
                  })
                }
              />
            ) : (
              <PolicyEditor
                options={options}
                fields={collectionFields(options, collection)}
                value={current.selection}
                onChange={(selection) =>
                  changeSharingAction(
                    value,
                    current.action,
                    onChange,
                    selection,
                  )
                }
              />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function RecordPicker({
  records,
  search,
  onSearch,
  value,
  onChange,
}: {
  records: readonly AuthorizationRecordOption[];
  search: string;
  onSearch: (value: string) => void;
  value: readonly string[];
  onChange: (value: readonly string[]) => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const query = search.trim().toLowerCase();
  const visible = records.filter(
    (record) =>
      !query ||
      [record.label, record.description, record.id].some((item) =>
        item?.toLowerCase().includes(query),
      ),
  );
  return (
    <div className='space-y-2'>
      <Field label={t('editors.records')}>
        <SearchField
          className='sm:max-w-none'
          label={t('editors.searchRecords')}
          placeholder={t('editors.searchRecords')}
          value={search}
          onChange={onSearch}
        />
      </Field>
      <div className='max-h-64 divide-y overflow-y-auto rounded-md border'>
        {visible.map((record) => (
          <label
            className='flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-muted/20'
            key={record.id}
          >
            <Checkbox
              className='mt-1'
              checked={value.includes(record.id)}
              onCheckedChange={(checked) =>
                onChange(
                  checked
                    ? [...value, record.id]
                    : value.filter((id) => id !== record.id),
                )
              }
            />
            <span>
              <span className='block text-sm font-medium'>{record.label}</span>
              {record.description ? (
                <span className='block text-xs text-muted-foreground'>
                  {record.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
        {visible.length === 0 ? (
          <p className='p-6 text-center text-sm text-muted-foreground'>
            {t('sharingRules.noRecords')}
          </p>
        ) : null}
      </div>
      <p className='text-xs text-muted-foreground'>
        {t(`editors.recordsSelected.${value.length === 1 ? 'one' : 'other'}`, {
          count: value.length,
        })}
      </p>
    </div>
  );
}

function changeSharingAction(
  actions: SharingRule['actions'],
  action: string,
  onChange: (value: SharingRule['actions']) => void,
  selection: SharingRule['actions'][number]['selection'],
): void {
  onChange(
    actions.map((item) =>
      item.action === action ? { ...item, selection } : item,
    ),
  );
}

function PolicyEditor({
  options,
  fields,
  value,
  onChange,
}: {
  options: AuthorizationOptions;
  fields: readonly string[];
  value: RecordSelection;
  onChange: (value: RecordSelection) => void;
}): ReactElement {
  return (
    <SelectionEditor
      options={options}
      fields={fields}
      allowRecords={false}
      allowAll={false}
      value={value}
      onChange={onChange}
    />
  );
}

/** Sharing never selects every record, so a policy starts at record access. */
function defaultPolicy(options: AuthorizationOptions): RecordSelection {
  const selection = defaultSelection(options);
  return selection.type === 'recordAccess'
    ? selection
    : { type: 'records', ids: [] };
}
