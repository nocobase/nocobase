/** The project manager's API schemas (`routes.ts`), annotated with their views so the two cannot drift apart. */
import { z } from 'zod';

import type {
  IssueProgress,
  ProjectManagerView,
} from '../../../shared/project-manager.js';

export const ProjectManagerViewSchema: z.ZodType<ProjectManagerView> = z
  .object({
    name: z.string(),
    description: z.string().nullable(),
    firstChoiceAgentId: z.string().nullable().meta({
      description:
        'The agent whose tool and model the project manager runs with; null until someone chooses.',
    }),
    fallbackAgentId: z.string().nullable().meta({
      description:
        'The agent it runs with after the first choice queue delay, or immediately when no compatible runner can take the first choice.',
    }),
    principles: z.string().nullable().meta({
      description:
        'The allocation principles in force; null for the built-in ones.',
    }),
    commentRunLimit: z.number().int().meta({
      description:
        'How many runs agents’ comments may start on one issue within 24 hours.',
    }),
    fallbackAfterSeconds: z.number().int(),
    delegationQueueTimeoutSeconds: z.number().int(),
    builtInPrinciples: z.string(),
    choices: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().nullable(),
        online: z.boolean(),
      }),
    ),
    canEdit: z.boolean(),
  })
  .meta({ ref: 'StudioProjectManager' });

export const IssueProgressSchema: z.ZodType<IssueProgress> = z
  .object({
    personalRunnerRequests: z
      .array(
        z.object({
          id: z.string(),
          status: z.enum(['pending', 'rejected']),
          requestedBy: z.object({ id: z.string(), name: z.string() }),
          commentId: z.string(),
          commentText: z.string(),
          canDecide: z.boolean(),
          canRunAsMe: z.boolean(),
        }),
      )
      .optional()
      .meta({
        description:
          'Personal runner consent requests visible to the issue owner or their original requester.',
      }),
    waiting: z
      .object({
        reason: z.enum([
          'waitingOwner',
          'noOwner',
          'notConfigured',
          'noRunner',
          'ownerHasNoRunner',
          'notAllowed',
        ]),
        owner: z.object({ id: z.string(), name: z.string() }).nullable(),
      })
      .nullable()
      .optional(),
    state: z.enum([
      'working',
      'queued',
      'checksPending',
      'needsDecision',
      'waitingForContinuation',
      'inReview',
      'notStarted',
      'finished',
      'idle',
    ]),
    managerWait: z
      .object({
        queueEnteredAt: z.string(),
        fallbackAfterSeconds: z.number(),
        sampledAt: z.string(),
        entries: z.array(
          z.object({
            tool: z.string(),
            model: z.string().nullable(),
            reason: z.enum([
              'ready',
              'updatePending',
              'pruning',
              'busy',
              'incompatible',
              'offline',
              'restricted',
              'toolNotInstalled',
              'toolUnavailable',
              'noSharedRunner',
              'unknown',
              'concurrencyFull',
              'sameWorkActive',
              'delayed',
            ]),
            compatibleCount: z.number(),
            blockers: z
              .array(
                z.enum([
                  'ready',
                  'updatePending',
                  'pruning',
                  'busy',
                  'incompatible',
                  'offline',
                  'restricted',
                  'toolNotInstalled',
                  'toolUnavailable',
                  'noSharedRunner',
                  'unknown',
                  'concurrencyFull',
                  'sameWorkActive',
                  'delayed',
                ]),
              )
              .optional(),
            runners: z.array(z.string()),
            runnerLoads: z
              .array(
                z.object({
                  name: z.string(),
                  reason: z
                    .enum([
                      'ready',
                      'updatePending',
                      'pruning',
                      'busy',
                      'incompatible',
                      'offline',
                      'restricted',
                      'toolNotInstalled',
                      'toolUnavailable',
                      'noSharedRunner',
                      'unknown',
                      'concurrencyFull',
                      'sameWorkActive',
                      'delayed',
                    ])
                    .optional(),
                  lastSeenAt: z.string().nullable().optional(),
                  used: z.number().optional(),
                  limit: z.number().optional(),
                  toolUsed: z.number().optional(),
                  toolLimit: z.number().optional(),
                  reportedFree: z.number().optional(),
                  reportedTotalFree: z.number().optional(),
                }),
              )
              .optional(),
          }),
        ),
      })
      .optional(),
    agent: z.object({ id: z.string(), name: z.string() }).nullable(),
    step: z.string().nullable().meta({
      description:
        'The step the agent was handed: the first line of its hand-over.',
    }),
    since: z.string().nullable(),
    runner: z.string().nullable(),
    pullRequest: z
      .object({ number: z.number().int(), url: z.string().nullable() })
      .nullable(),
    question: z.string().nullable().meta({
      description:
        'The Needs you line from the manager comment at the transition to Blocked.',
    }),
    blockedComment: z
      .object({ id: z.string(), content: z.string() })
      .nullable()
      .optional(),
    next: z.string().nullable().meta({
      description: 'The project manager’s latest "Next" line.',
    }),
    handOver: z.boolean().meta({
      description:
        'The project manager executes the open issue but never worked on it: someone may hand it over to go on.',
    }),
  })
  .meta({ ref: 'StudioIssueProgress' });
