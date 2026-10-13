/** The project manager's API schemas (`routes.ts`), annotated with their views so the two cannot drift apart. */
import { z } from 'zod';

import type {
  IssueProgress,
  ProjectManagerView,
} from '../../../shared/project-manager.js';

export const ProjectManagerViewSchema: z.ZodType<ProjectManagerView> = z
  .object({
    firstChoiceAgentId: z.string().nullable().meta({
      description:
        'The agent whose tool and model the project manager runs with; null until someone chooses.',
    }),
    fallbackAgentId: z.string().nullable().meta({
      description:
        'The agent it runs with when no runner can take the first choice’s work.',
    }),
    principles: z.string().nullable().meta({
      description:
        'The allocation principles in force; null for the built-in ones.',
    }),
    commentRunLimit: z.number().int().meta({
      description:
        'How many runs agents’ comments may start on one issue within 24 hours.',
    }),
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
      'inReview',
      'notStarted',
      'finished',
      'idle',
    ]),
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
      description: 'On a blocked issue: what the project manager asked.',
    }),
    next: z.string().nullable().meta({
      description: 'The project manager’s latest "Next" line.',
    }),
    handOver: z.boolean().meta({
      description:
        'The project manager executes the open issue but never worked on it: someone may hand it over to go on.',
    }),
  })
  .meta({ ref: 'StudioIssueProgress' });
