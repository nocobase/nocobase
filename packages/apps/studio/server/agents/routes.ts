/**
 * Studio's own API around agents, signed in:
 *
 * | route                                          | what                                                          |
 * | ---------------------------------------------- | ------------------------------------------------------------- |
 * | `POST /organizeIntake` `OrganizeRequest`        | starts an intake conversation (`conversation/intake.ts`)     |
 * | `POST /intakeDrafts` `{ drafts }`              | an intake run hands its drafts back (`intake/`)               |
 * | `POST /failedRuns/:runId/decide` `{ action }`  | answers a failed run's inbox card (`failed-runs.ts`)          |
 * | `GET /agentBoard`                              | the Agent queue's data (`board.ts`), with the issue list's filters (`q`, `projectId`, `labelId`, `ownerUserId`, `executorId`) |
 * | `GET /agentBoard/issues/:issueId/agents/:agentId/wait` | exactly why the agent's queued run on the issue waits |
 * | `POST /agentBoard/issues/:issueId/start`       | "Start" on an idle issue                                      |
 * | `GET /delegations?conversationId=`             | the issues a conversation handed to agents (`conversation/delegation.ts`) |
 * | `GET`, `PATCH /delegations/:delegationId` `{ followed }` | one of them; stops or resumes following it          |
 *
 * Every answer is `{ data }`; errors are the standard body (`../http/errors.ts`).
 */
import { authenticationToken } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  cliRoute,
  dataResponse,
  defineApiRoutes,
  listResponse,
  describeRoute,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import {
  authorizationToken,
  type AuthorizationContext,
} from '@nocobase/app-plugin-authorization';
import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { z } from 'zod';

import { MESSAGE_CONTENT_MAX } from '@nocobase/app-plugin-agents/shared/conversations';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  noAbilities,
  noSettings,
} from '@nocobase/app-plugin-projects/shared/access';

import { studioError, studioErrorHandler } from '../http/errors.js';
import {
  intakeUnavailableReason,
  type IntakeUnavailableReason,
} from '../../shared/intake.js';
import { PROJECTS_SOURCE } from '../inbox/projects.js';
import { studioInboxToken } from '../inbox/token.js';

import { INTAKE_SOURCE } from './catalog/sources.js';
import {
  intakeMessage,
  intakeTitle,
  OrganizeRequestSchema,
} from './conversation/intake.js';
import { INTAKE_PROPOSE_ACTION } from './commands/permissions.js';
import {
  readAgentBoard,
  readAgentBoardWait,
  startAgentBoardIssue,
} from './board.js';
import { readIssueAgentWork } from './issue-agent-work.js';
import { callerOfRequest, runSubjectOf } from './run-principal.js';
import { INTAKE_SUBJECT } from './intake/subject.js';
import { AGENT_KIND } from './tx.js';
import { createAgentWork } from './work.js';
import { decideFailedRun } from './failed-runs.js';
import { studioDelegationsToken } from './conversation/delegation-token.js';
import {
  AgentBoardQuery,
  AgentBoardSchema,
  AgentBoardWaitParams,
  AgentBoardWaitSchema,
  AgentBoardStartResultSchema,
  IssueAgentWorkInput,
  IssueAgentWorkSchema,
  DecideFailedRunInput,
  DelegationListQuery,
  DelegationParams,
  DelegationPatchInput,
  DelegationSchema,
  FailedRunResultSchema,
  IntakeDraftsDeliveredSchema,
  IntakeDraftsInput,
  IntakeStartedSchema,
  IssueParams,
  RunParams,
} from './schemas.js';

const tags = ['Studio'];
const intakeFailureMessages: Record<IntakeUnavailableReason, string> = {
  INTAKE_NO_AGENT:
    'No usable default chat agent is configured. Choose a personal or team default agent.',
  INTAKE_NO_RUNNER:
    'No runner online can run this agent for the caller. Check that a runner reporting its tool and model is online and shared with the team.',
  INTAKE_AGENT_UNAVAILABLE:
    'The selected agent is unavailable or cannot be invoked by this user.',
};
/** Routes only an agent's run calls, with its run token. */
const runOnly: Record<string, string[]>[] = [{ runToken: [] }];
const signedInErrors = {
  401: apiErrorResponse(401),
  500: apiErrorResponse(500),
};

function userIdOf(context: Context): string {
  return (context.get('auth' as never) as { user: { id: string } }).user.id;
}

/** A router behind sign-in whose errors answer in the standard body. */
function signedIn(required: MiddlewareHandler): Hono {
  const routes = new Hono();
  routes.onError(studioErrorHandler);
  routes.use('*', required);
  return routes;
}

export const studioAgentsRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes(({ container }) => {
    // Without authentication or the agents plugin (an application's own tests) there is nothing to serve.
    if (!container.has(authenticationToken) || !container.has(agentsToken))
      return new Hono();
    const authentication = container.resolve(authenticationToken);
    const agents = container.resolve(agentsToken);
    const required = authentication.required() as unknown as MiddlewareHandler;

    const router = new Hono();
    const intake = signedIn(required);
    intake.post(
      '/',
      describeRoute({
        tags,
        summary: 'Start an intake conversation',
        operationId: 'organizeIntake',
        description:
          'Starts a conversation with an agent that organizes the text and files into issues; the caller must be allowed to wake the agent.',
        ...cliRoute({
          command: 'intake organize',
          flags: {
            text: { contentFile: true },
            agentId: { name: 'agent' },
            projectId: { name: 'project' },
            // The browser's own id for the message it shows at once.
            clientId: { hidden: true },
          },
          examples: ['intake organize --text-file notes.md --project 12'],
        }),
        responses: {
          200: dataResponse(IntakeStartedSchema),
          400: apiErrorResponse(
            400,
            'When the text and files together are longer than a message may be (`INTAKE_TOO_LONG`).',
          ),
          403: apiErrorResponse(403, 'When the caller may not wake the agent.'),
          409: apiErrorResponse(
            409,
            'When no default agent is configured (`INTAKE_NO_AGENT`), the agent is not enabled (`INTAKE_AGENT_UNAVAILABLE`), or no runner that can run it is online (`INTAKE_NO_RUNNER`). No conversation is started.',
          ),
          ...signedInErrors,
        },
      }),
      apiValidator('json', OrganizeRequestSchema),
      async (context) => {
        const request = context.req.valid('json');
        const text = intakeMessage({
          text: request.text,
          ...(request.projectId ? { projectId: request.projectId } : {}),
          files: request.files ?? [],
        });
        if ([...text].length > MESSAGE_CONTENT_MAX)
          throw studioError(
            'INVALID_ARGUMENT',
            'INTAKE_TOO_LONG',
            `The text and files are longer than a message may be (${MESSAGE_CONTENT_MAX} characters).`,
            {
              fieldViolations: [
                {
                  field: 'text',
                  description: `The text and files together exceed ${MESSAGE_CONTENT_MAX} characters.`,
                },
              ],
            },
          );
        const userId = userIdOf(context);
        // Chat availability includes whether the agent is enabled and the runners this person may use.
        // Reject before creating a conversation: an HTTP success with a queued run is not an intake handoff.
        const choices = await agents.conversations.chatAgents(userId);
        const agent = request.agentId
          ? choices.find((choice) => choice.id === request.agentId)
          : (choices.find((choice) => choice.isMyDefault) ??
            choices.find((choice) => choice.isSystemDefault));
        if (request.agentId && !agent)
          throw studioError(
            'PERMISSION_DENIED',
            'INTAKE_AGENT_UNAVAILABLE',
            'The selected agent is unavailable or cannot be invoked by this user.',
          );
        const reason = intakeUnavailableReason(agent);
        if (!agent || reason)
          throw studioError(
            'FAILED_PRECONDITION',
            reason ?? 'INTAKE_NO_AGENT',
            intakeFailureMessages[reason ?? 'INTAKE_NO_AGENT'],
            { httpStatus: 409 },
          );
        return context.json({
          data: await agents.conversations.start(userId, {
            source: INTAKE_SOURCE,
            text,
            title: request.title ?? intakeTitle(request.text),
            agentId: agent.id,
            ...(request.clientId ? { clientId: request.clientId } : {}),
          }),
        });
      },
    );
    router.route('/organizeIntake', intake);

    // `intake drafts`: the agent of a run on an intake request hands its drafts back, for the person who asked.
    if (container.has(projectsToken) && container.has(authorizationToken)) {
      const drafts = new Hono();
      drafts.onError(studioErrorHandler);
      drafts.use(
        '*',
        authentication.required({
          scopedKeys: true,
        }) as unknown as MiddlewareHandler,
      );
      drafts.use(
        '*',
        container
          .resolve(authorizationToken)
          .middleware() as unknown as MiddlewareHandler,
      );
      drafts.post(
        '/',
        describeRoute({
          tags,
          summary: 'Hand back an intake request’s issue drafts',
          operationId: 'intakeDraftsDeliver',
          description:
            'Only the agent of a run on an intake request, for that request. The drafts replace the asker’s current draft, rehearsed with their permissions; nothing is created until they click Create. A refusal names the drafts to fix. `meta.message` words the outcome.',
          security: runOnly,
          ...cliRoute({
            command: 'intake drafts',
            bodyFile: 'file',
            action: INTAKE_PROPOSE_ACTION,
            examples: ['intake drafts --file drafts.json'],
          }),
          responses: {
            200: dataResponse(IntakeDraftsDeliveredSchema),
            400: apiErrorResponse(
              400,
              'When a draft is not valid (`PLAN_INVALID`), naming the drafts to fix.',
            ),
            ...apiErrorResponses,
          },
        }),
        apiValidator('json', IntakeDraftsInput),
        async (context) => {
          const identity = callerOfRequest(context as unknown as Context);
          const jobId = runSubjectOf(identity, INTAKE_SUBJECT);
          const run = identity?.run?.run;
          const agent = identity?.agent;
          if (!jobId || !run || !agent)
            throw studioError(
              'PERMISSION_DENIED',
              'INTAKE_RUN_REQUIRED',
              'intake drafts is for an agent working on an intake request.',
            );
          const { job, plan } = await container
            .resolve(projectsToken)
            .intakeAi.deliver(jobId, context.req.valid('json'), {
              userId: run.actorUserId,
              actor: { type: AGENT_KIND, id: agent.id },
              proposer: { agentId: agent.id, runId: run.id },
            });
          const count = plan.rows.length;
          return context.json({
            data: {
              jobId: job.id,
              planId: plan.id,
              drafts: count,
              unknownLabels: [...job.unknownLabels],
              dropped: job.dropped,
            },
            meta: {
              message: `${count} draft${count === 1 ? '' : 's'} handed to ${plan.deciderName ?? plan.deciderUserId}, who reviews them and creates the issues.${
                job.unknownLabels.length > 0
                  ? ` Labels that do not exist were left out: ${job.unknownLabels.join(', ')}.`
                  : ''
              } End your turn now.`,
            },
          });
        },
      );
      router.route('/intakeDrafts', drafts);
    }

    // A signed-in person as the projects plugin sees them.
    const viewerOf = async (userId: string): Promise<Viewer> => ({
      userId,
      actor: { type: 'user', id: userId },
      permissions: (await (container.has(projectsAccessToken)
        ? container.resolve(projectsAccessToken).permissionsOfUser?.(userId)
        : undefined)) ?? {
        scopes: noAbilities(),
        settings: noSettings(),
      },
    });

    // A failed run's card needs the issues and the inbox too: without either there is no card to answer.
    if (container.has(projectsToken) && container.has(studioInboxToken)) {
      const failedRuns = signedIn(required);
      failedRuns.post(
        '/:runId/decide',
        describeRoute({
          tags,
          summary: 'Decide a failed run’s card',
          operationId: 'failedRunsDecide',
          description:
            'Retries the run, hands the issue to a person or cancels; the issue’s owner or someone who may edit it decides, once.',
          ...cliRoute({
            command: 'board failed-run decide',
            flags: { runId: { name: 'run' }, userId: { name: 'user' } },
            examples: [
              'board failed-run decide 42 --action retry',
              'board failed-run decide 42 --action reassign --user bob',
            ],
          }),
          responses: {
            200: dataResponse(FailedRunResultSchema),
            400: apiErrorResponse(
              400,
              'When the decision was already taken (`DECISION_ALREADY_TAKEN`) or the run has already been retried (`RUN_ALREADY_RETRIED`).',
            ),
            404: apiErrorResponse(
              404,
              'When no failed run on an issue has this id.',
            ),
            ...apiErrorResponses,
          },
        }),
        apiValidator('param', RunParams),
        apiValidator('json', DecideFailedRunInput),
        async (context) => {
          const { action, userId } = context.req.valid('json');
          return context.json({
            data: await decideFailedRun(
              {
                runs: agents.runs,
                projects: () => container.resolve(projectsToken),
                inbox: container.resolve(studioInboxToken),
                viewerOf,
              },
              userIdOf(context),
              context.req.valid('param').runId,
              { action, ...(userId ? { userId } : {}) },
            ),
          });
        },
      );
      router.route('/failedRuns', failedRuns);
    }

    // The Agent queue's data: as the issue list, for whoever signs in, limited to what they see.
    if (
      container.has(projectsToken) &&
      container.has(projectsAccessToken) &&
      container.has(authorizationToken)
    ) {
      const authorization = container.resolve(authorizationToken);
      const access = container.resolve(projectsAccessToken);
      const inbox = container.has(studioInboxToken)
        ? container.resolve(studioInboxToken)
        : null;
      const board = signedIn(required);
      board.use(
        '*',
        authorization.middleware() as unknown as MiddlewareHandler,
      );
      const viewerFrom = async (context: Context): Promise<Viewer> => {
        const authz = context.get('authz' as never) as AuthorizationContext;
        const userId = userIdOf(context);
        return {
          userId,
          actor: { type: 'user', id: userId },
          permissions: await access.permissionsOf(authz.identity),
        };
      };
      board.get(
        '/',
        describeRoute({
          tags,
          summary: 'Get the Agent queue',
          operationId: 'agentBoardGetBoard',
          description:
            'The issues agents are involved in that the caller may see, by section, with the issue list’s filters.',
          ...cliRoute({
            command: 'board get',
            flags: {
              projectId: { name: 'project' },
              labelId: { name: 'label' },
              ownerUserId: { name: 'owner' },
              executorId: { name: 'executor' },
            },
            examples: ['board get --project 12'],
          }),
          responses: {
            200: dataResponse(AgentBoardSchema),
            ...signedInErrors,
          },
        }),
        apiValidator('query', AgentBoardQuery),
        async (context) => {
          const authz = context.get('authz' as never) as AuthorizationContext;
          const filters = Object.fromEntries(
            Object.entries(context.req.valid('query')).filter(
              ([, value]) => value !== undefined,
            ),
          );
          return context.json({
            data: await readAgentBoard(
              {
                projects: () => container.resolve(projectsToken),
                agents,
                decisions: (source, type) =>
                  inbox
                    ? inbox.openDecisions(source, type)
                    : Promise.resolve([]),
                decisionSource: PROJECTS_SOURCE,
              },
              {
                viewer: await viewerFrom(context),
                readsAllRuns: await authz.can({
                  resource: { type: 'settings', id: 'agents.agents' },
                  action: 'read',
                }),
              },
              filters,
            ),
          });
        },
      );
      board.post(
        '/issueWork',
        describeRoute({
          tags,
          summary: 'Get current agent work on visible issues',
          operationId: 'agentBoardIssueWork',
          description:
            'At most 100 issue IDs. Only visible issues with an agent executor are returned. No run details are exposed.',
          ...cliRoute({ command: 'board issueWork' }),
          responses: {
            200: dataResponse(z.array(IssueAgentWorkSchema)),
            400: apiErrorResponse(400),
            ...signedInErrors,
          },
        }),
        apiValidator('json', IssueAgentWorkInput),
        async (context) =>
          context.json({
            data: await readIssueAgentWork(
              { projects: container.resolve(projectsToken), runs: agents.runs },
              await viewerFrom(context),
              context.req.valid('json').issueIds,
            ),
          }),
      );
      board.get(
        '/issues/:issueId/agents/:agentId/wait',
        describeRoute({
          tags,
          summary: 'Get why an agent’s queued run on an issue waits',
          operationId: 'agentBoardGetWait',
          description:
            'The exact reason a queued row of the Agent queue shows in short: the claim’s diagnosis of the run’s candidate runners. Needs a caller who sees the issue; the preparation detail only for one who could open the run. 404 `QUEUED_RUN_NOT_FOUND` when the agent has no queued run on the issue.',
          ...cliRoute({
            command: 'board wait',
            flags: {
              issueId: { name: 'issue' },
              agentId: { name: 'agent' },
            },
            examples: ['board wait PM-12 coder'],
          }),
          responses: {
            200: dataResponse(AgentBoardWaitSchema),
            404: apiErrorResponse(404),
            ...apiErrorResponses,
          },
        }),
        apiValidator('param', AgentBoardWaitParams),
        async (context) => {
          const authz = context.get('authz' as never) as AuthorizationContext;
          const { issueId, agentId } = context.req.valid('param');
          return context.json({
            data: await readAgentBoardWait(
              { projects: () => container.resolve(projectsToken), agents },
              {
                viewer: await viewerFrom(context),
                readsAllRuns: await authz.can({
                  resource: { type: 'settings', id: 'agents.agents' },
                  action: 'read',
                }),
              },
              issueId,
              agentId,
            ),
          });
        },
      );
      const work = createAgentWork({
        agents,
        projects: () => container.resolve(projectsToken),
      });
      board.post(
        '/issues/:issueId/start',
        describeRoute({
          tags,
          summary: 'Start the agent’s work on an idle issue',
          operationId: 'agentBoardStartIssue',
          ...cliRoute({
            command: 'board start',
            flags: { issueId: { name: 'issue' } },
            examples: ['board start PM-12'],
          }),
          description:
            'Needs a caller who sees the issue and may edit issues; nothing starts in backlog or while the issue waits for others (`skipped`).',
          responses: {
            200: dataResponse(AgentBoardStartResultSchema),
            400: apiErrorResponse(
              400,
              'When no agent executes the issue (`NO_AGENT_EXECUTOR`).',
            ),
            404: apiErrorResponse(404),
            ...apiErrorResponses,
          },
        }),
        apiValidator('param', IssueParams),
        async (context) =>
          context.json({
            data: await startAgentBoardIssue(
              { projects: () => container.resolve(projectsToken), work },
              await viewerFrom(context),
              context.req.valid('param').issueId,
            ),
          }),
      );
      router.route('/agentBoard', board);
    }
    // The issues a conversation handed to agents, for its owner: its event cards stop or resume following one.
    if (container.has(projectsToken) && container.has(studioDelegationsToken)) {
      const delegations = () => container.resolve(studioDelegationsToken);
      const delegationRoutes = signedIn(required);
      const notFound = apiErrorResponse(
        404,
        'When the caller owns no delegation with this id (`DELEGATION_NOT_FOUND`).',
      );
      delegationRoutes.get(
        '/',
        describeRoute({
          tags,
          summary: 'List the issues a conversation delegated',
          operationId: 'delegationsList',
          description:
            'The issues the caller’s conversation handed to agents through executed plans, oldest first, followed or not. A bounded list: one conversation’s.',
          ...cliRoute({
            command: 'delegation list',
            flags: { conversationId: { name: 'conversation' } },
            examples: ['delegation list --conversation c1'],
          }),
          responses: {
            200: listResponse(
              DelegationSchema,
              z.object({ total: z.number() }),
            ),
            ...signedInErrors,
          },
        }),
        apiValidator('query', DelegationListQuery),
        async (context) => {
          const data = await delegations().list(
            userIdOf(context),
            context.req.valid('query').conversationId,
          );
          return context.json({ data, meta: { total: data.length } });
        },
      );
      delegationRoutes.get(
        '/:delegationId',
        describeRoute({
          tags,
          summary: 'Get a delegation',
          operationId: 'delegationsGet',
          ...cliRoute({
            command: 'delegation get',
            flags: { delegationId: { name: 'delegation' } },
          }),
          responses: {
            200: dataResponse(DelegationSchema),
            404: notFound,
            ...signedInErrors,
          },
        }),
        apiValidator('param', DelegationParams),
        async (context) =>
          context.json({
            data: await delegations().get(
              userIdOf(context),
              context.req.valid('param').delegationId,
            ),
          }),
      );
      delegationRoutes.patch(
        '/:delegationId',
        describeRoute({
          tags,
          summary: 'Stop or resume following a delegation',
          operationId: 'delegationsUpdate',
          description:
            'With `followed: false` the conversation hears no more of the issue: no cards, no wakes.',
          ...cliRoute({
            command: 'delegation update',
            flags: { delegationId: { name: 'delegation' } },
            examples: ['delegation update 7 --followed false'],
          }),
          responses: {
            200: dataResponse(DelegationSchema),
            400: apiErrorResponse(400),
            404: notFound,
            ...signedInErrors,
          },
        }),
        apiValidator('param', DelegationParams),
        apiValidator('json', DelegationPatchInput),
        async (context) =>
          context.json({
            data: await delegations().update(
              userIdOf(context),
              context.req.valid('param').delegationId,
              context.req.valid('json'),
            ),
          }),
      );
      router.route('/delegations', delegationRoutes);
    }
    return router;
  });
