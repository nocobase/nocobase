/**
 * Studio's side of agent sessions (`@nocobase/app-plugin-agent-sessions`), joined at boot: a session may work for one
 * of the person's projects, the issues an agent in it creates or the person mentions with `#` are tied to the session
 * (`links.ts`), and the agent gets Studio's tools over MCP (`tools.ts`). Both act as the session's owner, through the projects plugin's own services and checks.
 */
import { agentSessionsToken } from '@nocobase/app-plugin-agent-sessions/server';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { FIXED_STATUSES } from '@nocobase/app-plugin-projects/shared/statuses';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { ServiceProvider } from '@nocobase/service-provider';

import { issueLinks } from './links.js';
import { studioTools } from './tools.js';

const PROJECTS_NAMESPACE = '@nocobase/app-plugin-projects';

export default class StudioAgentSessionsProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/agent-sessions';

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(agentSessionsToken) || !container.has(projectsToken))
      return Promise.resolve();
    const sessions = container.resolve(agentSessionsToken);
    const projects = container.resolve(projectsToken);
    const access = container.resolve(projectsAccessToken);
    const i18n = container.has(i18nToken)
      ? container.resolve(i18nToken)
      : undefined;

    const viewerOf = async (userId: string): Promise<Viewer> => ({
      userId,
      actor: { type: 'user', id: userId },
      permissions: await access.permissionsOfUser!(userId),
    });
    const english = new Map(
      FIXED_STATUSES.map((status) => [status.key, status.name]),
    );
    const statusNames = async (
      locale: string | undefined,
    ): Promise<(key: string) => string> => {
      const fallback = (key: string): string => english.get(key) ?? key;
      if (!i18n || !locale) return fallback;
      try {
        await i18n.ensureLocaleLoaded(locale);
        const t = i18n.getFixedT(PROJECTS_NAMESPACE, locale);
        return (key) => t(`status.${key}`, { defaultValue: fallback(key) });
      } catch {
        return fallback;
      }
    };

    sessions.registerProjects({
      list: async (reader) =>
        (await projects.projects.list(await viewerOf(reader.userId))).map(
          (project) => ({ id: project.id, name: project.name }),
        ),
    });
    sessions.registerLinkKind(
      'issue',
      issueLinks({ projects, viewerOf, statusNames }),
    );
    sessions.registerTools('studio', studioTools({ projects, viewerOf }));
    return Promise.resolve();
  }
}
