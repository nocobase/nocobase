import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  ApiClientError,
  useApiClient,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type ReactElement } from 'react';

import {
  DefaultAccessEditor,
  type DefaultAccessScopeControl,
} from '#components/default-access-editor';
import { FeedbackForm } from '#components/feedback-form';
import { PermissionFilter } from '#components/permission-filter';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '#components/ui/sheet';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '../authorization-client.js';
import { useCan } from '../use-can.js';
import type { DataRuleKind } from './data-rule-kinds.js';
import { useSubjectTitles } from './data-rule-subject-titles.js';
import { RuleSubjects } from './data-rule-subjects.js';
import {
  actionKey,
  editableRule,
  replaceRuleScope,
  resourceKey,
  ruleResourceLabels,
  ruleResources,
  ruleScopes,
  type DataRule,
  type ScopeSelection,
} from './default-access-model.js';
import { useSettingsLeave } from './hooks.js';
import { permissionFilterLabels } from './permission-filters.js';
import { permissionFilterFieldLabel } from './permission-workspace.js';
import { ConfirmAction, SettingsError } from './shared.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';

const EMPTY_RULE: DataRule = {
  key: '',
  resource: { type: '', id: '' },
  actions: [],
};

export interface DataRuleEditorProps {
  readonly kind: DataRuleKind;
  /** The rule being edited; absent while creating one. */
  readonly rule?: DataRule | undefined;
  readonly rules: readonly DataRule[];
  readonly catalog: AuthorizationOptionsResponse;
  /** The rule in one sentence, shown as the draft's preview. */
  readonly preview: (
    rule: DataRule,
    titles: ReadonlyMap<string, string>,
  ) => string;
  /** Closes the editor; the list's navigation guard asks before discarding a draft. */
  readonly onClose: () => void;
  /** After a save: the rule as the server answers it. Called before `onClose`. */
  readonly onSaved: (rule: DataRule) => void;
  readonly onDeleted: (rule: DataRule) => void;
  /** The rule changed on the server: reload the list. */
  readonly onStale: () => void;
}

/**
 * A data rule's form in a side sheet over its list, so creating, editing and deleting a rule never leaves the Data
 * rules tab and only the tab's own guard asks before a draft is discarded.
 */
export function DataRuleEditor({
  kind,
  rule: initial,
  rules,
  catalog,
  preview,
  onClose,
  onSaved,
  onDeleted,
  onStale,
}: DataRuleEditorProps): ReactElement {
  const creating = initial === undefined;
  const { t } = useTranslation();
  const k = (name: string, values?: Record<string, unknown>): string =>
    t(`settings.${kind.texts}.${name}`, values);
  const settings = useAuthorizationSettings();
  const api = useApiClient();
  const toaster = useToaster();
  const settingsResource = { type: 'settings', id: kind.settings };
  const canWrite = useCan({
    resource: settingsResource,
    action: creating ? 'create' : 'update',
  }).can;
  const canDelete = useCan({
    resource: settingsResource,
    action: 'delete',
  }).can;
  const [draft, setDraft] = useState<DataRule>();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:settings:${kind.key}:${initial?.key ?? ''}`,
  });
  const [requestBusy, setRequestBusy] = useState(false);
  const busy = requestBusy || submission.submitting;
  const [error, setError] = useState<unknown>();
  const [message, setMessage] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    key?: string;
    resource?: string;
  }>({});
  const [scopeErrors, setScopeErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string>();
  const [removing, setRemoving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const value = draft ?? initial ?? EMPTY_RULE;
  const dirty =
    draft !== undefined && JSON.stringify(draft) !== JSON.stringify(initial);
  const leave = useSettingsLeave(dirty, busy);
  const subjectTitles = useSubjectTitles(
    kind.path,
    value.subjects ?? [],
    catalog,
  );
  const text = (item: LocalizedText): string =>
    typeof item === 'string'
      ? item
      : t(item.key, {
          ns: item.ns,
          defaultValue: item.defaultValue ?? item.key,
        });
  const resources = ruleResources(catalog, settings.workspace);
  const resource = resources.find(
    (entry) => resourceKey(entry) === resourceKey(value.resource),
  );
  const scopes = ruleScopes(resource, catalog, settings.workspace);
  const supported = creating
    ? scopes.length > 0
    : editableRule(value, scopes, catalog);
  const readOnly = !canWrite || busy || (!creating && !supported);
  const resourceLabels = ruleResourceLabels(resources, text, (title, type) =>
    t('settings.defaultAccess.kindLabel', {
      title,
      kind: t(
        type === 'table'
          ? 'settings.defaultAccess.kindTable'
          : 'settings.defaultAccess.kindBusiness',
      ),
    }),
  );
  const options = resources
    .filter(
      (entry) =>
        !creating ||
        !kind.onePerResource ||
        !rules.some(
          (rule) => resourceKey(rule.resource) === resourceKey(entry),
        ),
    )
    .map((entry) => ({
      value: resourceKey(entry),
      label: resourceLabels.get(resourceKey(entry)) ?? text(entry.title),
    }));
  if (
    !creating &&
    !options.some((option) => option.value === resourceKey(value.resource))
  )
    options.push({
      value: resourceKey(value.resource),
      label: value.resource.id,
    });
  const invalidKey =
    !value.key.trim() ||
    ['options', 'subjects', 'records'].includes(value.key.trim());
  const noSubjects = kind.subjects && !value.subjects?.length;
  const fieldLabels: Record<string, string> = {
    name: t('settings.defaultAccess.fieldLabels.name'),
    id: t('settings.defaultAccess.fieldLabels.id'),
  };
  const filterLabels = {
    ...permissionFilterLabels((label, fallback) =>
      t(label, { defaultValue: fallback ?? label }),
    ),
    description: t('settings.defaultAccess.filterDescription'),
  };
  const controls: DefaultAccessScopeControl[] = scopes.map((scope) => {
    const selected = value.actions.find(
      (entry) => actionKey(entry) === scope.id,
    )?.selection;
    const selectedValue = selected ? JSON.stringify(selected) : '';
    const choices = [
      { value: '', label: k('none') },
      ...(kind.allowAll && !scope.recordAccess.includes('allRecords')
        ? [
            {
              value: JSON.stringify({ type: 'all' }),
              label: t('settings.defaultAccess.all'),
            },
          ]
        : []),
      ...scope.recordAccess
        // A sharing rule shares particular records, never all of them.
        .filter((preset) => kind.allowAll || preset !== 'allRecords')
        .map((preset) => ({
          value: JSON.stringify({ type: 'recordAccess', key: preset }),
          label: text(
            catalog.recordAccess.find((entry) => entry.key === preset)?.title ??
              preset,
          ),
        })),
    ];
    if (selected && !choices.some((choice) => choice.value === selectedValue))
      choices.push({
        value: selectedValue,
        label:
          selected.type === 'all'
            ? t('settings.defaultAccess.all')
            : selected.type === 'records'
              ? t('settings.defaultAccess.records', {
                  count: selected.ids.length,
                })
              : selected.key === 'customFilter'
                ? t('settings.defaultAccess.custom')
                : t('settings.defaultAccess.retained'),
      });
    const custom =
      selected?.type === 'recordAccess' && selected.key === 'customFilter';
    const params =
      custom && selected.params && typeof selected.params === 'object'
        ? (Reflect.get(selected.params, 'filter') as unknown)
        : undefined;
    return {
      id: scope.id,
      error: scopeErrors[scope.id],
      action: text(scope.actionTitle),
      actionId: scope.action,
      scope: text(scope.title),
      value: selectedValue,
      options: choices,
      configuration:
        custom || editing === scope.id ? (
          <PermissionFilter
            open={editing === scope.id}
            onOpenChange={(open) => setEditing(open ? scope.id : undefined)}
            value={params}
            fields={scope.fields.map((field) => ({
              value: field,
              label:
                fieldLabels[field] ??
                permissionFilterFieldLabel(
                  scope.collection,
                  field,
                  (key, fallback) => t(key, { defaultValue: fallback ?? key }),
                  settings.workspace,
                ),
            }))}
            labels={filterLabels}
            disabled={readOnly}
            onApply={(filter) => {
              setDraft(
                replaceRuleScope(value, scope, {
                  type: 'recordAccess',
                  key: 'customFilter',
                  params: { filter },
                }),
              );
              setScopeErrors((old) => ({ ...old, [scope.id]: '' }));
              setEditing(undefined);
            }}
          />
        ) : undefined,
    };
  });
  // Never discard entries no longer present in the live plugin catalog.
  for (const action of value.actions)
    if (!scopes.some((scope) => scope.id === actionKey(action)))
      controls.push({
        id: actionKey(action),
        action: action.action,
        actionId: action.action,
        scope: action.scopeKey ?? value.resource.id,
        value: JSON.stringify(action.selection),
        options: [
          {
            value: JSON.stringify(action.selection),
            label: t('settings.defaultAccess.retained'),
          },
        ],
      });

  const focusInvalid = (): void => {
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus(),
    );
  };
  /** Whether the stored rule is still the one the editor opened. */
  const unchanged = async (): Promise<boolean> => {
    const latest = await api.request<{ data: readonly DataRule[] }>({
      path: `authorization/${kind.path}`,
    });
    return (
      JSON.stringify(latest.data.find((rule) => rule.key === initial?.key)) ===
      JSON.stringify(initial)
    );
  };
  const body = (): Record<string, unknown> => {
    const title =
      typeof value.title === 'string' ? value.title.trim() : value.title;
    const reason = value.reason?.trim();
    if (creating)
      return {
        key: value.key.trim(),
        resource: value.resource,
        actions: value.actions,
        ...(kind.subjects
          ? {
              subjects: value.subjects ?? [],
              ...(title ? { title } : {}),
              ...(reason ? { reason } : {}),
            }
          : {}),
      };
    if (!kind.subjects) return { actions: value.actions };
    return {
      actions: value.actions,
      subjects: value.subjects ?? [],
      title: title || null,
      reason: reason || null,
    };
  };

  const save = async (): Promise<void> => {
    setSubmitted(true);
    setFieldErrors({});
    setScopeErrors({});
    setMessage(undefined);
    setError(undefined);
    if (
      invalidKey ||
      !resource ||
      noSubjects ||
      !supported ||
      !canWrite ||
      busy
    ) {
      focusInvalid();
      return;
    }
    setRequestBusy(true);
    try {
      const saved = await submission.run(
        { creating, key: initial?.key, value },
        async (idempotencyKey, _signal, _snapshot, recovering) => {
          if (!creating && !recovering && !(await unchanged())) {
            setMessage(k('changed'));
            return undefined;
          }
          return api.request<{ data: DataRule }>({
            path: creating
              ? `authorization/${kind.path}`
              : `authorization/${kind.path}/${encodeURIComponent(initial.key)}`,
            headers: { 'Idempotency-Key': idempotencyKey },
            method: creating ? 'POST' : 'PATCH',
            json: body(),
          });
        },
      );
      if (!saved) return;
      toaster.show({
        type: 'success',
        title: k('saved', { name: value.key }),
      });
      leave.allow();
      onSaved(saved.data);
      onClose();
    } catch (next) {
      if (
        next instanceof ApiClientError &&
        next.payload &&
        typeof next.payload === 'object'
      ) {
        const detail: unknown = Reflect.get(next.payload, 'error');
        const violations: unknown =
          detail && typeof detail === 'object'
            ? Reflect.get(detail, 'fieldViolations')
            : undefined;
        if (Array.isArray(violations)) {
          const errors: { key?: string; resource?: string } = {};
          const nextScopeErrors: Record<string, string> = {};
          for (const violation of violations) {
            const field: unknown =
              violation && typeof violation === 'object'
                ? Reflect.get(violation, 'field')
                : undefined;
            if (field === 'key')
              errors.key = t('settings.defaultAccess.keyRequired');
            else if (typeof field === 'string' && field.startsWith('resource'))
              errors.resource = t('settings.defaultAccess.resourceRequired');
            else if (typeof field === 'string') {
              const index = /^actions\.(\d+)(?:\.|$)/.exec(field);
              const entry = index ? value.actions[Number(index[1])] : undefined;
              if (entry)
                nextScopeErrors[actionKey(entry)] = t(
                  'settings.defaultAccess.scopeInvalid',
                );
            }
          }
          setFieldErrors(errors);
          setScopeErrors(nextScopeErrors);
          focusInvalid();
        }
      }
      const reason: unknown =
        next && typeof next === 'object'
          ? Reflect.get(next, 'reason')
          : undefined;
      if (
        reason === 'DEFAULT_ACCESS_CONFLICT' ||
        reason === 'RULE_ALREADY_EXISTS'
      )
        setMessage(k('duplicate'));
      else if (
        reason === 'INVALID_AUTHORIZATION_INPUT' ||
        reason === 'INVALID_INPUT'
      )
        setMessage(t('settings.defaultAccess.invalid'));
      else setError(next);
    } finally {
      setRequestBusy(false);
    }
  };

  const remove = async (): Promise<void> => {
    if (!initial || busy) return;
    setRequestBusy(true);
    setError(undefined);
    try {
      const outcome = await submission.run(
        { delete: initial.key },
        async (idempotencyKey, _signal, _snapshot, recovering) => {
          if (!recovering && !(await unchanged())) {
            setRemoving(false);
            setMessage(t('settings.defaultAccess.deleteChanged'));
            return undefined;
          }
          await api.request({
            path: `authorization/${kind.path}/${encodeURIComponent(initial.key)}`,
            method: 'DELETE',
            headers: { 'Idempotency-Key': idempotencyKey },
          });
          return true;
        },
      );
      if (!outcome) return;
      setRemoving(false);
      toaster.show({
        type: 'success',
        title: k('deleted', { name: initial.key }),
      });
      leave.allow();
      onDeleted(initial);
      onClose();
    } catch (next) {
      setError(next);
    } finally {
      setRequestBusy(false);
    }
  };

  const titleValue =
    typeof value.title === 'string'
      ? value.title
      : value.title
        ? text(value.title)
        : '';

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        // Closing is a navigation: the list's guard asks once before a draft is discarded.
        if (!open && !busy) onClose();
      }}
    >
      <SheetContent
        side='right'
        className='flex w-full flex-col gap-0 p-0 sm:max-w-xl'
        data-slot='data-rule-editor'
      >
        <SheetHeader className='border-b'>
          <SheetTitle>{k(creating ? 'new' : 'edit')}</SheetTitle>
          <SheetDescription>{k('description')}</SheetDescription>
        </SheetHeader>
        <FeedbackForm
          submitting={busy}
          error={error}
          errorContent={<SettingsError error={error} inline />}
          ref={formRef}
          noValidate
          className='flex min-h-0 flex-1 flex-col'
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className='flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4'>
            {message && (
              <Alert variant='destructive'>
                <AlertDescription>
                  {message}
                  {!creating && (
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setDraft(undefined);
                        setMessage(undefined);
                        onStale();
                      }}
                    >
                      {t('settings.defaultAccess.reload')}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {!creating && !supported && (
              <p className='text-sm text-muted-foreground'>
                {t('settings.defaultAccess.unsupported')}
              </p>
            )}
            {creating && !options.length && (
              <p className='text-sm text-muted-foreground'>
                {k('noResources')}
              </p>
            )}
            {kind.subjects && (
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor={`${kind.key}-title`}>{k('name')}</Label>
                <Input
                  id={`${kind.key}-title`}
                  value={titleValue}
                  placeholder={k('namePlaceholder')}
                  disabled={readOnly}
                  onChange={(event) =>
                    setDraft({ ...value, title: event.target.value })
                  }
                />
              </div>
            )}
            <DefaultAccessEditor
              ruleKey={value.key}
              resource={value.resource.type ? resourceKey(value.resource) : ''}
              resources={options}
              scopes={controls}
              existing={!creating}
              readOnly={readOnly}
              keyError={
                submitted && invalidKey
                  ? t('settings.defaultAccess.keyRequired')
                  : fieldErrors.key
              }
              resourceError={
                submitted && !resource
                  ? t('settings.defaultAccess.resourceRequired')
                  : fieldErrors.resource
              }
              labels={{
                key: t('settings.key'),
                resource: t('settings.defaultAccess.resource'),
                chooseResource: t('settings.defaultAccess.chooseResource'),
                action: t('settings.defaultAccess.action'),
                scope: k('scope'),
                noScopes: t('settings.defaultAccess.chooseResource'),
              }}
              onKeyChange={(key) => {
                setDraft({ ...value, key });
                setFieldErrors((old) => {
                  const { key: _key, ...next } = old;
                  return next;
                });
              }}
              onResourceChange={(selected) => {
                const next = resources.find(
                  (entry) => resourceKey(entry) === selected,
                );
                if (next) {
                  setDraft({
                    ...value,
                    resource: { type: next.type, id: next.id },
                    actions: [],
                  });
                  setEditing(undefined);
                  setFieldErrors({});
                  setScopeErrors({});
                }
              }}
              onScopeChange={(id, next) => {
                const scope = scopes.find((item) => item.id === id);
                if (!scope) return;
                setScopeErrors((old) => ({ ...old, [id]: '' }));
                const selection = next
                  ? (JSON.parse(next) as ScopeSelection)
                  : undefined;
                if (
                  selection?.type === 'recordAccess' &&
                  selection.key === 'customFilter' &&
                  !('params' in selection)
                )
                  setEditing(id);
                else setDraft(replaceRuleScope(value, scope, selection));
              }}
            />
            <p className='-mt-3 text-xs text-muted-foreground'>
              {k('scopeHint')}
            </p>
            {kind.subjects && (
              <RuleSubjects
                kind={kind}
                catalog={catalog}
                value={value.subjects ?? []}
                titles={subjectTitles}
                readOnly={readOnly}
                error={
                  submitted && noSubjects ? k('subjectsRequired') : undefined
                }
                onChange={(subjects) => setDraft({ ...value, subjects })}
              />
            )}
            {kind.subjects && (
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor={`${kind.key}-reason`}>{k('reason')}</Label>
                <Input
                  id={`${kind.key}-reason`}
                  value={value.reason ?? ''}
                  placeholder={k('reasonPlaceholder')}
                  disabled={readOnly}
                  onChange={(event) =>
                    setDraft({ ...value, reason: event.target.value })
                  }
                />
              </div>
            )}
            {kind.subjects && value.resource.type ? (
              <div
                className='rounded-lg border bg-muted/40 px-3 py-2 text-sm'
                data-slot='data-rule-preview'
              >
                <div className='text-xs text-muted-foreground'>
                  {t('settings.ruleSubjects.preview')}
                </div>
                {preview(value, subjectTitles)}
              </div>
            ) : null}
          </div>
          <SheetFooter className='flex-row flex-wrap justify-end border-t'>
            {!creating && canDelete && (
              <Button
                type='button'
                variant='ghost'
                className='me-auto text-destructive'
                disabled={busy}
                onClick={() => setRemoving(true)}
              >
                {t('settings.defaultAccess.delete')}
              </Button>
            )}
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={onClose}
            >
              {t('settings.cancel')}
            </Button>
            {canWrite && (
              <Button type='submit' disabled={busy || !dirty || !supported}>
                {t(busy ? 'settings.saving' : 'settings.save')}
              </Button>
            )}
          </SheetFooter>
        </FeedbackForm>
        <ConfirmAction
          error={<SettingsError error={error} />}
          open={removing}
          title={k('deleteTitle', { name: initial?.key ?? '' })}
          description={k('deleteHint')}
          confirmLabel={t('settings.defaultAccess.delete')}
          busy={busy}
          onCancel={() => {
            setRemoving(false);
            setError(undefined);
          }}
          onConfirm={() => void remove()}
        />
        {leave.dialog}
      </SheetContent>
    </Sheet>
  );
}
