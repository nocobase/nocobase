/**
 * Studio's tools for the agent in a person's session (the MCP server `studio`): the projects the person may see, and
 * their issues, which people see as tasks. Every call acts as the session's owner, with what their roles allow. Issues
 * the agent creates are tied to the session and wait in Backlog until the person starts them there.
 */
import {
  defineSessionTool,
  type SessionTool,
} from '@nocobase/app-plugin-agent-sessions/server';
import type {
  Projects,
  Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  BACKLOG_STATUS,
  STATUS_KEYS,
} from '@nocobase/app-plugin-projects/shared/statuses';
import { z } from 'zod';

import { progressOf, type ProgressDeps } from './progress.js';

export interface StudioToolDeps {
  readonly projects: Projects;
  readonly viewerOf: (userId: string) => Promise<Viewer>;
  /** How issues are going; left out where the agents plugin is not installed. */
  readonly progress?: ProgressDeps | undefined;
}

export function studioTools({
  projects,
  viewerOf,
  progress,
}: StudioToolDeps): SessionTool[] {
  return [
    defineSessionTool({
      name: 'list_projects',
      description:
        'Lists the Studio projects the person can see, with their ids. Pass a project id to `create_issues` and `search_issues`; a session that works for a project uses it when you pass none.',
      input: z.object({}),
      run: async (_, { userId }) =>
        (await projects.projects.list(await viewerOf(userId))).map(
          (project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
          }),
        ),
    }),
    defineSessionTool({
      name: 'create_issues',
      description:
        "Records work as issues in a Studio project (people see them as tasks) and ties them to this session. Each issue waits in Backlog: nothing runs until the person starts it from this session, which hands it to Studio's project manager: it plans the work, gives each step to the agents that fit, and moves the issue along. Give each issue a title a teammate understands at a glance, and a description with the context, the decisions taken in this conversation, and what done means. Create issues when the person asks to, or when you agree on work to record; ask which project when it is unclear.",
      input: z.object({
        projectId: z.string().min(1).optional().meta({
          description:
            "The project, from `list_projects`; the session's project when left out.",
        }),
        issues: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              description: z
                .string()
                .max(20_000)
                .optional()
                .meta({ description: 'Markdown.' }),
            }),
          )
          .min(1)
          .max(20),
      }),
      // Each issue on its own, so one refused does not hide those already created.
      run: async (input, { userId, projectId, link }) => {
        const inProject = input.projectId ?? projectId;
        if (!inProject)
          throw new Error(
            'This session works for no project: pass `projectId`, from `list_projects`.',
          );
        const viewer = await viewerOf(userId);
        const created: { identifier: string; title: string }[] = [];
        const failed: { title: string; error: string }[] = [];
        for (const issue of input.issues) {
          try {
            const made = await projects.issues.create(viewer, {
              projectId: inProject,
              title: issue.title,
              ...(issue.description ? { description: issue.description } : {}),
              statusKey: BACKLOG_STATUS,
            });
            created.push({ identifier: made.identifier, title: made.title });
            await link('issue', made.id);
          } catch (error) {
            failed.push({
              title: issue.title,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
        if (created.length === 0)
          throw new Error(
            failed.map((entry) => `${entry.title}: ${entry.error}`).join('\n'),
          );
        return failed.length > 0 ? { created, failed } : { created };
      },
    }),
    defineSessionTool({
      name: 'search_issues',
      description:
        'Finds issues the person can see, newest activity first, by words in their title or description, project and status. Use it to check whether work is already recorded before creating issues.',
      input: z.object({
        query: z.string().max(200).optional(),
        projectId: z.string().optional(),
        status: z.enum(STATUS_KEYS as [string, ...string[]]).optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      run: async (input, { userId }) => {
        const page = await projects.issueQueries.page(await viewerOf(userId), {
          ...(input.query ? { q: input.query } : {}),
          ...(input.projectId ? { projectId: input.projectId } : {}),
          ...(input.status ? { statusKey: input.status } : {}),
          limit: input.limit,
        });
        return page.data.map((issue) => ({
          identifier: issue.identifier,
          title: issue.title,
          status: issue.statusKey,
          project: issue.project?.name ?? null,
          executor: issue.executorName,
          updatedAt: issue.updatedAt,
        }));
      },
    }),
    defineSessionTool({
      name: 'get_issue',
      description:
        'Reads one issue: its description, status, project, owner and executor, and how it is going: who works on it, what it waits for, its pull request.',
      input: z.object({
        issue: z
          .string()
          .min(1)
          .meta({ description: 'Its identifier, such as `ST-12`.' }),
      }),
      run: async (input, { userId }) => {
        const issue = await projects.issueQueries.detail(
          await viewerOf(userId),
          input.issue,
        );
        return {
          identifier: issue.identifier,
          title: issue.title,
          description: issue.description,
          status: issue.statusKey,
          project: issue.project?.name ?? null,
          owner: issue.owner?.name ?? null,
          executor: issue.executorName,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
          progress: progress
            ? ((await progressOf(progress, [issue], userId)).get(issue.id) ??
              null)
            : null,
        };
      },
    }),
  ];
}
