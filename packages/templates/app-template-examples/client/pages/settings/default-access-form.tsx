import { FeedbackForm } from '#components/feedback-form';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useSubmission } from '@nocobase/app-client';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import {
  useCan,
  type AuthorizationOptionsResponse,
  type LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useRef, useState, type ReactElement } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteChildPage } from '#components/route-child-page';
import {
  DefaultAccessEditor,
  type DefaultAccessScopeControl,
} from '#components/default-access-editor';
import { PermissionFilter } from '#components/permission-filter';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { SettingsError, SettingsLoading } from './shared.js';
import { useSettingsData, useSettingsLeave } from './hooks.js';
import { permissionFilterLabels } from './permission-filters.js';
import { permissionFilterFieldLabel } from './permission-workspace.js';
import {
  actionKey,
  resourceKey,
  ruleResources,
  ruleScopes,
  replaceRuleScope,
  editableRule,
  type DefaultAccessRule,
  type ScopeSelection,
} from './default-access-model.js';

function DefaultAccessFormBody(): ReactElement {
  const { key } = useParams();
  const creating = key === undefined;
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const parent = useOutletContext<{
    reload: () => void;
    saved: (rule: DefaultAccessRule) => void;
  }>();
  const rules = useSettingsData<{ data: readonly DefaultAccessRule[] }>(
    'authorization/defaultAccess',
  );
  const catalog = useSettingsData<{ data: AuthorizationOptionsResponse }>(
    'authorization/defaultAccess/options',
  );
  const canWrite = useCan({
    resource: { type: 'settings', id: 'authorization.default-access' },
    action: creating ? 'create' : 'update',
  }).can;
  const [draft, setDraft] = useState<DefaultAccessRule>();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:settings:default-access:${key}`,
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
  const formRef = useRef<HTMLFormElement>(null);
  const initial = creating
    ? undefined
    : rules.data?.data.find((rule) => rule.key === key);
  const value = draft ??
    initial ?? { key: '', resource: { type: '', id: '' }, actions: [] };
  const dirty =
    draft !== undefined && JSON.stringify(draft) !== JSON.stringify(initial);
  const leave = useSettingsLeave(dirty, busy);
  const close = () => {
    void navigate(
      { pathname: '/default-access', search: location.search },
      { replace: true },
    );
  };
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const resources = catalog.data ? ruleResources(catalog.data.data) : [];
  const resource = resources.find(
    (entry) => resourceKey(entry) === resourceKey(value.resource),
  );
  const scopes = catalog.data ? ruleScopes(resource, catalog.data.data) : [];
  const supported = creating
    ? scopes.length > 0
    : Boolean(catalog.data && editableRule(value, scopes, catalog.data.data));
  const readOnly = !canWrite || busy || (!creating && !supported);
  const options = resources
    .filter(
      (entry) =>
        !creating ||
        !rules.data?.data.some(
          (rule) => resourceKey(rule.resource) === resourceKey(entry),
        ),
    )
    .map((entry) => ({ value: resourceKey(entry), label: text(entry.title) }));
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
  const fieldLabels: Record<string, string> = {
    name: t('settings.defaultAccess.fieldLabels.name'),
    id: t('settings.defaultAccess.fieldLabels.id'),
  };
  const labels = {
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
      { value: '', label: t('settings.defaultAccess.none') },
      ...(!scope.recordAccess.includes('allRecords')
        ? [
            {
              value: JSON.stringify({ type: 'all' }),
              label: t('settings.defaultAccess.all'),
            },
          ]
        : []),
      ...scope.recordAccess.map((preset) => ({
        value: JSON.stringify({ type: 'recordAccess', key: preset }),
        label: text(
          catalog.data?.data.recordAccess.find((entry) => entry.key === preset)
            ?.title ?? preset,
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
                ),
            }))}
            labels={labels}
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
  const save = async () => {
    setSubmitted(true);
    setFieldErrors({});
    setScopeErrors({});
    setMessage(undefined);
    setError(undefined);
    if (invalidKey || !resource || !supported || !canWrite || busy) {
      requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    setRequestBusy(true);
    try {
      const saved = await submission.run(
        { creating, key, value },
        async (idempotencyKey, _signal, _snapshot, recovering) => {
          if (!creating && !recovering) {
            const latest = await api.request<{
              data: readonly DefaultAccessRule[];
            }>({ path: 'authorization/defaultAccess' });
            if (
              JSON.stringify(latest.data.find((rule) => rule.key === key)) !==
              JSON.stringify(initial)
            ) {
              setMessage(t('settings.defaultAccess.changed'));
              return undefined;
            }
          }
          return api.request<{ data: DefaultAccessRule }>({
            path: creating
              ? 'authorization/defaultAccess'
              : `authorization/defaultAccess/${encodeURIComponent(key ?? '')}`,
            headers: { 'Idempotency-Key': idempotencyKey },
            method: creating ? 'POST' : 'PATCH',
            json: creating
              ? { ...value, key: value.key.trim() }
              : { actions: value.actions },
          });
        },
      );
      if (!saved) return;
      toaster.show({
        type: 'success',
        title: t('settings.defaultAccess.saved', { name: value.key }),
      });
      leave.allow();
      parent.saved(saved.data);
      close();
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
          const scopeErrors: Record<string, string> = {};
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
                scopeErrors[actionKey(entry)] = t(
                  'settings.defaultAccess.scopeInvalid',
                );
            }
          }
          setFieldErrors(errors);
          setScopeErrors(scopeErrors);
          requestAnimationFrame(() =>
            formRef.current
              ?.querySelector<HTMLElement>('[aria-invalid="true"]')
              ?.focus(),
          );
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
        setMessage(t('settings.defaultAccess.duplicate'));
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
  return (
    <PageContainer className='max-w-4xl'>
      <PageHeader
        title={t(
          creating
            ? 'settings.defaultAccess.new'
            : 'settings.defaultAccess.edit',
        )}
        description={t('settings.defaultAccess.description')}
      />
      <SettingsError
        error={rules.error || catalog.error}
        retry={() => {
          rules.reload();
          catalog.reload();
        }}
      />
      {(rules.loading && !rules.data) || (catalog.loading && !catalog.data) ? (
        <SettingsLoading />
      ) : (
        !rules.error &&
        !catalog.error && (
          <>
            {!creating && !initial ? (
              <p role='status'>{t('settings.missing')}</p>
            ) : (
              <FeedbackForm
                submitting={busy}
                error={error}
                errorContent={<SettingsError error={error} inline />}
                ref={formRef}
                noValidate
                className='flex flex-col gap-6'
                onSubmit={(event) => {
                  event.preventDefault();
                  void save();
                }}
              >
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
                            rules.reload();
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
                    {t('settings.defaultAccess.noResources')}
                  </p>
                )}
                <DefaultAccessEditor
                  ruleKey={value.key}
                  resource={
                    value.resource.type ? resourceKey(value.resource) : ''
                  }
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
                    scope: t('settings.defaultAccess.scope'),
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
                    const resource = resources.find(
                      (entry) => resourceKey(entry) === selected,
                    );
                    if (resource) {
                      setDraft({
                        ...value,
                        resource: { type: resource.type, id: resource.id },
                        actions: [],
                      });
                      setEditing(undefined);
                      setFieldErrors({});
                      setScopeErrors({});
                    }
                  }}
                  onScopeChange={(id, next) => {
                    const scope = scopes.find((scope) => scope.id === id);
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
                <div className='flex justify-end gap-2 border-t pt-4'>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={busy}
                    onClick={() => {
                      void Promise.resolve(leave.guard()).then((allowed) => {
                        if (allowed) close();
                      });
                    }}
                  >
                    {t('settings.cancel')}
                  </Button>
                  {canWrite && (
                    <Button
                      type='submit'
                      disabled={busy || !dirty || !supported}
                    >
                      {t(busy ? 'settings.saving' : 'settings.save')}
                    </Button>
                  )}
                </div>
              </FeedbackForm>
            )}
            {!creating && !initial && (
              <Button variant='outline' onClick={close}>
                {t('settings.defaultAccess.back')}
              </Button>
            )}
          </>
        )
      )}
      {leave.dialog}
    </PageContainer>
  );
}
export default function DefaultAccessForm(): ReactElement {
  const { key } = useParams();
  return (
    <RouteChildPage>
      <DefaultAccessFormBody key={key ?? 'create'} />
    </RouteChildPage>
  );
}
