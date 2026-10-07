/**
 * The projects a scoped API key may be limited to, for the application's key editor: the API keys plugin's
 * `KeyScopeObjectSource` shape, written here without depending on that plugin. It lists only the projects the
 * identity may see, by this plugin's own rules.
 */
import type { AuthorizationIdentity } from '@nocobase/authorization/core';
import type { ServiceResolver } from '@nocobase/service-provider';

import type { Viewer } from './access/viewer.js';
import { projectsAccessToken, projectsToken } from './tokens.js';

export interface ProjectsKeyScopeObjects {
  list(input: {
    readonly identity: AuthorizationIdentity;
    readonly search?: string;
    readonly ids?: readonly string[];
  }): Promise<{ id: string; title: string; description?: string }[]>;
}

/** Reads the plugin's services and the application's roles from `container` on each use. */
export function projectsKeyScopeObjects(
  container: Pick<ServiceResolver, 'resolve'>,
): ProjectsKeyScopeObjects {
  return {
    async list({ identity, search, ids }) {
      const userId = identity.principal.id;
      const projects = identity.keyScope?.objects('pm.projects') ?? 'all';
      const viewer: Viewer = {
        userId,
        actor: { type: 'user', id: userId },
        permissions: await container
          .resolve(projectsAccessToken)
          .permissionsOf(identity),
        ...(projects === 'all' ? {} : { projectIds: projects }),
      };
      const needle = search?.trim().toLowerCase();
      return (await container.resolve(projectsToken).projects.list(viewer))
        .filter(
          (project) =>
            (!ids || ids.includes(project.id)) &&
            (!needle || project.name.toLowerCase().includes(needle)),
        )
        .map((project) => ({ id: project.id, title: project.name }));
    },
  };
}
