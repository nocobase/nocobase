import { FeedbackForm } from '#components/feedback-form';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  ApiClientError,
  useClientApplication,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useAuthorizationClient,
  type AuthorizationOptionsResponse,
  type LocalizedText,
  type PermissionSet,
} from '@nocobase/app-plugin-authorization/client';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router';
import { CopyIcon } from 'lucide-react';
import {
  PermissionEditor,
  type PermissionValue,
} from '#components/permission-editor';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  useSettingsData,
  useSettingsLeave,
  useRolePermission,
} from './hooks.js';
import { pagePermissionTitles } from './page-permission-titles.js';
import { permissionWorkspace } from './permission-workspace.js';
import { withPermissionFilters } from './permission-filters.js';
import {
  draftFromGrants,
  grantsFromDraft,
  sameGrants,
  unconfiguredFilter,
  filterKey,
  type PermissionFilters,
} from './permissions-model.js';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';
import { usePermissionEditorLabels } from './permission-editor-labels.js';

const EMPTY_VALUE: PermissionValue = { menus: [], grants: {} };

export interface RolesOutletContext {
  readonly reload: () => void;
  /** The roles list path, for links between roles. */
  readonly base: string;
}

function RoleEditor(): ReactElement {
  const { key } = useParams();
  const [search] = useSearchParams();
  const copyFrom = key ? undefined : (search.get('copy') ?? undefined);
  const creating = !key;
  const { t } = useTranslation();
  const app = useClientApplication();
  const authz = useAuthorizationClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const parent = useOutletContext<RolesOutletContext>();
  const sourceKey = key ?? copyFrom;
  const request = useSettingsData<{ data: PermissionSet }>(
    sourceKey
      ? `authorization/permissionSets/${encodeURIComponent(sourceKey)}`
      : 'authorization/permissionSets/options',
    true,
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
  const text = (value: LocalizedText): string =>
    typeof value === 'string'
      ? value
      : t(value.key, {
          ns: value.ns,
          defaultValue: value.defaultValue ?? value.key,
        });
  const source = sourceKey ? request.data?.data : undefined;
  const initial = creating ? undefined : source;
  const originalGrants = useMemo(
    () => (sourceKey ? (request.data?.data.grants ?? []) : []),
    [sourceKey, request.data],
  );
  const [nameDraft, setNameDraft] = useState<string>();
  const [keyDraft, setKeyDraft] = useState<string>();
  const [draft, setDraft] = useState<PermissionValue>();
  const [filters, setFilters] = useState<PermissionFilters>();
  const [editingFilter, setEditingFilter] = useState<string>();
  const { session } = useAuthentication();
  const submission = useSubmission({
    scope: `${session?.user.id}:settings:role:${key}`,
  });
  const [requestBusy, setRequestBusy] = useState(false);
  // The role as it was before a save: the draft stays on screen, read-only, until the saved role has loaded.
  const [savedFrom, setSavedFrom] = useState<unknown>();
  const busy = requestBusy || submission.submitting || savedFrom !== undefined;
  const [error, setError] = useState<unknown>();
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [keyConflict, setKeyConflict] = useState(false);
  const labels = usePermissionEditorLabels();

  const workspace = useMemo(
    () =>
      options.data
        ? permissionWorkspace(
            options.data.data,
            app.runtime.routes,
            pagePermissionTitles,
            {
              text: (value) =>
                typeof value === 'string'
                  ? value
                  : t(value.key, {
                      ns: value.ns,
                      defaultValue: value.defaultValue ?? value.key,
                    }),
              t: (key, values) => t(key, values),
            },
          )
        : undefined,
    [options.data, app, t],
  );
  const loaded = useMemo(
    () => (workspace ? draftFromGrants(originalGrants, workspace) : undefined),
    [workspace, originalGrants],
  );
  const value = useMemo(
    () => draft ?? loaded?.draft ?? EMPTY_VALUE,
    [draft, loaded],
  );
  const currentFilters = useMemo(
    () => filters ?? loaded?.filters ?? {},
    [filters, loaded],
  );
  const grants = useMemo(
    () =>
      workspace
        ? grantsFromDraft(value, currentFilters, originalGrants, workspace)
        : originalGrants,
    [workspace, value, currentFilters, originalGrants],
  );
  const sourceName = source ? text(source.title ?? source.key) : '';
  const defaultName = copyFrom
    ? sourceName
      ? t('settings.copyOfRole', { name: sourceName })
      : ''
    : sourceName;
  const name = nameDraft ?? defaultName;
  const roleKey =
    keyDraft ?? (copyFrom ? `${copyFrom}-copy` : (initial?.key ?? ''));
  const dirty =
    nameDraft !== undefined ||
    keyDraft !== undefined ||
    (creating
      ? Boolean(copyFrom) ||
        value.menus.length > 0 ||
        Object.keys(value.grants).length > 0
      : Boolean(
          workspace &&
          loaded &&
          (draft || filters) &&
          !sameGrants(
            grants,
            grantsFromDraft(
              loaded.draft,
              loaded.filters,
              originalGrants,
              workspace,
            ),
          ),
        ));
  const leave = useSettingsLeave(dirty, busy);
  const unrestricted = Boolean(source?.unrestricted) && !creating;
  const allowed = creating
    ? canCreate
    : canUpdate &&
      !unrestricted &&
      (!initial?.protection || initial.protection.allow.includes('update'));
  const readOnly = !allowed || busy;
  const originalRevisionRef = useRef<string | undefined>(undefined);

  const reset = (): void => {
    setNameDraft(undefined);
    setKeyDraft(undefined);
    setDraft(undefined);
    setFilters(undefined);
    setEditingFilter(undefined);
    setSubmitted(false);
    setError(undefined);
  };
  if (
    savedFrom !== undefined &&
    (request.data !== savedFrom || request.error)
  ) {
    setSavedFrom(undefined);
    if (!request.error) reset();
  }

  const save = async (form: HTMLFormElement): Promise<void> => {
    if (options.error || !workspace || (!creating && request.error)) return;
    setSubmitted(true);
    if (!name.trim() || !roleKey.trim()) {
      form.querySelector<HTMLInputElement>('input:invalid')?.focus();
      return;
    }
    const incomplete = unconfiguredFilter(
      value.grants,
      currentFilters,
      workspace,
    );
    if (incomplete) {
      setEditingFilter(filterKey(incomplete.action, incomplete.scope));
      return;
    }
    setEditingFilter(undefined);
    setRequestBusy(true);
    setError(undefined);
    setKeyConflict(false);
    try {
      originalRevisionRef.current ??= initial?.revision;
      const input = {
        key: roleKey.trim(),
        title:
          !creating && initial && nameDraft === undefined
            ? initial.title
            : name.trim(),
        grants,
        ...(!creating && initial?.revision
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
      parent.reload();
      toaster.show({ type: 'success', title: t('settings.saved', { name }) });
      if (creating) {
        // Only the navigation to the new role is allowed through; an edited role stays open and keeps its guard.
        leave.allow();
        void navigate(
          {
            pathname: `${parent.base}/${encodeURIComponent(input.key)}/edit`,
            search: '',
          },
          { replace: true },
        );
      } else {
        originalRevisionRef.current = undefined;
        setSavedFrom(request.data);
        request.reload();
      }
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
  };

  const objects = workspace
    ? withPermissionFilters(
        workspace.objects,
        workspace,
        value.grants,
        currentFilters,
        (key, fallback) => t(key, { defaultValue: fallback ?? key }),
        editingFilter,
        setEditingFilter,
        (key, filter) => {
          setFilters({ ...currentFilters, [key]: filter });
          setEditingFilter(undefined);
        },
        readOnly,
      )
    : [];

  const keyInvalid = keyConflict || (submitted && !roleKey.trim());
  const nameInvalid = submitted && !name.trim();
  const header = (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-end gap-3'>
        <div className='flex min-w-48 flex-1 flex-col gap-1.5'>
          <Label htmlFor='role-name'>{t('settings.roleName')} *</Label>
          <Input
            id='role-name'
            name='title'
            required
            value={name}
            disabled={readOnly}
            aria-invalid={nameInvalid}
            aria-errormessage={nameInvalid ? 'role-name-error' : undefined}
            onChange={(event) => setNameDraft(event.target.value)}
          />
          {nameInvalid && (
            <p id='role-name-error' className='text-xs text-destructive'>
              {t('settings.required')}
            </p>
          )}
        </div>
        <div className='flex min-w-40 flex-col gap-1.5 sm:max-w-56'>
          <Label htmlFor='role-key'>{t('settings.key')} *</Label>
          <Input
            id='role-key'
            name='key'
            required
            value={roleKey}
            disabled={!creating || readOnly}
            aria-invalid={keyInvalid}
            aria-errormessage={keyInvalid ? 'role-key-error' : undefined}
            onChange={(event) => {
              setKeyConflict(false);
              setKeyDraft(event.target.value);
            }}
          />
          {keyInvalid && (
            <p id='role-key-error' className='text-xs text-destructive'>
              {t(keyConflict ? 'settings.keyConflict' : 'settings.required')}
            </p>
          )}
        </div>
        {!creating && (
          <div className='flex flex-wrap gap-2'>
            {canCreate && !unrestricted && (
              <Button
                variant='outline'
                size='sm'
                nativeButton={false}
                render={
                  <Link
                    to={{
                      pathname: `${parent.base}/create`,
                      search: `?copy=${encodeURIComponent(key)}`,
                    }}
                  />
                }
              >
                <CopyIcon />
                {t('settings.duplicateRole')}
              </Button>
            )}
          </div>
        )}
      </div>
      {initial?.protection && !unrestricted && (
        <p className='text-sm text-muted-foreground'>
          {t('settings.protectedHint')}
        </p>
      )}
    </div>
  );
  const footer = (
    <>
      {dirty && allowed && (
        <Button
          type='button'
          variant='outline'
          disabled={busy}
          onClick={() => {
            if (creating) void navigate({ pathname: parent.base, search: '' });
            else reset();
          }}
        >
          {t('settings.discardChanges')}
        </Button>
      )}
      {allowed && (
        <Button type='submit' disabled={busy || !dirty}>
          {t(busy ? 'settings.saving' : 'settings.save')}
        </Button>
      )}
    </>
  );

  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <SettingsError error={request.error} retry={request.reload} />
      <SettingsError error={options.error} retry={options.reload} />
      {error instanceof Error && 'status' in error && error.status === 409 && (
        <Button variant='outline' onClick={() => setReloadConfirm(true)}>
          {t('settings.reload')}
        </Button>
      )}
      {(request.loading && sourceKey && !request.data) ||
      (options.loading && !options.data) ? (
        <SettingsLoading />
      ) : (
        !request.error &&
        !options.error && (
          <FeedbackForm
            key={location.pathname}
            submitting={busy}
            error={error}
            errorContent={<SettingsError error={error} inline />}
            onSubmit={(event) => {
              event.preventDefault();
              void save(event.currentTarget);
            }}
            noValidate
            className='flex flex-col gap-4'
          >
            <PermissionEditor
              menus={workspace?.menus ?? []}
              objects={objects}
              value={value}
              onChange={(next) => setDraft(next)}
              unrestricted={unrestricted}
              readOnly={readOnly}
              dirty={dirty}
              header={header}
              footer={footer}
              labels={labels}
            />
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
          reset();
          setReloadConfirm(false);
          request.reload();
        }}
      />
    </div>
  );
}

export default function RoleForm(): ReactElement {
  const { key } = useParams();
  const [search] = useSearchParams();
  return <RoleEditor key={key ?? `$new:${search.get('copy') ?? ''}`} />;
}
