import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  knowledgeAccessToken,
  type KnowledgeAccessResolver,
} from '@nocobase/app-plugin-knowledge/server';
import type { KnowledgeAccess } from '@nocobase/app-plugin-knowledge/shared/knowledge';
import { ServiceProvider } from '@nocobase/service-provider';

import { knowledgeSpace } from '../../shared/knowledge-spaces.js';

const denied: KnowledgeAccess = {
  read: false,
  propose: false,
  edit: false,
  manage: false,
};

/** Every catalog space is related to authenticated users, but still requires explicit business grants. */
export default class KnowledgeAccessProvider extends ServiceProvider<Application> {
  public readonly name = 'examples/knowledge-access';

  public override register(): void {
    const resolver: KnowledgeAccessResolver = {
      space: (space) => {
        const found = knowledgeSpace(space);
        return found ? { scope: found.scope, scopeId: found.scopeId } : null;
      },
      inherits: () => [],
      title: (space) => Promise.resolve(knowledgeSpace(space)?.title ?? null),
      names: () => Promise.resolve(new Map()),
      forReader: (reader) => {
        const context = async () => {
          const authz = this.app.container.resolve(authorizationToken);
          const principal = { type: 'user', id: reader.userId };
          return authz.for({
            principal,
            subjects: [
              { type: 'authenticated', id: '*' },
              ...(await authz.subjects.resolveFor(principal)),
            ],
          });
        };
        let pending: ReturnType<typeof context> | undefined;
        return {
          access: async (space) => {
            if (!knowledgeSpace(space) || !reader.userId) return denied;
            const authorization = await (pending ??= context());
            const can = async (action: keyof KnowledgeAccess) => {
              if (reader.actor && (action === 'edit' || action === 'manage'))
                return false;
              const resource = { type: 'kb', id: 'kb.knowledge' };
              return (
                (await authorization.can({
                  resource,
                  action: `${action}.all`,
                })) ||
                (await authorization.can({
                  resource,
                  action: `${action}.related`,
                }))
              );
            };
            const [read, propose, edit, manage] = await Promise.all([
              can('read'),
              can('propose'),
              can('edit'),
              can('manage'),
            ]);
            return { read, propose, edit, manage };
          },
        };
      },
    };
    this.app.container.instance(knowledgeAccessToken, resolver);
  }
}
