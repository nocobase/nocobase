import { selectionLabel } from '@nocobase/app-plugin-authorization/client/management';
import { humanize } from '@nocobase/app-plugin-authorization/client/management';
import {
  findResource,
  resourceLabel,
  workspaceSubsections,
} from '@nocobase/app-plugin-authorization/client/management';
import { collectionFields } from '@nocobase/app-plugin-authorization/client/management';
import { titleText } from '@nocobase/app-plugin-authorization/client/management';
import { SelectField } from '@nocobase/app-plugin-authorization/client/management';
import { DataScopesEditor } from '@nocobase/app-plugin-authorization/client/management';
import type { RestrictionRule } from '../api.js';
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
} from '@nocobase/app-plugin-authorization/client/management';
import { ConfirmDialog } from '@nocobase/app-plugin-authorization/client/management';
import {
  RuleActionsEditor,
  Field,
  ResourceEditor,
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
import { useRestrictionRulesClient } from '../api.js';

const COMPOSITE = 'composite';

export function RestrictionRulesPanel({
  options,
}: {
  options: AuthorizationOptions;
}): ReactElement {
  const authz = useRestrictionRulesClient();
  const loadCompositeRecords = useCallback(
    (collection: string) => authz.listRestrictionRecords(collection),
    [authz],
  );
  const t = useAuthorizationTranslation();
  const [rules, setRules] = useState<readonly RestrictionRule[]>([]);
  const subjectNames = useSubjectNames(
    'restrictionRules',
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
  const [records, setRecords] = useState<readonly AuthorizationRecordOption[]>(
    [],
  );
  useEffect(() => {
    if (!draft?.resource.id || draft.resource.type === COMPOSITE) return;
    let active = true;
    void authz.listRestrictionRecords(draft.resource.id).then(
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
  }, [authz, draft?.resource.id, draft?.resource.type]);
  const load = useCallback(async (): Promise<void> => {
    try {
      setRules(await authz.listRestrictionRules());
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
        draft.actions.some((item) => incompleteSelection(item.selection)) ||
        draft.subjects.length === 0 ||
        draft.subjects.some((item) => !item.id)
      )
        throw new TypeError(t('errors.completeRule'));
      if (originalKey) await authz.updateRestrictionRule(originalKey, draft);
      else await authz.createRestrictionRule(draft);
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
      await authz.deleteRestrictionRule(originalKey);
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
        searchLabel={t('restrictionRules.search')}
        searchPlaceholder={t('restrictionRules.search')}
        onSearch={changeSearch}
        actionLabel={t('restrictionRules.create')}
        actionDisabled={!hasResources}
        onAction={() => {
          if (hasResources) edit();
        }}
      />
      {!hasResources && rules.length > 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('restrictionRules.noResources')}
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
                {t('restrictionRules.ruleHeader')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('common.resource')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('restrictionRules.appliesToHeader')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('restrictionRules.accessHeading')}
              </TableHead>
              <TableHead className='w-20 px-5 py-3' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRules.map((rule) => (
              <TableRow key={rule.key}>
                <TableCell className='px-5 py-4 align-top whitespace-normal break-words'>
                  <button
                    type='button'
                    className='text-left font-medium text-primary hover:underline'
                    onClick={() => edit(rule)}
                  >
                    {titleText(rule.title, t, humanize(rule.key))}
                  </button>
                  <p className='mt-1 break-all text-xs text-muted-foreground'>
                    {rule.key}
                  </p>
                  {rule.reason && (
                    <p className='mt-1 text-xs text-muted-foreground'>
                      {rule.reason}
                    </p>
                  )}
                </TableCell>
                <TableCell className='px-5 py-4 align-top whitespace-normal break-words'>
                  {resourceLabel(options, rule.resource)}
                </TableCell>
                <TableCell className='px-5 py-4 align-top whitespace-normal break-words'>
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
                <TableCell className='px-5 py-4 text-right align-top'>
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
                        ? 'restrictionRules.emptyNone'
                        : 'restrictionRules.noResources',
                    )
                  : t('restrictionRules.emptySearch')}
              </EmptyTableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePager
          label={t('restrictionRules.pagerLabel')}
          page={page}
          total={visibleRules.length}
          onPage={setPage}
        />
      </ManagementTable>
      <ConfirmDialog
        confirmLabel={t('restrictionRules.deleteRule')}
        open={confirmDelete}
        title={t('restrictionRules.confirmDeleteTitle')}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void remove();
        }}
      >
        {t('restrictionRules.confirmDeleteBody', {
          title: titleText(draft?.title, t, humanize(originalKey ?? '')),
        })}
      </ConfirmDialog>
      {draft && (originalKey || hasResources) ? (
        <RuleDrawer
          title={t(
            originalKey
              ? 'restrictionRules.editTitle'
              : 'restrictionRules.newTitle',
          )}
          description={t('restrictionRules.editorDescription')}
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
                    {t('restrictionRules.deleteRule')}
                  </Button>
                ) : null}
                <Button disabled={busy} onClick={() => void save()}>
                  {t('restrictionRules.save')}
                </Button>
              </>
            }
          >
            {error ? <ErrorBox value={error} /> : null}
            <>
              <section className='space-y-5'>
                <div>
                  <h3 className='text-base font-semibold'>
                    {t('restrictionRules.ruleHeading')}
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('restrictionRules.ruleDescription')}
                  </p>
                </div>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <Field label={t('restrictionRules.ruleName')}>
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
                                selection: defaultSelection(options),
                              })),
                      })
                    }
                  />
                </div>
                <Field label={t('restrictionRules.reason')}>
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
                    {t('restrictionRules.assignmentsHeading')}
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('restrictionRules.assignmentsDescription')}
                  </p>
                </div>
                <SubjectsEditor
                  types={options.subjectTypes}
                  settings='restrictionRules'
                  value={draft.subjects}
                  onChange={(subjects) => setDraft({ ...draft, subjects })}
                />
              </section>
            </>
            <>
              <section className='space-y-5'>
                <div>
                  <h3 className='text-base font-semibold'>
                    {t('restrictionRules.accessHeading')}
                  </h3>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {t('restrictionRules.accessDescription')}
                  </p>
                </div>
                {draft.resource.type === COMPOSITE ? (
                  <DataScopesEditor
                    options={options}
                    resourceId={draft.resource.id}
                    value={draft.actions}
                    onChange={(actions) => setDraft({ ...draft, actions })}
                    loadRecords={loadCompositeRecords}
                  />
                ) : (
                  <RuleActionsEditor
                    options={options}
                    resourceType={draft.resource.type}
                    resourceId={draft.resource.id}
                    fields={collectionFields(options, draft.resource.id)}
                    records={records}
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

function fresh(options: AuthorizationOptions): RestrictionRule {
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
              selection: defaultSelection(options),
            }),
          ),
    subjects: [],
    reason: '',
  };
}
