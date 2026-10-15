/**
 * The scopes of variables and default skills Studio registers with the agents plugin: a project (`project`), whose
 * variables and default skills every run in it gets, and a project's working directory (`workdir`, a project resource
 * id). Whoever may see the project reads them; its managers change them (the projects plugin decides).
 */
import type {
  ScopeAccess,
  ScopeKind,
} from '@nocobase/app-plugin-agents/server/tokens';
import type { Projects } from '@nocobase/app-plugin-projects/server/tokens';

import { STUDIO_NAMESPACE } from '../../../shared/access.js';
import type { PermissionSource } from '../commands/permissions.js';

/** The scope of a project's own variables and default skills. */
export const PROJECT_SCOPE = 'project';

const text = (key: string) => ({ key, ns: STUDIO_NAMESPACE });

export function studioScopes(deps: {
  readonly projects: () => Pick<Projects, 'projects'>;
  readonly permissions: Pick<PermissionSource, 'viewerOf'>;
}): ScopeKind[] {
  const describe =
    (target: 'project' | 'workdir') =>
    async (ids: readonly string[], userId: string) => {
      const viewer = await deps.permissions.viewerOf({
        kind: 'user',
        userId,
        displayName: userId,
      });
      const names = await deps
        .projects()
        .projects.targetNames(viewer, target, ids);
      return new Map(
        [...names].map(([id, item]) => [
          id,
          {
            name: item.name,
            ...(target === 'project'
              ? {
                  href: `/projects/${encodeURIComponent(item.projectId)}/settings`,
                }
              : {}),
          },
        ]),
      );
    };
  async function accessTo(
    userId: string,
    target: { projectId: string } | { resourceId: string },
  ): Promise<ScopeAccess | null> {
    const viewer = await deps.permissions.viewerOf({
      kind: 'user',
      userId,
      displayName: userId,
    });
    const access = await deps.projects().projects.accessTo(viewer, target);
    return access ? { visible: access.visible, manage: access.manage } : null;
  }
  return [
    {
      key: PROJECT_SCOPE,
      title: text('studioAgents.scopes.project'),
      description: text('studioAgents.scopes.projectDescription'),
      access: (scopeId, userId) => accessTo(userId, { projectId: scopeId }),
      describe: describe('project'),
    },
    {
      key: 'workdir',
      title: text('studioAgents.scopes.workdir'),
      description: text('studioAgents.scopes.workdirDescription'),
      access: (scopeId, userId) => accessTo(userId, { resourceId: scopeId }),
      describe: describe('workdir'),
    },
  ];
}
