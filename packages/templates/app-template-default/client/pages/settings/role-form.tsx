import {
  useSettingsLeave,
  useSettingsData,
  useRolePermission,
} from './hooks.js';
import {
  ApiClientError,
  useClientApplication,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useAuthorizationClient,
  useCan,
  type AuthorizationOptionsResponse,
  type LocalizedText,
  type PermissionGrant,
  type PermissionSet,
} from '@nocobase/app-plugin-authorization/client';
import { pagePermissionResources } from './page-permissions.js';
import { pagePermissionTitles } from './page-permission-titles.js';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { RouteChildPage } from '#components/route-child-page';
import { BackButton } from '#components/back-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { PermissionEditor } from '#components/permission-editor';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Badge } from '#components/ui/badge';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';
import { configurePermissionScopes } from './permission-filters.js';
import {
  permissionSections,
  unconfiguredFilter,
  setPermissions,
  setScope,
} from './permissions-model.js';

function RoleEditor(): ReactElement {
  const { key } = useParams();
  const creating = !key;
  const { t } = useTranslation();
  const app = useClientApplication();
  const authz = useAuthorizationClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const parent = useOutletContext<{ reload: () => void }>();
  const request = useSettingsData<{ data: PermissionSet }>(
    key
      ? `authorization/permissionSets/${encodeURIComponent(key)}`
      : 'authorization/permissionSets/options',
  );
  const missingRef = useRef<unknown>(undefined);
  useEffect(() => {
    if (
      request.error instanceof ApiClientError &&
      request.error.status === 404 &&
      missingRef.current !== request.error
    ) {
      missingRef.current = request.error;
      parent.reload();
    }
  }, [request.error, parent]);
  const options = useSettingsData<{ data: AuthorizationOptionsResponse }>(
    'authorization/permissionSets/options',
  );
  const canReadDefaults = useCan({
    resource: { type: 'settings', id: 'authorization.default-access' },
    action: 'read',
  }).can;
  const canCreate = useRolePermission('create');
  const canUpdate = useRolePermission('update');
  const [nameDraft, setNameDraft] = useState<string>();
  const [keyDraft, setKeyDraft] = useState<string>();
  const [grantsDraft, setGrantsDraft] = useState<readonly PermissionGrant[]>();
  const [dirty, setDirty] = useState(false);
  const [editingScope, setEditingScope] = useState<string>();
  const [busy, setBusy] = useState(false);
  const leave = useSettingsLeave(dirty, busy);
  const [error, setError] = useState<unknown>();

  const [reloadConfirm, setReloadConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [keyConflict, setKeyConflict] = useState(false);
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const initial = !creating ? request.data?.data : undefined;
  const name = nameDraft ?? (initial ? text(initial.title ?? initial.key) : '');
  const roleKey = keyDraft ?? initial?.key ?? '';
  const grants = grantsDraft ?? initial?.grants ?? [];
  const catalog = useMemo(() => {
    if (!options.data) return undefined;
    const source = options.data.data;
    const pages = pagePermissionResources(
      app.runtime.routes,
      pagePermissionTitles,
      (path) => t('settings.unnamedPage', { path }),
    );
    return {
      ...source,
      sections: [
        {
          name: 'users',
          title: { key: 'settings.userPermissions' },
          order: 0,
          subsections: [
            ...[
              {
                name: 'users.information',
                title: 'userInformation',
                actions: ['read', 'create', 'update', 'invite', 'delete'],
              },
              {
                name: 'users.security',
                title: 'accountSecurity',
                actions: [
                  'reset-password',
                  'disable',
                  'enable',
                  'revoke-sessions',
                ],
              },
              {
                name: 'users.roles',
                title: 'roleAssignment',
                actions: ['assign-role'],
              },
            ].map((group) => ({
              name: group.name,
              title: { key: `settings.${group.title}` },
              resources: [
                {
                  type: 'user',
                  id: '*',
                  title: { key: `settings.${group.title}` },
                  actions: [
                    { name: 'read', title: { key: 'settings.readUsers' } },
                    { name: 'create', title: { key: 'settings.createUsers' } },
                    { name: 'update', title: { key: 'settings.updateUsers' } },
                    { name: 'invite', title: { key: 'settings.inviteUsers' } },
                    { name: 'delete', title: { key: 'settings.deleteUsers' } },
                    {
                      name: 'reset-password',
                      title: { key: 'settings.resetUserPassword' },
                    },
                    { name: 'disable', title: { key: 'settings.disable' } },
                    { name: 'enable', title: { key: 'settings.enable' } },
                    {
                      name: 'assign-role',
                      title: { key: 'settings.assignRole' },
                    },
                    {
                      name: 'revoke-sessions',
                      title: { key: 'settings.revokeSessions' },
                    },
                  ].filter((action) => group.actions.includes(action.name)),
                },
              ],
            })),
          ],
        },
        ...source.sections.map((section) => ({
          ...section,
          subsections: section.subsections.map((sub) => ({
            ...sub,
            resources:
              sub.recordType?.type === 'page'
                ? [...sub.resources, ...pages]
                : sub.resources,
          })),
        })),
      ],
    };
  }, [options.data, app, t]);
  const allowed = creating
    ? canCreate
    : canUpdate &&
      (!request.data?.data.protection ||
        request.data.data.protection.allow.includes('update'));
  const closeTo = { pathname: '/settings/roles', search: location.search };
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (options.error || !catalog || (!creating && request.error)) return;
    setSubmitted(true);
    if (!name.trim() || !roleKey.trim()) {
      event.currentTarget
        .querySelector<HTMLInputElement>('input:invalid')
        ?.focus();
      return;
    }
    const incomplete = unconfiguredFilter(grants);
    if (incomplete) {
      setEditingScope(incomplete);
      return;
    }
    setEditingScope(undefined);
    setBusy(true);
    setError(undefined);
    setKeyConflict(false);
    try {
      const input = {
        key: roleKey,
        title:
          !creating && initial && nameDraft === undefined
            ? initial.title
            : name.trim(),
        grants,
        ...(!creating && request.data?.data.revision
          ? { expectedRevision: request.data.data.revision }
          : {}),
      };
      if (creating) await authz.createPermissionSet(input);
      else await authz.updatePermissionSet(key, input);
      setDirty(false);
      parent.reload();
      toaster.show({ type: 'success', title: t('settings.saved', { name }) });
      leave.allow();
      void navigate(closeTo, { replace: true });
    } catch (next) {
      if (
        creating &&
        next instanceof Error &&
        'status' in next &&
        next.status === 409
      ) {
        setKeyConflict(true);
        document.getElementById('role-key')?.focus();
      } else setError(next);
    } finally {
      setBusy(false);
    }
  };
  const sections = catalog
    ? configurePermissionScopes(
        permissionSections(catalog, grants, text),
        catalog,
        grants,
        (key, fallback) => t(key, { defaultValue: fallback ?? key }),
        editingScope,
        setEditingScope,
        (id, value) => {
          setGrantsDraft((current) => setScope(current ?? grants, id, value));
          setDirty(true);
        },
        !allowed || busy,
      )
    : [];
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton to={closeTo}>{t('settings.roles')}</BackButton>
        <PageHeader
          title={t(creating ? 'settings.newRole' : 'settings.editRole')}
          description={t('settings.rolesDescription')}
          actions={
            dirty ? (
              <Badge variant='secondary'>{t('settings.unsaved')}</Badge>
            ) : undefined
          }
        />
        <SettingsError error={request.error} retry={request.reload} />
        <SettingsError error={options.error} retry={options.reload} />
        <SettingsError error={error} />
        {error instanceof Error &&
          'status' in error &&
          error.status === 409 && (
            <Button variant='outline' onClick={() => setReloadConfirm(true)}>
              {t('settings.reload')}
            </Button>
          )}
        {(request.loading && !creating) || options.loading ? (
          <SettingsLoading />
        ) : (
          !request.error &&
          !options.error && (
            <form
              onSubmit={(event) => void save(event)}
              noValidate
              className='flex flex-col gap-6'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='role-key'>{t('settings.key')} *</Label>
                  <Input
                    id='role-key'
                    required
                    value={roleKey}
                    disabled={!creating || !allowed || busy}
                    aria-invalid={keyConflict || (submitted && !roleKey.trim())}
                    onChange={(event) => {
                      setKeyConflict(false);
                      setKeyDraft(event.target.value);
                      setDirty(true);
                    }}
                  />
                  {(keyConflict || (submitted && !roleKey.trim())) && (
                    <p className='text-xs text-destructive'>
                      {t(
                        keyConflict
                          ? 'settings.keyConflict'
                          : 'settings.required',
                      )}
                    </p>
                  )}
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='role-name'>{t('settings.roleName')} *</Label>
                  <Input
                    id='role-name'
                    required
                    value={name}
                    disabled={!allowed || busy}
                    aria-invalid={submitted && !name.trim()}
                    onChange={(event) => {
                      setNameDraft(event.target.value);
                      setDirty(true);
                    }}
                  />
                  {submitted && !name.trim() && (
                    <p className='text-xs text-destructive'>
                      {t('settings.required')}
                    </p>
                  )}
                </div>
              </div>
              {request.data?.data.protection && (
                <p className='text-sm text-muted-foreground'>
                  {t('settings.protectedHint')}
                </p>
              )}
              {canReadDefaults && (
                <div>
                  <Link
                    to='/default-access'
                    className='text-sm text-foreground underline-offset-4 hover:underline'
                  >
                    {t('settings.defaultAccess.manage')}
                  </Link>
                </div>
              )}
              <PermissionEditor
                sections={sections}
                readOnly={!allowed || busy}
                labels={{
                  dataRanges: (count) => t('settings.dataRanges', { count }),
                  scopeExplanation: t('settings.scopeExplanation'),
                  scopeHintFor: (name) => t('settings.scopeHintFor', { name }),
                  levelFor: (name) => t('settings.levelFor', { name }),
                  search: t('settings.permissionSearch'),
                  enabledOnly: t('settings.enabledOnly'),
                  clear: t('settings.clear'),
                  empty: t('settings.noPermissions'),
                  noResults: t('settings.noResults'),
                  navigation: t('settings.permissionCategories'),
                }}
                onEnabledChange={(id, enabled) => {
                  if (!catalog) return;
                  setGrantsDraft((current) =>
                    setPermissions(current ?? grants, catalog, [
                      { id, enabled },
                    ]),
                  );
                  setDirty(true);
                }}
                onLevelChange={(id, value) => {
                  if (value === 'customFilter') {
                    setEditingScope(id);
                    return;
                  }
                  setGrantsDraft((current) =>
                    setScope(current ?? grants, id, value),
                  );
                  setDirty(true);
                }}
              />
              <div className='sticky bottom-0 flex justify-end gap-2 border-t bg-background py-4'>
                <Button
                  variant='outline'
                  disabled={busy}
                  onClick={() => void navigate(closeTo)}
                >
                  {t('settings.cancel')}
                </Button>
                {allowed && (
                  <Button type='submit' disabled={busy || !dirty}>
                    {t(busy ? 'settings.saving' : 'settings.save')}
                  </Button>
                )}
              </div>
            </form>
          )
        )}
        {leave.dialog}
        <ConfirmAction
          open={reloadConfirm}
          title={t('settings.discardTitle')}
          description={t('settings.discardHint')}
          busy={false}
          onCancel={() => setReloadConfirm(false)}
          onConfirm={() => {
            setNameDraft(undefined);
            setKeyDraft(undefined);
            setGrantsDraft(undefined);
            setDirty(false);
            setError(undefined);
            setReloadConfirm(false);
            request.reload();
          }}
        />
      </PageContainer>
    </RouteChildPage>
  );
}

export default function RoleForm(): ReactElement {
  const { key } = useParams();
  return <RoleEditor key={key ?? '$new'} />;
}
