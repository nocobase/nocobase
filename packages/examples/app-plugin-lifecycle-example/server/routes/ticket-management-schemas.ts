import type {
  ManagementDetails,
  ManagementResult,
  ManagementCommand,
} from '@nocobase/lifecycle';
import { z } from 'zod';

const Command = z.enum(['suspend', 'resume', 'reset', 'restartAt']);
export const ManagementResultSchema: z.ZodType<ManagementResult> = z.object({
  recordId: z.string(),
  lifecycle: z.string(),
  definitionVersion: z.number(),
  state: z.string(),
  suspended: z.boolean(),
  round: z.number(),
  version: z.string(),
});

export type TicketManagement = Pick<
  ManagementDetails,
  'actions' | 'targets' | 'initial' | 'work' | 'history' | 'version'
>;

export const TicketManagementSchema: z.ZodType<TicketManagement> = z
  .object({
    actions: z.array(Command),
    targets: z.array(z.string()),
    initial: z.string(),
    version: z.string(),
    work: z.array(
      z.object({
        id: z.string(),
        effect: z.string(),
        status: z.enum(['queued', 'running', 'continuation']),
      }),
    ),
    history: z.array(
      z.object({
        id: z.string(),
        actorId: z.string(),
        at: z.iso.datetime(),
        from: z.string(),
        requestId: z.string(),
        event: z.object({
          command: Command,
          reason: z.string(),
          revision: z.number(),
          previousRound: z.number(),
          expectedVersion: z.string(),
          result: ManagementResultSchema,
        }),
      }),
    ),
  })
  .meta({ ref: 'LifecycleExampleTicketManagement' });

const Submission = z.object({
  reason: z.string().trim().min(1).max(1000),
  requestId: z.string().trim().min(1).max(128),
  expectedVersion: z.string().min(1).max(200),
});
interface SubmissionBody {
  readonly reason: string;
  readonly requestId: string;
  readonly expectedVersion: string;
}

type ManagementInputBody = SubmissionBody &
  (
    | { readonly command: Exclude<ManagementCommand, 'restartAt'> }
    | { readonly command: 'restartAt'; readonly target: string }
  );

export const ManagementInput: z.ZodType<ManagementInputBody> =
  z.discriminatedUnion('command', [
    Submission.strict().extend({
      command: z.enum(['suspend', 'resume', 'reset']),
    }),
    Submission.strict().extend({
      command: z.literal('restartAt'),
      target: z.string().min(1).max(128),
    }),
  ]);
