import { z } from 'zod';

import type { CommentMessage } from '../../../shared/comments.js';

/** Project only the envelope and public primitive parameters; applications own message semantics. */
export const CommentMessageSchema: z.ZodType<CommentMessage> = z.object({
  type: z
    .string()
    .max(100)
    .regex(/^[a-z][a-z0-9-]*(\.[a-zA-Z][a-zA-Z0-9]*)+$/u),
  params: z
    .record(
      z.string(),
      z.union([z.string().max(500), z.number().finite(), z.boolean()]),
    )
    .refine(
      (params) => Object.keys(params).length <= 10,
      'At most 10 message parameters are allowed.',
    ),
});
