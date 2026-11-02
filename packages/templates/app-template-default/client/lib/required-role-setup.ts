import type { UsersClient } from '@nocobase/app-plugin-users/client/user-client';
import {
  setupInspectionFailure,
  type SetupInspection,
  type SetupInspections,
} from '../components/setup-readiness-state.js';
import { safeReturnTo } from './return-to.js';

function isReadonlyArray<T>(
  value: readonly T[] | undefined,
): value is readonly T[] {
  return Array.isArray(value);
}

export interface RequiredSetupRole {
  readonly scope: string;
  readonly role: string;
  /** A localized business label; never render the role key as a title. */
  readonly title: string;
  readonly description: string;
}
export function requiredRoleSetupId(
  role: Pick<RequiredSetupRole, 'scope' | 'role'>,
): string {
  return JSON.stringify([role.scope, role.role]);
}
export function requiredRoleSetupLink(
  role: Pick<RequiredSetupRole, 'scope' | 'role'>,
  returnTo: string,
): string {
  const query = new URLSearchParams({
    roleScope: role.scope,
    role: role.role,
    status: 'enabled',
  });
  const source = safeReturnTo(returnTo);
  if (source) query.set('returnTo', source);
  return `/settings/users?${query}`;
}

/** One metadata read and one bounded read per distinct required role. No writes. */
export async function inspectRequiredRoles(
  client: Pick<UsersClient, 'options' | 'list'>,
  requirements: readonly RequiredSetupRole[],
): Promise<SetupInspections> {
  const unique = [
    ...new Map(
      requirements.map((role) => [requiredRoleSetupId(role), role]),
    ).values(),
  ];
  if (unique.length === 0) return {};
  const options = await client.options();
  const roleScopes = options?.roleScopes;
  if (!isReadonlyArray(roleScopes))
    return Object.fromEntries(
      unique.map((role) => [
        requiredRoleSetupId(role),
        { status: 'unknown', reason: 'invalid' },
      ]),
    );
  const entries = await Promise.all(
    unique.map(
      async (requirement): Promise<readonly [string, SetupInspection]> => {
        const id = requiredRoleSetupId(requirement);
        const scope = roleScopes.find(
          (scope) => scope?.key === requirement.scope,
        );
        const role = isReadonlyArray(scope?.options)
          ? scope.options.find((role) => role?.value === requirement.role)
          : undefined;
        // Metadata offers direct selectable roles; authenticated defaults apply separately.
        if (!scope || !role)
          return [id, { status: 'unknown', reason: 'invalid' }];
        try {
          const page = await client.list({
            roleScope: requirement.scope,
            role: requirement.role,
            status: 'enabled',
            page: 1,
            pageSize: 1,
          });
          if (!Number.isSafeInteger(page?.total) || page.total < 0)
            return [id, { status: 'unknown', reason: 'invalid' }];
          return [
            id,
            {
              status: page.total > 0 ? 'ready' : 'missing',
              canConfigure: role.assignable !== false,
            },
          ];
        } catch (error: unknown) {
          return [id, setupInspectionFailure(error)];
        }
      },
    ),
  );
  return Object.fromEntries(entries);
}
