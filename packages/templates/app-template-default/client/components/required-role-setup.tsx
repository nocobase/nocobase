import { useCallback, useMemo, type ReactElement } from 'react';
import { Link, useLocation } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { UsersClient } from '@nocobase/app-plugin-users/client/user-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { SetupReadiness } from './setup-readiness.js';
import { useSetupReadiness } from './setup-readiness-state.js';
import {
  inspectRequiredRoles,
  requiredRoleSetupId,
  requiredRoleSetupLink,
  type RequiredSetupRole,
} from '../lib/required-role-setup.js';

/** Mount on the dependent feature with its actual required roles, memoized by the host. */
export function RequiredRoleSetup({
  roles,
  refreshKey = '',
}: {
  readonly roles: readonly RequiredSetupRole[];
  readonly refreshKey?: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const api = useApiClient();
  const client = useMemo(() => new UsersClient(api), [api]);
  const location = useLocation();
  const enabled = roles.length > 0;
  const read = useCan(
    { resource: { type: 'user', id: '*' }, action: 'read' },
    { enabled },
  );
  const assign = useCan(
    { resource: { type: 'user', id: '*' }, action: 'assign-role' },
    { enabled },
  );
  const source = `${location.pathname}${location.search}${location.hash}`;
  const checks = useMemo(
    () => [
      ...new Map(
        roles.map((role) => [
          requiredRoleSetupId(role),
          {
            id: requiredRoleSetupId(role),
            title: role.title,
            description: role.description,
            action: assign.can ? (
              <Button
                variant='outline'
                size='sm'
                aria-label={t('settings.setup.manageMembersFor', {
                  role: role.title,
                })}
                render={<Link to={requiredRoleSetupLink(role, source)} />}
              >
                {t('settings.setup.manageMembers')}
              </Button>
            ) : undefined,
          },
        ]),
      ).values(),
    ],
    [roles, assign.can, source, t],
  );
  const inspect = useCallback(
    () => inspectRequiredRoles(client, roles),
    [client, roles],
  );
  const state = useSetupReadiness(checks, inspect, {
    enabled: read.can,
    refreshKey: `${location.key}:${refreshKey}`,
  });
  if (!read.can) return null;
  return (
    <SetupReadiness
      state={state}
      labels={{
        title: t('settings.setup.title'),
        checking: t('settings.setup.checking'),
        checkAgain: t('settings.setup.checkAgain'),
        ready: t('settings.setup.ready'),
        missing: t('settings.setup.missing'),
        unknown: {
          unavailable: t('settings.setup.unavailable'),
          signIn: t('settings.setup.signIn'),
          forbidden: t('settings.setup.forbidden'),
          invalid: t('settings.setup.invalid'),
        },
      }}
    />
  );
}
