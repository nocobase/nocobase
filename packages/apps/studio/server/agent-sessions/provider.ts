/**
 * Studio's side of agent sessions (`@nocobase/app-plugin-agent-sessions`), joined at boot: a session may work for one
 * of the person's projects, the issues an agent in it creates or the person mentions with `#` are tied to the session
 * (`links.ts`), and the agent uses the CLI as the signed-in owner.
 * The agent is told to talk the work through and hand development to the project manager as issues (`INSTRUCTIONS`).
 * What happens in a session while its owner is not looking reaches their inbox (`../inbox/agent-sessions.ts`).
 */
import {
  agentSessionsToken,
  AgentSessionsError,
} from '@nocobase/app-plugin-agent-sessions/server';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsAccessToken,
  projectsIssueSessionToken,
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
import { progressOf } from './progress.js';
import { ApiError } from '@nocobase/app-server/router';

const PROJECTS_NAMESPACE = '@nocobase/app-plugin-projects';

/**
 * The person's own agent talks the work through; Studio's project manager runs it once the person starts its issues,
 * as with the chat agents' operation plans (`agents/conversation/rules.ts`).
 */
const INSTRUCTIONS = [
  "You are the person's own agent: mostly you discuss, analyze and plan with them. Read code and run commands freely to understand things.",
  'Use `nb-studio` for Studio and read the `nb-studio-cli` skill for planning, searching and recording work. Use `nb-studio session work` for the work tied to this session.',
  "Once the person starts the recorded tasks, Studio's project manager takes over development and delegates its steps.",
  'Combine related requirements that share code, a pull request and acceptance criteria into as few tasks as practical.',
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
    container.instance(projectsIssueSessionToken, {
      creationContext: async (viewer, sessionId) => {
        try {
          const context = await sessions.creationContext(
            viewer.userId,
            sessionId,
          );
          return {
            ...context,
            link: (issueId: string) =>
              sessions.link(sessionId, 'issue', issueId),
          };
        } catch (error) {
          if (!(error instanceof AgentSessionsError)) throw error;
          // The projects router must preserve the session boundary's failure, never fall back to ordinary creation.
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'SESSION_CONTEXT_REFUSED',
            domain: 'agentSessions',
            message:
              'The session is unavailable to this caller or is archived.',
          });
        }
      },
      progress: async (viewer, issue) =>
        progress
          ? ((await progressOf(progress, [issue], viewer.userId)).get(
              issue.id,
            ) ?? null)
          : null,
    });
    return Promise.resolve();
  }
}
