import { z } from 'zod';

import type { CommentMessage } from '../../../shared/comments.js';

/** Parse into a fresh whitelist projection; never return the stored origin or extra parameters. */
export const CommentMessageSchema: z.ZodType<CommentMessage> =
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('studio.runAppended'),
      params: z.object({ agentName: z.string().trim().min(1).max(200) }),
    }),
    z.object({
      type: z.literal('studio.stepEnded'),
      params: z.object({
        status: z.enum(['completed', 'failed', 'cancelled']),
      }),
    }),
  ]);
