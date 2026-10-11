/** The input and answers of Studio's agent routes (`routes.ts`). */
import { z } from 'zod';

import {
  AGENT_BOARD_STATES,
  AGENT_IDLE_REASONS,
  AGENT_WAIT_KINDS,
  type AgentBoardStartResult,
} from '../../shared/agent-board.js';
import type { Delegation } from '../../shared/delegations.js';
import type { DesignProposal, DesignState } from '../../shared/design.js';
import type { FailedRunResult } from './failed-runs.js';
import { RUN_FAILED_ACTIONS } from './notices.js';

export const IssueParams = z.object({ issueId: z.string().min(1) });

export const RunParams = z.object({ runId: z.string().min(1) });

export const DecideFailedRunInput = z
  .strictObject({
    action: z.enum(RUN_FAILED_ACTIONS),
    /** For `reassign`: the person who takes the issue over. */
    userId: z.string().min(1).optional(),
  })
  .refine((input) => input.action !== 'reassign' || input.userId, {
    path: ['userId'],
    message: 'The person who takes the issue over is required.',
  });

export const DesignDecisionInput = z.strictObject({
  comment: z.string().optional(),
});

const filter = z
  .string()
  .trim()
  .transform((value) => value.slice(0, 200) || undefined)
  .optional();

export const AgentBoardQuery = z.object({
  q: filter,
  projectId: filter,
  labelId: filter,
  ownerUserId: filter,
  executorId: filter,
});

// ---------------------------------------------------------------------------------------------------------------------
// What the routes answer
// ---------------------------------------------------------------------------------------------------------------------

const dateTime = () => z.string().meta({ format: 'date-time' });

/** The agents plugin's `SendMessageResult`, its message and conversation left open. */
export const IntakeStartedSchema = z.object({
  message: z.record(z.string(), z.unknown()).meta({
    description:
      'The first message, as the agents plugin’s conversation API returns it.',
  }),
  run: z
    .object({
      id: z.string(),
      outcome: z.enum(['created', 'merged', 'appended']),
    })
    .nullable()
    .meta({
      description:
        'The run the message woke; null when the agent is unavailable.',
    }),
  conversation: z.record(z.string(), z.unknown()).meta({
    description:
      'The new conversation, as the agents plugin’s conversation API returns it.',
  }),
});

export const FailedRunResultSchema: z.ZodType<FailedRunResult> = z.object({
  outcome: z.string().meta({
    description: 'How the card ended: `retried`, `reassigned` or `cancelled`.',
  }),
  runId: z
    .string()
    .optional()
    .meta({ description: 'For `retry`: the new run.' }),
});

const DesignProposalSchema: z.ZodType<DesignProposal> = z.object({
  commentId: z.string(),
  content: z.string().meta({ description: 'Markdown.' }),
  authorType: z.string(),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  createdAt: dateTime(),
});

export const DesignStateSchema: z.ZodType<DesignState> = z
  .object({
    issueId: z.string(),
    statusKey: z.string(),
    inReview: z.boolean().meta({
      description: 'The issue waits in Proposal review.',
    }),
    proposal: DesignProposalSchema.nullable().meta({
      description: 'The newest proposal; null before the first.',
    }),
    canApprove: z.boolean(),
    canRequestChanges: z.boolean(),
  })
  .meta({ ref: 'StudioDesignState' });

export const AgentBoardStartResultSchema: z.ZodType<AgentBoardStartResult> =
  z.object({
    started: z.boolean(),
    skipped: z.string().nullable().meta({
      description: 'Why nothing started, such as the issue being in backlog.',
    }),
  });

const PersonSchema = z.object({
  userId: z.string(),
  name: z.string().nullable(),
});

const AgentBoardEntrySchema = z
  .object({
    agentId: z.string(),
    state: z.enum(AGENT_BOARD_STATES),
    run: z
      .object({
        id: z.string().nullable().meta({
          description: 'Null when the viewer may not see the run.',
        }),
        status: z.enum(['queued', 'dispatched', 'running']),
        since: dateTime(),
        trigger: z.string().nullable(),
        runnerName: z.string().nullable(),
        tool: z.string().nullable(),
        model: z.string().nullable(),
        lastActivity: z
          .object({
            at: dateTime(),
            type: z.string(),
            tool: z.string().nullable(),
            text: z.string().nullable(),
          })
          .nullable(),
        attempt: z.number().int(),
        maxAttempts: z.number().int(),
        priority: z.number(),
      })
      .nullable(),
    queue: z
      .object({
        reason: z.string(),
        params: z
          .record(
            z.string(),
            z.union([z.string(), z.number(), z.array(z.string())]),
          )
          .optional(),
        position: z.number().int().nullable(),
        agentPosition: z.number().int(),
        until: dateTime().nullable(),
        tool: z.string().nullable(),
        missing: z.array(z.string()),
        detail: z.string().nullable(),
      })
      .nullable()
      .meta({ description: 'For `queued` with a run: why it waits.' }),
    blockedBy: z
      .array(
        z.object({
          issueId: z.string(),
          identifier: z.string(),
          title: z.string(),
        }),
      )
      .nullable(),
    waiting: z
      .object({
        kind: z.enum(AGENT_WAIT_KINDS),
        since: dateTime().nullable(),
        waitingFor: z.array(PersonSchema),
        viewerDecides: z.boolean(),
        path: z.string(),
        detail: z.string().nullable(),
      })
      .nullable(),
    idle: z
      .object({
        reason: z.enum(AGENT_IDLE_REASONS),
        lastRun: z
          .object({
            status: z.enum(['completed', 'failed', 'cancelled']),
            at: dateTime(),
          })
          .nullable(),
        mayStart: z.boolean(),
      })
      .nullable(),
  })
  .meta({ ref: 'StudioAgentBoardEntry' });

const count = z.number().int();

/** `AgentBoard`; the issue of each row is the projects plugin's issue list item, left open here. */
export const AgentBoardSchema = z.object({
  rows: z.array(
    AgentBoardEntrySchema.extend({
      issue: z.record(z.string(), z.unknown()).meta({
        description:
          'The issue as the projects plugin’s issue list returns it.',
      }),
      others: z.array(AgentBoardEntrySchema),
      mine: z.boolean(),
    }),
  ),
  agents: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      nameText: z.object({ key: z.string(), ns: z.string() }).nullable().meta({
        description:
          'Its name as an i18n reference, for an agent the application ships; null for one people named.',
      }),
      avatar: z.string().nullable(),
      tool: z.string(),
      model: z.string().nullable(),
      models: z.array(z.string()),
      archived: z.boolean(),
      online: z.boolean(),
      active: count,
      maxConcurrentRuns: count,
    }),
  ),
  summary: z.object({
    waiting: count,
    working: count,
    queued: count,
    idle: count,
    runners: z.object({
      online: count,
      busy: count,
      slots: count,
      used: count,
    }),
  }),
  statuses: z.record(
    z.string(),
    z.array(
      z.object({
        key: z.string(),
        name: z.string(),
        category: z.string(),
        color: z.string(),
      }),
    ),
  ),
  truncated: z.boolean(),
  generatedAt: dateTime(),
});

/** `issue design-proposal`: the issue defaults to the run's. */
export const SubmitDesignProposalInput = z.strictObject({
  issueId: z.string().min(1).optional().meta({
    description:
      'The issue, by identifier (PM-12) or id; the issue of the calling run by default.',
  }),
  content: z.string().min(1).meta({
    description: 'The whole proposal, in Markdown.',
  }),
});

export const DesignProposalSubmittedSchema = z.object({
  proposal: DesignProposalSchema,
  statusKey: z.string().meta({
    description:
      'The issue’s status after submitting: `proposal_review` once it left Analysis.',
  }),
});

/** `intake drafts`: the drafts of the run's intake request (`IntakeAiDrafts`), checked when they are delivered. */
export const IntakeDraftsInput = z.strictObject({
  drafts: z.array(z.record(z.string(), z.unknown())).min(1).meta({
    description:
      'Each `{ position, parentPosition, from?, title, description?, priority?, labels?, stage? }`; positions start at 1 and a child names its parent’s.',
  }),
});

export const IntakeDraftsDeliveredSchema = z.object({
  jobId: z.string(),
  planId: z.string(),
  drafts: z.number().int(),
  unknownLabels: z.array(z.string()).meta({
    description: 'Labels that do not exist, left out of the drafts.',
  }),
  dropped: z.number().int().meta({
    description: 'Drafts beyond the most a plan holds, left out.',
  }),
});

export const DelegationParams = z.object({ delegationId: z.string().min(1) });

export const DelegationListQuery = z.object({
  conversationId: z.string().min(1).meta({
    description: 'The conversation whose delegated work to list.',
  }),
});

export const DelegationPatchInput = z.strictObject({
  followed: z.boolean().meta({
    description:
      'False stops following the issue: no more cards or wakes in the conversation; true follows it again.',
  }),
});

export const DelegationSchema: z.ZodType<Delegation> = z
  .object({
    id: z.string(),
    conversationId: z.string(),
    issueId: z.string(),
    agentId: z.string().meta({ description: 'The agent the work went to.' }),
    userId: z.string().meta({ description: "The conversation's owner." }),
    followed: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ ref: 'StudioDelegation' });
