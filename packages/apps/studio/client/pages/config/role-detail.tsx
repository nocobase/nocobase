import { usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  canUseSetting,
  PmDetailSkeleton,
  PmLoadError,
  PmTag,
  useViewer,
} from '@nocobase/app-plugin-projects/client/kit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CopyIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import type { AccessCatalog, Role } from '../../../shared/access.js';
import { studioKeys, useStudioApi } from '../../access/api.js';
import { useNotify } from '../../access/notify.js';
import { RoleEditor } from './members/role-editor.js';
import {
  draftOf,
  requestOf,
  rolePath,
  roleTitle,
  sameDraft,
  type RoleDraft,
} from './members/roles-model.js';
import { useRoleError } from './members/use-role-error.js';

/** A role of the member settings (`/config/roles/:roleKey`). */
const ROLES_PATH = '/config/roles';

function RoleBody({
  catalog,
  role,
  canDefine,
}: {
  readonly catalog: AccessCatalog;
  readonly role: Role;
  readonly canDefine: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useStudioApi();
  const notify = useNotify();
  const roleError = useRoleError();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const saved = draftOf(role);
  const [draft, setDraft] = useState<RoleDraft>(saved);
  const [title, setTitle] = useState(() => roleTitle(t, role));
  const readOnly = !canDefine || !role.editable;
  const dirty =
    !sameDraft(draft, saved) || (!role.builtIn && title !== roleTitle(t, role));

  const save = useMutation({
    mutationFn: () =>
      api.updateRole(role.key, {
        // Built-in roles keep their translated title; only custom roles are renamed here.
        ...(role.builtIn ? {} : { title }),
        ...requestOf(draft),
      }),
    onSuccess: () => {
      notify.success(t('roles.saved', { name: title.trim() }));
      void queryClient.invalidateQueries({ queryKey: studioKeys.roles });
    },
    onError: roleError,
  });
  const duplicate = useMutation({
    mutationFn: () =>
      api.createRole({
        title: t('roles.copyOf', { name: roleTitle(t, role) }),
        ...requestOf(draft),
      }),
    onSuccess: (copy) => {
      notify.success(t('roles.created', { name: roleTitle(t, copy) }));
      void queryClient.invalidateQueries({ queryKey: studioKeys.roles });
      void navigate(rolePath(copy.key));
    },
    onError: roleError,
  });

  return (
    <>
      <PageHeader
        title={
          <span className='inline-flex flex-wrap items-center gap-3'>
            {roleTitle(t, role)}
            {role.builtIn ? (
              <PmTag tone='blue'>{t('roles.builtIn')}</PmTag>
            ) : (
              <PmTag tone='grey'>{t('roles.custom')}</PmTag>
            )}
          </span>
        }
        description={t('roles.holders', { count: role.holderCount })}
        actions={
          canDefine ? (
            <>
              <Button
                variant='outline'
                disabled={duplicate.isPending}
                onClick={() => duplicate.mutate()}
              >
                <CopyIcon data-icon='inline-start' />
                {t('roles.duplicate')}
              </Button>
              {readOnly ? null : (
                <>
                  <Button
                    variant='outline'
                    disabled={!dirty || save.isPending}
                    onClick={() => {
                      setDraft(saved);
                      setTitle(roleTitle(t, role));
                    }}
                  >
                    {t('roles.discard')}
                  </Button>
                  <Button
                    disabled={!dirty || !title.trim() || save.isPending}
                    onClick={() => save.mutate()}
                  >
                    {t('roles.save')}
                  </Button>
                </>
              )}
            </>
          ) : undefined
        }
      />
      {!role.editable ? (
        <Alert>
          <AlertDescription>{t('roles.ownerReadOnly')}</AlertDescription>
        </Alert>
      ) : null}
      {!role.builtIn && !readOnly ? (
        <Field className='max-w-md'>
          <FieldLabel htmlFor='studio-role-title'>{t('roles.name')}</FieldLabel>
          <Input
            id='studio-role-title'
            value={title}
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>
      ) : null}
      <RoleEditor
        catalog={catalog}
        draft={draft}
        readOnly={readOnly}
        onChange={setDraft}
      />
    </>
  );
}

/**
 * `/config/roles/:roleKey`: one role as a covering page — the pages it opens, the settings it may change and
 * what each business action reaches (`RoleEditor`), saved by whoever holds `pm.members/define-roles`; everyone else
 * who may read the member settings sees it read-only. `owner` holds everything and is read-only.
 */
export default function RoleDetailPage(): ReactElement {
  const { roleKey = '' } = useParams();
  const { t } = useTranslation();
  const api = useStudioApi();
  const viewer = useViewer();
  const roles = useQuery({
    queryKey: studioKeys.roles,
    queryFn: () => api.roles(),
  });
  const catalog = useQuery({
    queryKey: studioKeys.catalog,
    queryFn: () => api.catalog(),
    staleTime: Infinity,
  });
  const role = roles.data?.find((item) => item.key === roleKey);
  // The header's trail names the role once it has loaded; until then the routes' `Settings › Roles › Role`.
  usePageBreadcrumb(
    role
      ? [
          { label: t('navigation.config'), to: '/config' },
          { label: t('config.nav.roles'), to: ROLES_PATH },
          { label: roleTitle(t, role) },
        ]
      : undefined,
  );
  const back = (
    <Button
      variant='outline'
      size='sm'
      nativeButton={false}
      render={<Link to={ROLES_PATH} />}
    >
      {t('roles.backToList')}
    </Button>
  );

  let body: ReactElement;
  if ((roles.isError && !roles.data) || (catalog.isError && !catalog.data))
    body = (
      <PmLoadError
        title={t('roles.loadFailed')}
        error={roles.error ?? catalog.error}
        action={back}
      />
    );
  else if (!roles.data || !catalog.data || !viewer) body = <PmDetailSkeleton />;
  else if (!role)
    body = (
      <Alert>
        <AlertTitle>{t('roles.notFound')}</AlertTitle>
        <AlertAction>{back}</AlertAction>
      </Alert>
    );
  else
    body = (
      <RoleBody
        key={`${role.key}:${JSON.stringify(requestOf(draftOf(role)))}`}
        catalog={catalog.data}
        role={role}
        canDefine={canUseSetting(viewer, 'pm.members', 'define-roles')}
      />
    );

  return (
    <RouteChildPage>
      <PageContainer>{body}</PageContainer>
    </RouteChildPage>
  );
}
