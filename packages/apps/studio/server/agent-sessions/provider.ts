/**
 * Studio's side of agent sessions (`@nocobase/app-plugin-agent-sessions`), joined at boot: a session may work for one
 * of the person's projects, the issues an agent in it creates or the person mentions with `#` are tied to the session
 * (`links.ts`), and the agent gets Studio's tools over MCP (`tools.ts`). Both act as the session's owner, through the projects plugin's own services and checks.
 * The agent is told to talk the work through and hand development to the project manager as issues (`INSTRUCTIONS`).
 * What happens in a session while its owner is not looking reaches their inbox (`../inbox/agent-sessions.ts`).
 */
import { agentSessionsToken } from '@nocobase/app-plugin-agent-sessions/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import { FIXED_STATUSES } from '@nocobase/app-plugin-projects/shared/statuses';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import { ServiceProvider } from '@nocobase/service-provider';

import { STUDIO_NAMESPACE } from '../../shared/access.js';
import type { WaitReason } from '../../shared/task-groups.js';
import { agentSessionNotices } from '../inbox/agent-sessions.js';
import enUS from '../locales/en-US.js';
import { studioInboxPortToken } from '../inbox/port.js';
import { issueLinks } from './links.js';
import { studioTools } from './tools.js';

const PROJECTS_NAMESPACE = '@nocobase/app-plugin-projects';

/**
 * The person's own agent talks the work through; Studio's project manager runs it once the person starts its issues,
 * as with the chat agents' operation plans (`agents/conversation/rules.ts`).
 */
const INSTRUCTIONS = [
  "You are the person's own agent: mostly you discuss, analyze and plan with them. Read code and run commands freely to understand things.",
  "Development work is not yours to do here. Once you and the person agree on it, record it with `create_issues`: when they start the issues from this session, Studio's project manager takes them over, gives each step to the agents that fit, and moves them along.",
  'A very small change, such as a typo or a one-line fix, you may make directly; say what you changed. Do bigger work here only when the person explicitly asks you to, and when unsure whether something is small, ask whether to record it.',
]
  .map((line) => `- ${line}`)
  .join('\n');

export function sessionInstructions(locale: string): string {
  return `${INSTRUCTIONS}\n- The person's current Studio interface language is ${locale}. When creating tasks (issues), write both titles and descriptions in that language. If the person explicitly requests another task language, follow their request. Do not infer the task language from the chat text. This task-language rule takes precedence over repository rules that require English for code, commits or pull requests. Keep technical identifiers, code, file paths and product names in their original form when appropriate. Do not translate or rewrite existing tasks automatically. The current interface language applies to subsequent task creation, including when this session resumes or the person switches language.`;
}

export default class StudioAgentSessionsProvider extends ServiceProvider<Application> {
  public readonly name: string = 'studio/agent-sessions';

  public override boot(): Promise<void> {
    const { container } = this.app;
    if (!container.has(agentSessionsToken) || !container.has(projectsToken))
      return Promise.resolve();
    const sessions = container.resolve(agentSessionsToken);
    const projects = container.resolve(projectsToken);
    const progress = container.has(agentsToken)
      ? { agents: container.resolve(agentsToken), projects }
      : undefined;
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

    const englishWaits = enUS.taskWaits;
    const waitNames = async (
      locale: string | undefined,
    ): Promise<(reason: WaitReason) => string> => {
      const fallback = (reason: WaitReason): string => englishWaits[reason];
      if (!i18n || !locale) return fallback;
      try {
        await i18n.ensureLocaleLoaded(locale);
        const t = i18n.getFixedT(STUDIO_NAMESPACE, locale);
        return (reason) =>
          t(`taskWaits.${reason}`, { defaultValue: fallback(reason) });
      } catch {
        return fallback;
      }
    };

    sessions.registerInstructions(({ locale }) =>
      sessionInstructions(locale ?? i18n?.getLocale() ?? 'en-US'),
    );
    if (container.has(studioInboxPortToken))
      sessions.registerNotices(
        agentSessionNotices(() => container.resolve(studioInboxPortToken)),
      );
    sessions.registerProjects({
      list: async (reader) =>
        (await projects.projects.list(await viewerOf(reader.userId))).map(
          (project) => ({ id: project.id, name: project.name }),
        ),
    });
    sessions.registerLinkKind(
      'issue',
      issueLinks({ projects, viewerOf, statusNames, waitNames, progress }),
    );
    sessions.registerTools(
      'studio',
      studioTools({ projects, viewerOf, progress }),
    );
    return Promise.resolve();
  }
}
