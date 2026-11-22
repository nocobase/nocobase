import { FeedbackForm } from '#components/feedback-form';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  ApiClientError,
  useClientApplication,
  useSubmission,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthorizationClient } from '../use-authorization-client.js';
import {
  type AuthorizationOptionsResponse,
  type LocalizedText,
  type PermissionGrant,
  type PermissionSet,
} from '../authorization-client.js';
import {
  createElement,
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactElement,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router';
import { CopyIcon, PencilIcon } from 'lucide-react';
import { Badge } from '#components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';
import {
  PermissionEditor,
  type PermissionEditorExtraTab,
  type PermissionValue,
} from '#components/permission-editor';
import { permissionChanges } from '#components/permission-editor-model';
import { RowActions } from '#components/row-actions';
import { Skeleton } from '#components/ui/skeleton';
import type {
  AuthorizationContentTab,
  AuthorizationRoleTabProps,
} from './extensions.js';
import { useAuthorizationRevision } from '../use-authorization-revision.js';
import { RoleMembers, type RoleMemberType } from './role-members.js';
import { RoleReview } from './role-review.js';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  useSettingsData,
  useSettingsLeave,
  useRolePermission,
} from './hooks.js';
import { useAuthorizationSettings } from './use-authorization-settings.js';
import { permissionWorkspace } from './permission-workspace.js';
import { withPermissionFilters } from './permission-filters.js';
import {
  applyFilter,
  draftFromGrants,
  grantsFromDraft,
  sameGrants,
  unconfiguredFilter,
  filterKey,
  type PermissionFilters,
} from './permissions-model.js';
import { ConfirmAction, SettingsError, SettingsLoading } from './shared.js';
import { usePermissionEditorLabels } from './permission-editor-labels.js';
import { grantsOfTypes, tabsFor, withTabGrants } from './tab-grants.js';

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
  const settings = useAuthorizationSettings();

  const workspace = useMemo(
    () =>
      options.data
        ? permissionWorkspace(
            options.data.data,
            settings.pageCatalog(app.runtime.routes),
            settings.pageTitles,
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
            settings.workspace,
          )
        : undefined,
    [options.data, app, settings, t],
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
  // What role tabs declaring resource types changed, by tab key: saved with the rest of the draft.
  const [tabDrafts, setTabDrafts] = useState<
    ReadonlyMap<
      string,
      { types: readonly string[]; grants: readonly PermissionGrant[] }
    >
  >(() => new Map());
  const grants = useMemo(() => {
    let next = workspace
      ? grantsFromDraft(value, currentFilters, originalGrants, workspace)
      : originalGrants;
    for (const tab of tabDrafts.values())
      next = withTabGrants(next, tab.types, tab.grants);
    return next;
  }, [workspace, value, currentFilters, originalGrants, tabDrafts]);
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
    tabDrafts.size > 0 ||
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
  const canAssign = useRolePermission('assign');
  const [reviewing, setReviewing] = useState(false);
  const [memberCount, setMemberCount] = useState<number>();
  const [renaming, setRenaming] = useState(false);
  const changes = useMemo(
    () =>
      workspace
        ? permissionChanges(
            creating ? EMPTY_VALUE : (loaded?.draft ?? EMPTY_VALUE),
            value,
            workspace.menus,
            workspace.objects,
            workspace.settings,
          )
        : [],
    [workspace, creating, loaded, value],
  );
  const notes = useMemo(() => {
    const list: string[] = [];
    if (creating) return list;
    if (nameDraft !== undefined && name.trim() !== defaultName)
      list.push(t('settings.review.renamed', { name: name.trim() }));
    // Record filters are edited inside a scope and are not listed one by one.
    if (dirty && !changes.length && !list.length)
      list.push(t('settings.review.other'));
    return list;
  }, [creating, nameDraft, name, defaultName, dirty, changes, t]);
  const tabBadges = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const change of changes)
      counts[change.tab] = (counts[change.tab] ?? 0) + 1;
    return counts;
  }, [changes]);
  const highRisk = changes.some((change) => change.risk === 'high');
  const memberTypes = useMemo<readonly RoleMemberType[]>(
    () =>
      (options.data?.data.subjectTypes ?? []).map((type) => ({
        type: type.type,
        title: type.title,
        directory: type.selection.type === 'collection',
      })),
    [options.data],
  );
  const roleTabs = useAllowedRoleTabs();
  // Permission check sits beside Roles, with the member's user picked.
  const checkHref = useCallback(
    (userId: string) =>
      `${parent.base.slice(0, parent.base.lastIndexOf('/'))}/permission-check?${new URLSearchParams({ user: userId })}`,
    [parent.base],
  );
  const onMemberCount = useCallback(
    (count: number) => setMemberCount(count),
    [],
  );
  // The members tab shows its count before it is opened.
  useEffect(() => {
    if (creating || !key) return;
    let active = true;
    authz.listAssignments(key).then(
      (assignments) => {
        if (active) setMemberCount((count) => count ?? assignments.length);
      },
      () => undefined,
    );
    return () => {
      active = false;
    };
  }, [authz, creating, key]);
  const extraTabs = useMemo<readonly PermissionEditorExtraTab[]>(() => {
    if (creating || !key || !initial) return [];
    return [
      {
        value: 'members',
        label:
          memberCount === undefined
            ? t('settings.members.tab')
            : t('settings.members.tabCount', { count: memberCount }),
        content: (
          <RoleMembers
            permissionSet={key}
            types={memberTypes}
            editable={canAssign}
            onCount={onMemberCount}
            checkHref={checkHref}
          />
        ),
      },
      ...roleTabs.map((tab) => ({
        value: `extension:${tab.key}`,
        label:
          typeof tab.title === 'string'
            ? tab.title
            : t(tab.title.key, {
                ns: tab.title.ns,
                defaultValue: tab.title.defaultValue ?? tab.title.key,
              }),
        content: (
          <Suspense fallback={<Skeleton className='h-48 w-full' />}>
            <RoleTabContent
              tab={tab}
              props={{
                target: 'role',
                permissionSet: initial,
                editable: allowed,
                ceiling: null,
                value: grantsOfTypes(grants, tab.resourceTypes),
                onChange: (next) => {
                  if (!tab.resourceTypes?.length) return;
                  const types = tab.resourceTypes;
                  setTabDrafts((current) =>
                    new Map(current).set(tab.key, { types, grants: next }),
                  );
                },
              }}
            />
          </Suspense>
        ),
      })),
    ];
  }, [
    creating,
    key,
    initial,
    memberCount,
    memberTypes,
    canAssign,
    onMemberCount,
    checkHref,
    roleTabs,
    allowed,
    grants,
    t,
  ]);

  const reset = (): void => {
    setNameDraft(undefined);
    setKeyDraft(undefined);
    setDraft(undefined);
    setFilters(undefined);
    setTabDrafts(new Map());
    setEditingFilter(undefined);
    setSubmitted(false);
    setError(undefined);
    setReviewing(false);
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
    // Every save is reviewed first; the review's confirmation saves.
    setReviewing(true);
  };

  const persist = async (): Promise<void> => {
    if (!workspace) return;
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
      setReviewing(false);
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
        setReviewing(false);
        setKeyConflict(true);
        document.getElementById('role-key')?.focus();
      } else {
        setReviewing(false);
        setError(next);
      }
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
        (actionId, slotId, filter) => {
          const applied = applyFilter(
            workspace.objects,
            value,
            currentFilters,
            actionId,
            slotId,
            filter,
          );
          setFilters(applied.filters);
          setEditingFilter(undefined);
          if (applied.value !== value) setDraft(applied.value);
          for (const notice of applied.notices)
            toaster.show({ type: 'info', title: labels.notice(notice) });
        },
        readOnly,
        settings.workspace,
      )
    : [];

  const keyInvalid = keyConflict || (submitted && !roleKey.trim());
  const nameInvalid = submitted && !name.trim();
  const duplicateHref =
    !creating && canCreate && !unrestricted
      ? {
          pathname: `${parent.base}/create`,
          search: `?copy=${encodeURIComponent(key)}`,
        }
      : undefined;
  const duplicate =
    duplicateHref !== undefined ? (
      <Button
        variant='outline'
        size='sm'
        nativeButton={false}
        render={<Link to={duplicateHref} />}
      >
        <CopyIcon />
        {t('settings.duplicateRole')}
      </Button>
    ) : null;
  const header = (
    <div className='flex flex-col gap-3'>
      {creating ? (
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
        </div>
      ) : (
        // An existing role reads as a title; its key never changes and its name changes through Rename. A phone keeps
        // the whole name and puts Rename and Duplicate in a menu beside it.
        <div className='flex items-start gap-3'>
          <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1'>
            <h2 className='min-w-0 text-lg font-semibold break-words'>
              {name}
            </h2>
            <code className='max-w-full truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs whitespace-nowrap text-muted-foreground'>
              {roleKey}
            </code>
            {unrestricted ? (
              <Badge variant='secondary'>
                {t('settings.unrestrictedRole')}
              </Badge>
            ) : initial?.protection ? (
              <Badge variant='outline'>{t('settings.protected')}</Badge>
            ) : null}
          </div>
          <div className='hidden shrink-0 gap-2 sm:flex'>
            {!readOnly && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setRenaming(true)}
              >
                <PencilIcon />
                {t('settings.rename')}
              </Button>
            )}
            {duplicate}
          </div>
          <div className='shrink-0 sm:hidden'>
            <RowActions
              label={t('settings.actionsFor', { name })}
              actions={[
                !readOnly && {
                  key: 'rename',
                  label: t('settings.rename'),
                  onClick: () => setRenaming(true),
                },
                duplicateHref !== undefined && {
                  key: 'duplicate',
                  label: t('settings.duplicateRole'),
                  render: <Link to={duplicateHref} />,
                },
              ]}
            />
          </div>
        </div>
      )}
      {initial?.protection && !unrestricted && (
        <p className='text-sm text-muted-foreground'>
          {t('settings.protectedHint')}
        </p>
      )}
      {renaming && (
        <RenameRole
          name={name}
          onCancel={() => setRenaming(false)}
          onRename={(next) => {
            setRenaming(false);
            setNameDraft(next === defaultName ? undefined : next);
          }}
        />
      )}
    </div>
  );
  const footer = (
    <>
      {dirty && allowed && (
        <Button
          type='button'
          variant='ghost'
          // The footer sits on the editor's dark save bar.
          className='text-background hover:bg-background/10 hover:text-background'
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
          {t(busy ? 'settings.saving' : 'settings.reviewAndSave')}
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
              settings={workspace?.settings ?? []}
              value={value}
              onChange={(next) => setDraft(next)}
              unrestricted={unrestricted}
              readOnly={readOnly}
              dirty={dirty}
              header={header}
              footer={footer}
              labels={
                dirty
                  ? {
                      ...labels,
                      unsaved: t(
                        highRisk
                          ? 'settings.unsavedCountRisky'
                          : 'settings.unsavedCount',
                        { count: changes.length + notes.length },
                      ),
                    }
                  : labels
              }
              menuDefaults={workspace?.menuDefaults}
              tabs={extraTabs}
              tabBadges={tabBadges}
            />
          </FeedbackForm>
        )
      )}
      {reviewing && (
        <RoleReview
          changes={changes}
          notes={notes}
          busy={busy}
          onCancel={() => setReviewing(false)}
          onConfirm={() => void persist()}
        />
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

/** Renames a role. The new name is part of the unsaved changes, saved with the rest after the review. */
function RenameRole({
  name,
  onCancel,
  onRename,
}: {
  readonly name: string;
  readonly onCancel: () => void;
  readonly onRename: (name: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  const [value, setValue] = useState(name);
  const empty = !value.trim();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <form
          className='grid gap-4'
          onSubmit={(event) => {
            // The dialog sits inside the role form: its submit must not save the role.
            event.preventDefault();
            event.stopPropagation();
            if (!empty) onRename(value.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('settings.renameTitle')}</DialogTitle>
          </DialogHeader>
          <div className='grid gap-1.5'>
            <Label htmlFor='role-rename'>{t('settings.roleName')} *</Label>
            <Input
              id='role-rename'
              autoFocus
              required
              value={value}
              aria-invalid={empty}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onCancel}>
              {t('settings.cancel')}
            </Button>
            <Button type='submit' disabled={empty}>
              {t('settings.rename')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type RoleTab = AuthorizationContentTab<AuthorizationRoleTabProps>;

// One load per registered loader, so switching back to a tab does not load it again.
const roleTabModules = new WeakMap<
  RoleTab['component'],
  Promise<{ readonly default: ComponentType<AuthorizationRoleTabProps> }>
>();

function RoleTabContent({
  tab,
  props,
}: {
  readonly tab: RoleTab;
  readonly props: AuthorizationRoleTabProps;
}): ReactElement {
  let module = roleTabModules.get(tab.component);
  if (!module) {
    module = tab.component();
    roleTabModules.set(tab.component, module);
  }
  return createElement(use(module).default, props);
}

/** The registered role tabs the person may open. A tab without `authz` shows wherever the role does. */
function useAllowedRoleTabs(): readonly RoleTab[] {
  const settings = useAuthorizationSettings();
  const client = useAuthorizationClient();
  const revision = useAuthorizationRevision();
  const tabs = useSyncExternalStore(
    settings.roleTabs.subscribe,
    settings.roleTabs.list,
  );
  const roleOnly = useMemo(() => tabsFor(tabs, 'role'), [tabs]);
  const [allowed, setAllowed] = useState<{
    readonly tabs: readonly RoleTab[];
    readonly revision: number;
    readonly list: readonly RoleTab[];
  }>();
  useEffect(() => {
    let active = true;
    void Promise.all(
      roleOnly.map((tab) =>
        tab.authz === undefined
          ? Promise.resolve(true)
          : client.can(tab.authz).then(
              (can) => can,
              () => false,
            ),
      ),
    ).then((answers) => {
      if (active)
        setAllowed({
          tabs: roleOnly,
          revision,
          list: roleOnly.filter((_, index) => answers[index]),
        });
    });
    return () => {
      active = false;
    };
  }, [client, revision, roleOnly]);
  return allowed?.tabs === roleOnly && allowed.revision === revision
    ? allowed.list
    : NO_ROLE_TABS;
}

const NO_ROLE_TABS: readonly RoleTab[] = [];

export default function RoleForm(): ReactElement {
  const { key } = useParams();
  const [search] = useSearchParams();
  return <RoleEditor key={key ?? `$new:${search.get('copy') ?? ''}`} />;
}
