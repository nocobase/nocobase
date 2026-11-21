import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { CheckIcon, XIcon } from 'lucide-react';
import {
  Suspense,
  createElement,
  use,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Link, useResolvedPath, useSearchParams } from 'react-router';

import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';
import type {
  AuthorizationDecision,
  AuthorizationInspection,
  AuthorizationOptionsResponse,
  AuthorizationSubject,
  ConfiguredAccess,
  ConfiguredCredential,
  SubjectOption,
} from '../authorization-client.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import { AuthorizationPage } from './authorization-page.js';
import {
  DEFAULT_ACCESS_RULES,
  RESTRICTION_RULES,
  SHARING_RULES,
  type DataRuleKind,
} from './data-rule-kinds.js';
import type { DataRule } from './default-access-model.js';
import { useLocalizedText } from './localized-text.js';
import {
  checkResourceKey,
  checkResources,
  matchedSources,
  matchingRules,
  type CheckResource,
} from './permission-check-model.js';
import type {
  AuthorizationCheckSubject,
  AuthorizationCheckSubjectPickerProps,
} from './extensions.js';
import { SettingsError, SettingsLoading } from './shared.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';
import { PERMISSION_CHECK_TAB } from './tab-keys.js';

/** The surface whose catalog and user directory the page reads; it answers only an unrestricted viewer. */
const SURFACE = 'inspector';
const RULE_KINDS = [DEFAULT_ACCESS_RULES, SHARING_RULES, RESTRICTION_RULES];

/**
 * Why someone can or cannot see or change something: pick a user, then read everything the user may do with the role
 * each permission comes from, or check one operation step by step. It only reads; nothing is changed.
 */
export default function PermissionCheckPage(): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const authz = useAuthorizationClient();
  const [params, setParams] = useSearchParams();
  const text = useLocalizedText();
  const settings = useAuthorizationSettings();
  const kinds = useSyncExternalStore(
    settings.checkSubjects.subscribe,
    settings.checkSubjects.list,
  );
  // A member by default; `as` names another kind of subject a plugin added, such as an API key.
  const kind = kinds.find((entry) => entry.key === params.get('as'));
  const userId = (kind ? params.get('subject') : params.get('user')) ?? '';
  const mode = params.get('mode') === 'check' ? 'check' : 'all';
  const [catalog, setCatalog] = useState<AuthorizationOptionsResponse>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let active = true;
    authz.loadOptions(SURFACE).then(
      (next) => {
        if (active) setCatalog(next);
      },
      (next: unknown) => {
        if (active) setError(next);
      },
    );
    return () => {
      active = false;
    };
  }, [authz]);
  const update = (values: Record<string, string | undefined>) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      for (const [name, value] of Object.entries(values))
        if (value) next.set(name, value);
        else next.delete(name);
      return next;
    });

  return (
    <AuthorizationPage
      tab={PERMISSION_CHECK_TAB}
      description={t('settings.permissionCheck.description')}
    >
      <SettingsError error={error} />
      {!catalog ? (
        error ? null : (
          <SettingsLoading />
        )
      ) : (
        <div className='flex flex-col gap-6'>
          {kinds.length > 0 && (
            <Tabs
              value={kind?.key ?? MEMBER_KIND}
              onValueChange={(next) =>
                update({
                  as: next === MEMBER_KIND ? undefined : String(next),
                  user: undefined,
                  subject: undefined,
                })
              }
            >
              <TabsList aria-label={t('settings.permissionCheck.subjectKind')}>
                <TabsTrigger value={MEMBER_KIND}>
                  {t('settings.permissionCheck.member')}
                </TabsTrigger>
                {kinds.map((entry) => (
                  <TabsTrigger key={entry.key} value={entry.key}>
                    {text(entry.title)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
          {kind ? (
            <Suspense fallback={<SettingsLoading />}>
              <SubjectPicker
                kind={kind}
                value={userId}
                onChange={(id) => update({ subject: id })}
              />
            </Suspense>
          ) : (
            <UserPicker
              value={userId}
              onChange={(id) => update({ user: id })}
            />
          )}
          {userId ? (
            <>
              <Tabs
                value={mode}
                onValueChange={(next) => {
                  if (next === 'all' || next === 'check')
                    update({ mode: next === 'check' ? 'check' : undefined });
                }}
              >
                <TabsList aria-label={t('settings.permissionCheck.mode')}>
                  <TabsTrigger value='all'>
                    {t('settings.permissionCheck.all')}
                  </TabsTrigger>
                  <TabsTrigger value='check'>
                    {t('settings.permissionCheck.one')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <UserAccess
                key={`${kind?.type ?? 'user'}:${userId}`}
                subject={{ type: kind?.type ?? 'user', id: userId }}
                catalog={catalog}
                mode={mode}
                resource={params.get('resource') ?? ''}
                action={params.get('action') ?? ''}
                onPick={(resource, action) => update({ resource, action })}
              />
            </>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('settings.permissionCheck.pickUser')}
            </p>
          )}
        </div>
      )}
    </AuthorizationPage>
  );
}

const MEMBER_KIND = '$member';

const pickerModules = new WeakMap<
  AuthorizationCheckSubject['picker'],
  Promise<{
    readonly default: ComponentType<AuthorizationCheckSubjectPickerProps>;
  }>
>();

/** The picker a plugin registered for its kind of subject, loaded when it is chosen. */
function SubjectPicker({
  kind,
  value,
  onChange,
}: {
  readonly kind: AuthorizationCheckSubject;
  readonly value: string;
  readonly onChange: (id: string | undefined) => void;
}): ReactElement {
  let module = pickerModules.get(kind.picker);
  if (!module) {
    module = kind.picker();
    pickerModules.set(kind.picker, module);
  }
  return createElement(use(module).default, { value, onChange });
}

function UserPicker({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (id: string | undefined) => void;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const authz = useAuthorizationClient();
  const [chosen, setChosen] = useState<SubjectOption>();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{
    readonly key: string;
    readonly items: readonly SubjectOption[];
  }>();
  const [error, setError] = useState<unknown>();
  const search = query.trim();

  useEffect(() => {
    if (!value) return;
    if (chosen?.id === value) return;
    let active = true;
    authz.resolveSubjects(SURFACE, 'user', [value]).then(
      (found) => {
        if (active) setChosen(found[0] ?? { id: value, title: value });
      },
      () => {
        if (active) setChosen({ id: value, title: value });
      },
    );
    return () => {
      active = false;
    };
  }, [authz, chosen?.id, value]);

  useEffect(() => {
    if (value) return;
    let active = true;
    // Searching waits for a pause in typing, so each keystroke does not send a request.
    const timer = setTimeout(() => {
      authz
        .listSubjects(SURFACE, 'user', {
          ...(search ? { search } : {}),
          page: 1,
          pageSize: 10,
        })
        .then(
          (page) => {
            if (!active) return;
            setError(undefined);
            setResult({ key: search, items: page.items });
          },
          (next: unknown) => {
            if (active) setError(next);
          },
        );
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [authz, search, value]);

  if (value)
    return (
      <div className='flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3'>
        <div className='min-w-0'>
          <div className='text-xs text-muted-foreground'>
            {t('settings.permissionCheck.user')}
          </div>
          <div className='truncate font-medium' data-slot='checked-user'>
            {chosen?.id === value ? text(chosen.title) : value}
          </div>
          {chosen?.id === value && chosen.description !== undefined && (
            <div className='truncate text-xs text-muted-foreground'>
              {text(chosen.description)}
            </div>
          )}
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='ms-auto'
          onClick={() => {
            setChosen(undefined);
            onChange(undefined);
          }}
        >
          {t('settings.permissionCheck.changeUser')}
        </Button>
      </div>
    );
  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor='permission-check-user'>
        {t('settings.permissionCheck.user')}
      </Label>
      <Input
        id='permission-check-user'
        type='search'
        value={query}
        placeholder={t('settings.permissionCheck.searchUser')}
        onChange={(event) => setQuery(event.target.value)}
      />
      <SettingsError error={error} />
      {!result || result.key !== search ? (
        error ? null : (
          <SettingsLoading />
        )
      ) : result.items.length === 0 ? (
        <p className='py-4 text-sm text-muted-foreground'>
          {t('settings.permissionCheck.noUsers')}
        </p>
      ) : (
        <ul className='max-h-72 divide-y overflow-y-auto rounded-lg border'>
          {result.items.map((item) => (
            <li key={item.id}>
              <button
                type='button'
                className='flex w-full flex-col items-start px-3 py-2 text-start hover:bg-muted'
                onClick={() => {
                  setChosen(item);
                  onChange(item.id);
                }}
              >
                <span className='text-sm font-medium'>{text(item.title)}</span>
                {item.description !== undefined && (
                  <span className='text-xs text-muted-foreground'>
                    {text(item.description)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The roles a user holds, and either every permission or one operation checked step by step. */
function UserAccess({
  subject,
  catalog,
  mode,
  resource,
  action,
  onPick,
}: {
  readonly subject: AuthorizationSubject;
  readonly catalog: AuthorizationOptionsResponse;
  readonly mode: 'all' | 'check';
  readonly resource: string;
  readonly action: string;
  readonly onPick: (resource: string, action: string) => void;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const authz = useAuthorizationClient();
  const [configured, setConfigured] = useState<ConfiguredAccess>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let active = true;
    authz.inspectConfigured(subject).then(
      (next) => {
        if (active) setConfigured(next);
      },
      (next: unknown) => {
        if (active) setError(next);
      },
    );
    return () => {
      active = false;
    };
  }, [authz, subject]);
  const roleTitle = (key: string): string => {
    const set = configured?.sets?.find((item) => item.key === key);
    return set?.title === undefined ? key : text(set.title);
  };
  if (error) return <SettingsError error={error} />;
  if (!configured) return <SettingsLoading />;
  return (
    <div className='flex flex-col gap-6'>
      <section className='flex flex-col gap-2'>
        <h3 className='text-sm font-medium'>
          {t('settings.permissionCheck.roles')}
        </h3>
        {configured.unrestricted && (
          <p className='text-sm text-muted-foreground'>
            {t('settings.permissionCheck.unrestricted')}
          </p>
        )}
        {configured.sets?.length ? (
          <ul className='flex flex-wrap gap-1.5' data-slot='checked-roles'>
            {configured.sets.map((set) => (
              <li key={set.key}>
                <Badge variant='secondary'>{roleTitle(set.key)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('settings.permissionCheck.noRoles')}
          </p>
        )}
      </section>
      {configured.credential ? (
        <CredentialSummary credential={configured.credential} />
      ) : null}
      {mode === 'all' ? (
        <AllPermissions
          subject={subject}
          catalog={catalog}
          roleTitle={roleTitle}
        />
      ) : (
        <CheckOne
          subject={subject}
          catalog={catalog}
          configured={configured}
          roleTitle={roleTitle}
          resource={resource}
          action={action}
          onPick={onPick}
        />
      )}
    </div>
  );
}

/** Who a decision's grants come from, such as "from Sales". */
function useSourceLabel(
  roleTitle: (key: string) => string,
): (decision: AuthorizationDecision) => string {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  return (decision) => {
    const sources = matchedSources(decision);
    const roles = sources
      .filter((source) => source.plugin === 'permission-sets')
      .map((source) => roleTitle(source.id));
    const rules = sources.filter(
      (source) => source.plugin !== 'permission-sets',
    );
    return [
      ...(roles.length
        ? [t('settings.permissionCheck.fromRoles', { roles: roles.join(', ') })]
        : []),
      ...(rules.length
        ? [
            t('settings.permissionCheck.fromRules', {
              rules: rules.map((source) => source.id).join(', '),
            }),
          ]
        : []),
    ].join(' · ');
  };
}

function AllPermissions({
  subject,
  catalog,
  roleTitle,
}: {
  readonly subject: AuthorizationSubject;
  readonly catalog: AuthorizationOptionsResponse;
  readonly roleTitle: (key: string) => string;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const authz = useAuthorizationClient();
  const source = useSourceLabel(roleTitle);
  const resources = useMemo(() => checkResources(catalog), [catalog]);
  const [inspections, setInspections] =
    useState<ReadonlyMap<string, AuthorizationInspection>>();
  const [error, setError] = useState<unknown>();
  useEffect(() => {
    let active = true;
    const checks = resources.flatMap((resource) =>
      resource.actions.map((entry) => ({
        resource: { type: resource.type, id: resource.id },
        action: entry.name,
      })),
    );
    void (async () => {
      try {
        const found = new Map<string, AuthorizationInspection>();
        // The inspector decides at most 100 checks a request.
        for (let start = 0; start < checks.length; start += 100)
          for (const inspection of await authz.inspectBatch(
            subject,
            checks.slice(start, start + 100),
          ))
            found.set(
              `${checkResourceKey(inspection.resource)}.${inspection.action}`,
              inspection,
            );
        if (active) setInspections(found);
      } catch (next) {
        if (active) setError(next);
      }
    })();
    return () => {
      active = false;
    };
  }, [authz, resources, subject]);
  if (error) return <SettingsError error={error} />;
  if (!inspections) return <SettingsLoading />;
  const rows = resources
    .map((resource) => ({
      resource,
      allowed: resource.actions.flatMap((entry) => {
        const inspection = inspections.get(
          `${checkResourceKey(resource)}.${entry.name}`,
        );
        return inspection && inspection.decision.effect !== 'deny'
          ? [{ entry, inspection }]
          : [];
      }),
    }))
    .filter((row) => row.allowed.length);
  return (
    <section className='flex flex-col gap-2'>
      <h3 className='text-sm font-medium'>
        {t('settings.permissionCheck.allowed')}
      </h3>
      {rows.length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('settings.permissionCheck.nothing')}
        </p>
      ) : (
        <ul className='divide-y rounded-lg border' data-slot='allowed-list'>
          {rows.map(({ resource, allowed }) => (
            <li
              key={checkResourceKey(resource)}
              className='flex flex-col gap-1.5 px-4 py-3'
            >
              <div className='flex flex-wrap items-baseline gap-2'>
                <span className='font-medium'>{text(resource.title)}</span>
                <span className='text-xs text-muted-foreground'>
                  {text(resource.section)}
                </span>
              </div>
              <ul className='flex flex-col gap-1 text-sm'>
                {allowed.map(({ entry, inspection }) => (
                  <li key={entry.name} className='flex flex-wrap gap-x-2'>
                    <span>{text(entry.title)}</span>
                    {inspection.decision.effect === 'conditional' && (
                      <Badge variant='outline'>
                        {t('settings.permissionCheck.withinScope')}
                      </Badge>
                    )}
                    <span className='text-muted-foreground'>
                      {source(inspection.decision)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CheckOne({
  subject,
  catalog,
  configured,
  roleTitle,
  resource: resourceValue,
  action,
  onPick,
}: {
  readonly subject: AuthorizationSubject;
  readonly catalog: AuthorizationOptionsResponse;
  readonly configured: ConfiguredAccess;
  readonly roleTitle: (key: string) => string;
  readonly resource: string;
  readonly action: string;
  readonly onPick: (resource: string, action: string) => void;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const authz = useAuthorizationClient();
  const resources = useMemo(() => checkResources(catalog), [catalog]);
  const resource = resources.find(
    (entry) => checkResourceKey(entry) === resourceValue,
  );
  const actionEntry = resource?.actions.find((entry) => entry.name === action);
  const [decision, setDecision] = useState<{
    readonly key: string;
    readonly value: AuthorizationDecision;
  }>();
  const [error, setError] = useState<unknown>();
  const key = `${resourceValue}.${action}`;
  useEffect(() => {
    if (!resource || !actionEntry) return;
    let active = true;
    authz
      .inspect({
        subject,
        resource: { type: resource.type, id: resource.id },
        action: actionEntry.name,
      })
      .then(
        (value) => {
          if (!active) return;
          setError(undefined);
          setDecision({ key, value });
        },
        (next: unknown) => {
          if (active) setError(next);
        },
      );
    return () => {
      active = false;
    };
  }, [actionEntry, authz, key, resource, subject]);
  const resourceItems = resources.map((entry) => ({
    value: checkResourceKey(entry),
    label: `${text(entry.title)} · ${text(entry.section)}`,
  }));
  const actionItems = (resource?.actions ?? []).map((entry) => ({
    value: entry.name,
    label: text(entry.title),
  }));
  const current = decision?.key === key ? decision.value : undefined;
  const holders = [subject, ...(configured.identity?.subjects ?? [])];
  return (
    <section className='flex flex-col gap-4'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='permission-check-resource'>
            {t('settings.permissionCheck.object')}
          </Label>
          <Select
            value={resource ? resourceValue : null}
            items={resourceItems}
            onValueChange={(next) => {
              if (typeof next !== 'string') return;
              const picked = resources.find(
                (entry) => checkResourceKey(entry) === next,
              );
              onPick(next, picked?.actions[0]?.name ?? '');
            }}
          >
            <SelectTrigger id='permission-check-resource' className='w-full'>
              <SelectValue
                placeholder={t('settings.permissionCheck.chooseObject')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {resourceItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='permission-check-action'>
            {t('settings.permissionCheck.action')}
          </Label>
          <Select
            value={actionEntry ? action : null}
            items={actionItems}
            disabled={!resource}
            onValueChange={(next) => {
              if (typeof next === 'string') onPick(resourceValue, next);
            }}
          >
            <SelectTrigger id='permission-check-action' className='w-full'>
              <SelectValue
                placeholder={t('settings.permissionCheck.chooseAction')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {actionItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <SettingsError error={error} />
      {resource && actionEntry ? (
        current ? (
          <Verdict
            decision={current}
            resource={resource}
            action={actionEntry.name}
            actionTitle={text(actionEntry.title)}
            roleTitle={roleTitle}
            holders={holders}
            credential={configured.credential}
          />
        ) : error ? null : (
          <SettingsLoading />
        )
      ) : null}
    </section>
  );
}

function Verdict({
  decision,
  resource,
  action,
  actionTitle,
  roleTitle,
  holders,
  credential,
}: {
  readonly decision: AuthorizationDecision;
  readonly resource: CheckResource;
  readonly action: string;
  readonly actionTitle: string;
  readonly roleTitle: (key: string) => string;
  readonly holders: readonly AuthorizationSubject[];
  readonly credential?: ConfiguredCredential | undefined;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const allowed = decision.effect !== 'deny';
  // A credential's own step comes first: it narrows whatever the roles and rules then give.
  const first = credential ? 2 : 1;
  const roles = matchedSources(decision).filter(
    (source) => source.plugin === 'permission-sets',
  );
  const names = { action: actionTitle, object: text(resource.title) };
  const rolesPath = useResolvedPath('../roles').pathname;
  return (
    <div className='flex flex-col gap-4'>
      <div
        role='status'
        data-slot='permission-verdict'
        data-effect={decision.effect}
        className={
          allowed
            ? 'flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 font-medium'
            : 'flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 font-medium text-destructive'
        }
      >
        {allowed ? (
          <CheckIcon className='size-4' />
        ) : (
          <XIcon className='size-4' />
        )}
        {decision.effect === 'permit'
          ? t('settings.permissionCheck.can', names)
          : decision.effect === 'conditional'
            ? t('settings.permissionCheck.canWithin', names)
            : t('settings.permissionCheck.cannot', names)}
      </div>
      <ol className='flex flex-col gap-3'>
        {credential ? (
          <Step index={1} title={t('settings.permissionCheck.key.step')}>
            <CredentialStep
              credential={credential}
              resource={resource}
              action={action}
            />
          </Step>
        ) : null}
        <Step index={first} title={t('settings.permissionCheck.stepRole')}>
          {roles.length ? (
            // Each role opens in Roles, where the permission it gives can be read and changed.
            <span className='flex flex-wrap items-center gap-1.5'>
              {t('settings.permissionCheck.stepRoleBy')}{' '}
              {roles.map((source) => (
                <Link
                  key={source.id}
                  data-slot='permission-step-role'
                  className='rounded bg-muted px-1.5 text-xs leading-5 text-foreground underline-offset-4 hover:underline'
                  title={t('settings.permissionCheck.openRole')}
                  to={{
                    pathname: `${rolesPath}/${encodeURIComponent(source.id)}/edit`,
                  }}
                >
                  {roleTitle(source.id)}
                </Link>
              ))}
            </span>
          ) : (
            t('settings.permissionCheck.stepRoleNone')
          )}
        </Step>
        {RULE_KINDS.map((kind, index) => (
          <RuleStep
            key={kind.key}
            index={index + first + 1}
            kind={kind}
            resource={resource}
            action={action}
            holders={holders}
          />
        ))}
      </ol>
      <details className='text-sm'>
        <summary className='cursor-pointer text-muted-foreground'>
          {t('settings.permissionCheck.reasons')}
        </summary>
        <ul className='mt-2 flex list-disc flex-col gap-1 ps-5 text-muted-foreground'>
          {decision.reasons.map((reason, index) => (
            <li key={`${reason.code}:${String(index)}`}>
              <code>{reason.code}</code> {reason.message}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** What a credential subject, such as an API key, adds on top of its holder's roles. */
function CredentialSummary({
  credential,
}: {
  readonly credential: ConfiguredCredential;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const actions = (credential.permissions ?? []).reduce(
    (total, grant) => total + grant.actions.length,
    0,
  );
  const limits = Object.entries(credential.objects);
  return (
    <section
      className='flex flex-col gap-2 text-sm'
      data-slot='checked-credential'
    >
      <h3 className='font-medium'>{t('settings.permissionCheck.key.title')}</h3>
      {credential.state !== 'active' ? (
        <p
          role='alert'
          className='rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive'
        >
          {t(`settings.permissionCheck.key.${credential.state}`)}
        </p>
      ) : null}
      <p className='text-muted-foreground'>
        {credential.permissions === null
          ? t('settings.permissionCheck.key.unbounded')
          : t('settings.permissionCheck.key.bounded', { count: actions })}
      </p>
      {credential.personless ? (
        <p className='text-muted-foreground'>
          {t('settings.permissionCheck.key.personless')}
        </p>
      ) : null}
      {limits.length ? (
        <ul className='text-muted-foreground'>
          {limits.map(([business, ids]) => (
            <li key={business}>
              {t('settings.permissionCheck.key.objects', {
                business,
                count: ids.length,
              })}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** A credential's part in one decision: whether it covers the operation, and the records it keeps. */
function CredentialStep({
  credential,
  resource,
  action,
}: {
  readonly credential: ConfiguredCredential;
  readonly resource: CheckResource;
  readonly action: string;
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  if (credential.state !== 'active')
    return <>{t(`settings.permissionCheck.key.${credential.state}`)}</>;
  if (credential.permissions === null)
    return <>{t('settings.permissionCheck.key.stepUnbounded')}</>;
  const entry = credential.permissions
    .find(
      (grant) =>
        grant.resource.type === resource.type &&
        grant.resource.id === resource.id,
    )
    ?.actions.find((item) => item.action === action);
  if (!entry) return <>{t('settings.permissionCheck.key.stepMissing')}</>;
  const scopes: unknown = entry.policy?.scopes;
  const records =
    scopes && typeof scopes === 'object'
      ? Object.entries(scopes as Record<string, unknown>).map(
          ([scope, value]) => ({ scope, label: scopeLabel(value, t) }),
        )
      : [];
  return (
    <span className='flex flex-col gap-0.5'>
      <span>{t('settings.permissionCheck.key.stepCovers')}</span>
      {records.map((record) => (
        <span key={record.scope} data-slot='credential-records'>
          {t('settings.permissionCheck.key.stepRecords', {
            scope: record.scope,
            records: record.label,
          })}
        </span>
      ))}
      {records.length ? (
        <span>{t('settings.permissionCheck.key.intersection')}</span>
      ) : null}
    </span>
  );
}

/** How a key's data scope value reads: every record, the records chosen, a named record access, or none. */
function scopeLabel(
  value: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (value === '' || value === null || value === undefined)
    return t('settings.permissionCheck.key.noRecords');
  if (typeof value === 'string')
    return value === 'allRecords'
      ? t('settings.permissionCheck.key.allRecords')
      : value;
  if (typeof value === 'object') {
    const type: unknown = Reflect.get(value, 'type');
    const ids: unknown = Reflect.get(value, 'ids');
    if (type === 'all') return t('settings.permissionCheck.key.allRecords');
    if (type === 'records' && Array.isArray(ids))
      return t('settings.permissionCheck.key.chosen', {
        count: ids.length,
        ids: ids.slice(0, 5).join(', '),
      });
    const key: unknown = Reflect.get(value, 'key');
    if (type === 'recordAccess' && typeof key === 'string')
      return key === 'allRecords'
        ? t('settings.permissionCheck.key.allRecords')
        : key;
  }
  return t('settings.permissionCheck.key.noRecords');
}

function Step({
  index,
  title,
  children,
}: {
  readonly index: number;
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <li className='flex gap-3' data-slot='permission-step'>
      <span
        aria-hidden
        className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'
      >
        {index}
      </span>
      <div className='min-w-0 text-sm'>
        <div className='font-medium'>{title}</div>
        <div className='text-muted-foreground'>{children}</div>
      </div>
    </li>
  );
}

/** One kind of data rule's part in the decision: the rules that name the object, the operation and the user. */
function RuleStep({
  index,
  kind,
  resource,
  action,
  holders,
}: {
  readonly index: number;
  readonly kind: DataRuleKind;
  readonly resource: CheckResource;
  readonly action: string;
  readonly holders: readonly AuthorizationSubject[];
}): ReactElement {
  const { t } = useTranslation(AUTHORIZATION_NAMESPACE);
  const text = useLocalizedText();
  const api = useApiClient();
  const rulesPath = useResolvedPath('../default-access').pathname;
  const [rules, setRules] = useState<readonly DataRule[] | null>();
  useEffect(() => {
    let active = true;
    api
      .request<{ data: readonly DataRule[] }>({
        path: `authorization/${kind.path}`,
      })
      .then(
        (response) => {
          if (active) setRules(response.data);
        },
        (next: unknown) => {
          // A rule plugin the application does not install has no routes.
          if (active)
            setRules(
              next instanceof ApiClientError && next.status === 404 ? null : [],
            );
        },
      );
    return () => {
      active = false;
    };
  }, [api, kind.path]);
  const title = t(`settings.permissionCheck.step.${kind.texts}`);
  if (rules === undefined)
    return (
      <Step index={index} title={title}>
        …
      </Step>
    );
  if (rules === null)
    return (
      <Step index={index} title={title}>
        {t('settings.permissionCheck.notInstalled')}
      </Step>
    );
  const matched = matchingRules(kind, rules, resource, action, holders);
  return (
    <Step index={index} title={title}>
      {matched.length === 0 ? (
        t('settings.permissionCheck.noRules')
      ) : (
        <ul className='flex flex-wrap gap-x-3'>
          {matched.map((rule) => (
            <li key={rule.key}>
              <Link
                className='underline underline-offset-4'
                to={{
                  pathname: rulesPath,
                  search: `?${new URLSearchParams({ rule: kind.key, edit: rule.key })}`,
                }}
              >
                {rule.title === undefined ? rule.key : text(rule.title)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Step>
  );
}
