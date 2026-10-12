/** The documented shapes of `/api/followUps` (`routes.ts`). */
import { z } from 'zod';

import {
  FOLLOW_UPS_MAX,
  OWNED_PER_STATUS_MAX,
  UNREAD_MAX,
  type FollowingView,
  type FollowUpIssue,
  type FollowUpsView,
} from '../../shared/follow-ups.js';
import { IssueProgressSchema } from '../agents/manager/schemas.js';

export const FollowUpIssueSchema: z.ZodType<FollowUpIssue> = z
  .object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    statusKey: z.string(),
    projectId: z.string().nullable(),
    executorName: z.string().nullable(),
    lastActivityAt: z.string(),
    owned: z.boolean().meta({ description: 'The caller owns the issue.' }),
    followed: z.boolean().meta({
      description:
        'The caller follows the issue, or would by default while they never chose.',
    }),
    progress: IssueProgressSchema.nullable().meta({
      description:
        'What the issue waits for now; null for an owned issue in backlog.',
    }),
    unread: z
      .number()
      .int()
      .meta({
        description: `Comments and changes by others since \`seenAt\`, at most ${UNREAD_MAX}; 0 when never seen or not followed.`,
      }),
    seenAt: z.string().nullable().meta({
      description: 'When the caller last looked at the issue here.',
    }),
  })
  .meta({ ref: 'StudioFollowUpIssue' });

const counts = z.object({
  in_review: z.number().int(),
  blocked: z.number().int(),
  in_progress: z.number().int(),
  backlog: z.number().int(),
});

export const FollowUpsViewSchema: z.ZodType<FollowUpsView> = z
  .object({
    following: z.array(z.string()).meta({
      description: `The followed issues' ids in order, at most ${FOLLOW_UPS_MAX}.`,
    }),
    followingStored: z.boolean().meta({
      description:
        'Whether the caller chose what they follow; otherwise it is their blocked and in-review issues, newest first.',
    }),
    issues: z.array(FollowUpIssueSchema).meta({
      description:
        'The issues the caller owns in review, blocked, in progress or in backlog, then the followed ones they do not own.',
    }),
    counts: counts.meta({
      description: `How many issues the caller owns in each status, counting at most ${OWNED_PER_STATUS_MAX}.`,
    }),
    truncated: z.boolean().meta({
      description: 'Some status has more owned issues than were read.',
    }),
  })
  .meta({ ref: 'StudioFollowUps' });

export const FollowingInputSchema = z.strictObject({
  issueIds: z
    .array(z.string().min(1))
    .max(FOLLOW_UPS_MAX)
    .meta({ description: 'The issues to follow, in order.' }),
});

export const FollowingViewSchema: z.ZodType<FollowingView> = z
  .object({ issueIds: z.array(z.string()) })
  .meta({ ref: 'StudioFollowing' });
