import { FeedbackForm } from '#components/feedback-form';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useSubmission } from '@nocobase/app-client';
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
  type AuthorizationOptionsResponse,
  type LocalizedText,
  type PermissionGrant,
  type PermissionSet,
} from '@nocobase/app-plugin-authorization/client';
import {
  permissionNavigationSections,
  pagePermissionResources,
} from './page-permissions.js';
import { pagePermissionTitles } from './page-permission-titles.js';
import {
  permissionScopeVisible,
  permissionWorkspaceCatalog,
} from './permission-workspace.js';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useResolvedPath,
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
  const canCreate = useRolePermission('create');
  const canUpdate = useRolePermission('update');
  const [nameDraft, setNameDraft] = useState<string>();
  const [keyDraft, setKeyDraft] = useState<string>();
  const [grantsDraft, setGrantsDraft] = useState<readonly PermissionGrant[]>();
  const [dirty, setDirty] = useState(false);
  const [editingScope, setEditingScope] = useState<string>();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:settings:role:${key}`,
  });
  const [requestBusy, setRequestBusy] = useState(false);
  const busy = requestBusy || submission.submitting;
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
    const pages = pagePermissionResources(
      app.runtime.routes,
      pagePermissionTitles,
      (path) => t('settings.unnamedPage', { path }),
    );
    return permissionWorkspaceCatalog(
      options.data.data,
      app.runtime.routes,
      pages,
    );
  }, [options.data, app, t]);
  const allowed = creating
    ? canCreate
    : canUpdate &&
      (!request.data?.data.protection ||
        request.data.data.protection.allow.includes('update'));
  const closeTo = {
    pathname: useResolvedPath('..').pathname,
    search: location.search,
  };
  const originalRevisionRef = useRef<string | undefined>(undefined);
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    return (async () => {
      event.preventDefault();
      if (options.error || !catalog || (!creating && request.error)) return;
      setSubmitted(true);
      if (!name.trim() || !roleKey.trim()) {
        form.querySelector<HTMLInputElement>('input:invalid')?.focus();
        return;
      }
      const incomplete = unconfiguredFilter(grants);
      if (incomplete) {
        setEditingScope(incomplete);
        return;
      }
      setEditingScope(undefined);
      setRequestBusy(true);
      setError(undefined);
      setKeyConflict(false);
      try {
        originalRevisionRef.current ??= request.data?.data.revision;
        const input = {
          key: roleKey,
          title:
            !creating && initial && nameDraft === undefined
              ? initial.title
              : name.trim(),
          grants,
          ...(!creating && request.data?.data.revision
            ? { expectedRevision: originalRevisionRef.current }
            : {}),
        };
        const saved = await submission.run(
          { key, creating, input },
          (idempotencyKey) =>
            creating
              ? authz.createPermissionSet(input, idempotencyKey)
              : authz.updatePermissionSet(key, input, idempotencyKey),
        );
        if (!saved) return;
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
        setRequestBusy(false);
      }
    })();
  };
  const sections = catalog
    ? configurePermissionScopes(
        permissionNavigationSections(
          permissionSections(catalog, grants, text, permissionScopeVisible),
          app.runtime.routes,
          pagePermissionTitles,
          (path) => t('settings.unnamedPage', { path }),
          text,
        ),
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
            <FeedbackForm
              submitting={busy}
              error={error}
              errorContent={<SettingsError error={error} inline />}
              onSubmit={(event) => void save(event)}
              noValidate
              className='flex flex-col gap-6'
            >
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='role-key'>{t('settings.key')} *</Label>
                  <Input
                    id='role-key'
                    name='key'
                    required
                    value={roleKey}
                    disabled={!creating || !allowed || busy}
                    aria-invalid={keyConflict || (submitted && !roleKey.trim())}
                    aria-errormessage={
                      keyConflict || (submitted && !roleKey.trim())
                        ? 'role-key-error'
                        : undefined
                    }
                    onChange={(event) => {
                      setKeyConflict(false);
                      setKeyDraft(event.target.value);
                      setDirty(true);
                    }}
                  />
                  {(keyConflict || (submitted && !roleKey.trim())) && (
                    <p id='role-key-error' className='text-xs text-destructive'>
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
                    name='title'
                    required
                    value={name}
                    disabled={!allowed || busy}
                    aria-invalid={submitted && !name.trim()}
                    aria-errormessage={
                      submitted && !name.trim() ? 'role-name-error' : undefined
                    }
                    onChange={(event) => {
                      setNameDraft(event.target.value);
                      setDirty(true);
                    }}
                  />
                  {submitted && !name.trim() && (
                    <p
                      id='role-name-error'
                      className='text-xs text-destructive'
                    >
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
              <p className='text-xs text-muted-foreground'>
                {t('settings.permissionSaveHint')}
              </p>
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
                  granted: t('settings.permissionGranted'),
                  ungranted: t('settings.permissionUngranted'),
                  selectAll: t('settings.permissionAll'),
                  authorizationStatus: t('settings.permissionStatus'),
                  clearSearch: t('settings.permissionClearSearch'),
                  collapseAll: t('settings.permissionCollapseAll'),
                  expandAll: t('settings.permissionExpandAll'),
                  summary: (enabled, total) =>
                    t('settings.permissionSummary', { enabled, total }),
                  clear: t('settings.clear'),
                  empty: t('settings.noPermissions'),
                  emptyDescription: t('settings.permissionEmptyHint'),
                  readOnly: t('settings.permissionReadOnlyHint'),
                  managedPermission: t('settings.permissionManagedHint'),
                  noResults: t('settings.noResults'),
                  navigation: t('settings.permissionCategories'),
                  expandGroup: (name) =>
                    t('settings.expandPermissionGroup', { name }),
                  collapseGroup: (name) =>
                    t('settings.collapsePermissionGroup', { name }),
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
            </FeedbackForm>
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
