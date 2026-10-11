/**
 * Studio's own API around agents, signed in:
 *
 * | route                                          | what                                                          |
 * | ---------------------------------------------- | ------------------------------------------------------------- |
 * | `POST /organizeIntake` `OrganizeRequest`        | starts an intake conversation (`conversation/intake.ts`)     |
 * | `POST /intakeDrafts` `{ drafts }`              | an intake run hands its drafts back (`intake/`)               |
 * | `POST /failedRuns/:runId/decide` `{ action }`  | answers a failed run's inbox card (`failed-runs.ts`)          |
 * | `POST /designProposals` `{ issueId?, content }` | an issue's run submits its design proposal (`design.ts`)     |
 * | `GET /designProposals/:issueId`                | an issue's design proposal (`design.ts`, `shared/design.ts`)  |
 * | `POST /designProposals/:issueId/approve`, `/requestChanges` | decides it                                       |
 * | `GET /agentBoard`                              | the Agent queue's data (`board.ts`), with the issue list's filters (`q`, `projectId`, `labelId`, `ownerUserId`, `executorId`) |
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
import { studioInboxPortToken } from '../inbox/port.js';
import { PROJECTS_SOURCE } from '../inbox/projects.js';
import { studioInboxToken } from '../inbox/token.js';

import { INTAKE_SOURCE } from './catalog/sources.js';
import {
  intakeMessage,
  intakeTitle,
  OrganizeRequestSchema,
} from './conversation/intake.js';
import { INTAKE_PROPOSE_ACTION } from './commands/permissions.js';
import { createPermissionSource } from './commands/permissions.js';
import { createAskerLookup } from './conversation/acting.js';
import { createDesignService } from './design.js';
import { readAgentBoard, startAgentBoardIssue } from './board.js';
import { callerOfRequest, runSubjectOf } from './run-principal.js';
import { INTAKE_SUBJECT } from './intake/subject.js';
import { AGENT_KIND } from './tx.js';
import { createAgentWork } from './work.js';
import { decideFailedRun } from './failed-runs.js';
import { studioDelegationsToken } from './conversation/delegation-token.js';
import {
  AgentBoardQuery,
  AgentBoardSchema,
  AgentBoardStartResultSchema,
  DecideFailedRunInput,
  DelegationListQuery,
  DelegationParams,
  DelegationPatchInput,
  DelegationSchema,
  DesignDecisionInput,
  DesignProposalSubmittedSchema,
  DesignStateSchema,
  FailedRunResultSchema,
  IntakeDraftsDeliveredSchema,
  IntakeDraftsInput,
  IntakeStartedSchema,
  IssueParams,
  RunParams,
  SubmitDesignProposalInput,
} from './schemas.js';

const tags = ['Studio'];
const intakeFailureMessages: Record<IntakeUnavailableReason, string> = {
  INTAKE_NO_AGENT:
    'No usable default chat agent is configured. Choose a personal or team default agent.',
  INTAKE_MODEL_MISSING:
    'The selected online agent has no model configured. Configure its model before retrying.',
  INTAKE_MODEL_UNAVAILABLE:
    'The selected online agent\u2019s model is unavailable. Check its model service and enabled models.',
  INTAKE_NO_RUNNER:
    'No eligible online runner can run this agent for the caller. Check runtime status, tool sign-in and sharing policy.',
  INTAKE_AGENT_UNAVAILABLE:
    'The selected agent is unavailable or cannot be invoked by this user.',
};
/** What submitting a design proposal performs: it is a comment on the issue. */
const COMMENT_ACTION = 'pm.issues/comment';
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
            'When no default agent is configured (`INTAKE_NO_AGENT`), its model is missing or unavailable (`INTAKE_MODEL_MISSING`, `INTAKE_MODEL_UNAVAILABLE`), or no suitable runner is online (`INTAKE_NO_RUNNER`). No conversation is started.',
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
        // Chat availability includes this person's runner sharing permissions and the selected online model.
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
              'When the decision was already taken (`DECISION_ALREADY_TAKEN`).',
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

    // Design-first proposals (`design.ts`): the issue page's section and the owner's inbox card read and decide here.
    if (container.has(projectsToken)) {
      const design = createDesignService({
        projects: () => container.resolve(projectsToken),
        inbox: () =>
          container.has(studioInboxPortToken)
            ? container.resolve(studioInboxPortToken)
            : undefined,
      });
      // Per route: a person reads and decides; only an issue's run, its token scoped, submits.
      const designRoutes = new Hono();
      designRoutes.onError(studioErrorHandler);
      const askerOf = createAskerLookup(agents);
      const permissions = createPermissionSource(
        () =>
          container.has(projectsAccessToken)
            ? container.resolve(projectsAccessToken)
            : undefined,
        askerOf,
      );
      if (container.has(authorizationToken))
        designRoutes.post(
          '/',
          authentication.required({
            scopedKeys: true,
          }) as unknown as MiddlewareHandler,
          container
            .resolve(authorizationToken)
            .middleware() as unknown as MiddlewareHandler,
          describeRoute({
            tags,
            summary: 'Submit a design proposal for an issue',
            operationId: 'designProposalsSubmit',
            description:
              'Only the agent of a run on the issue, in the design-first flow: the issue defaults to the run’s. Submitting moves an issue in Analysis to Proposal review, which asks its owner; a new proposal replaces the earlier one. `meta.message` words the outcome.',
            security: runOnly,
            ...cliRoute({
              command: 'issue design-proposal',
              args: ['issueId'],
              flags: {
                issueId: { name: 'issue' },
                content: {
                  contentFile: true,
                  description:
                    'The proposal, in Markdown; write it to a file and pass it with --content-file.',
                },
              },
              action: COMMENT_ACTION,
              examples: ['issue design-proposal --content-file proposal.md'],
            }),
            responses: {
              200: dataResponse(DesignProposalSubmittedSchema),
              400: apiErrorResponse(400, 'When the proposal is empty.'),
              404: apiErrorResponse(404, 'When the issue does not exist.'),
              ...apiErrorResponses,
            },
          }),
          apiValidator('json', SubmitDesignProposalInput),
          async (context) => {
            const identity = callerOfRequest(context as unknown as Context);
            const own = runSubjectOf(identity, 'issue');
            if (!identity || !own)
              throw studioError(
                'PERMISSION_DENIED',
                'ISSUE_RUN_REQUIRED',
                'issue design-proposal is for an agent working on an issue.',
              );
            // A proposal is a comment on the issue: the agent must be given commenting.
            if (!(await agents.gate.allowed(identity)).has(COMMENT_ACTION))
              throw studioError(
                'PERMISSION_DENIED',
                'ACTION_NOT_ALLOWED',
                `issue design-proposal needs ${COMMENT_ACTION}, which this run does not hold.`,
              );
            const { issueId, content } = context.req.valid('json');
            const result = await design.propose(
              await permissions.viewerOf(identity),
              issueId ?? own,
              content,
              own,
            );
            return context.json({
              data: result,
              meta: {
                message: `Design proposal ${result.proposal.commentId} submitted; the issue is ${result.statusKey} now and waits for its owner.`,
              },
            });
          },
        );
      designRoutes.get(
        '/:issueId',
        required,
        describeRoute({
          tags,
          summary: 'Get an issue’s design proposal',
          operationId: 'designProposalsGetProposal',
          description: 'The issue is named by id or identifier.',
          ...cliRoute({
            command: 'design get',
            flags: { issueId: { name: 'issue' } },
          }),
          responses: {
            200: dataResponse(DesignStateSchema),
            404: apiErrorResponse(404),
            ...signedInErrors,
          },
        }),
        apiValidator('param', IssueParams),
        async (context) =>
          context.json({
            data: await design.state(
              await viewerOf(userIdOf(context)),
              context.req.valid('param').issueId,
            ),
          }),
      );
      const decisions = {
        approve: {
          summary: 'Approve an issue’s design proposal',
          operationId: 'designProposalsApprove',
          description:
            'The owner, the project lead or an administrator moves the issue to In progress; an optional comment goes with it.',
        },
        requestChanges: {
          summary: 'Send an issue’s design proposal back',
          operationId: 'designProposalsRequestChanges',
          description:
            'Anyone who may comment on the issue writes why (`comment` is required) and moves it back to Analysis.',
        },
      } as const;
      for (const action of ['approve', 'requestChanges'] as const)
        designRoutes.post(
          `/:issueId/${action}`,
          required,
          describeRoute({
            tags,
            ...decisions[action],
            ...cliRoute({
              command:
                action === 'approve'
                  ? 'design approve'
                  : 'design request-changes',
              flags: {
                issueId: { name: 'issue' },
                comment: { contentFile: true },
              },
              ...(action === 'approve'
                ? { examples: ['design approve PM-12'] }
                : {
                    examples: [
                      'design request-changes PM-12 --comment "Split the migration out."',
                    ],
                  }),
            }),
            responses: {
              200: dataResponse(DesignStateSchema),
              400: apiErrorResponse(
                400,
                'When the issue does not wait in Proposal review, has no proposal, or the comment is missing or too long.',
              ),
              404: apiErrorResponse(404),
              ...apiErrorResponses,
            },
          }),
          apiValidator('param', IssueParams),
          apiValidator('json', DesignDecisionInput),
          async (context) => {
            const request = context.req.valid('json');
            const viewer = await viewerOf(userIdOf(context));
            const { issueId } = context.req.valid('param');
            return context.json({
              data:
                action === 'approve'
                  ? await design.approve(viewer, issueId, request)
                  : await design.requestChanges(viewer, issueId, request),
            });
          },
        );
      router.route('/designProposals', designRoutes);
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
