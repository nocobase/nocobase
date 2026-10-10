/** The input and answers of Studio's inbox routes (`routes.ts`). */
import { z } from 'zod';

import {
  INBOX_KINDS,
  type InboxKind,
  type InboxNotice,
  type InboxPending,
  type InboxWaiting,
} from '../../shared/inbox.js';
import { idList } from '../http/input.js';
import type { InboxItemView } from './items.js';
import { MAX_NOTICE_IDS } from './service.js';

/** `ids=a,b`: the in-app items whose notices to read. */
export const NoticesQuery = z.object({ ids: idList(MAX_NOTICE_IDS) });

/** `subject=<type>:<id>`, such as `issue:123`: only the decisions about it. */
export const WaitingQuery = z.object({
  subject: z
    .string()
    .regex(/^[^:]+:.+$/u, 'subject is <type>:<id>, such as issue:123.')
    .transform((value) => {
      const at = value.indexOf(':');
      return { type: value.slice(0, at), id: value.slice(at + 1) };
    })
    .optional(),
});

// ---------------------------------------------------------------------------------------------------------------------
// What the routes answer
// ---------------------------------------------------------------------------------------------------------------------

const dateTime = () => z.string().meta({ format: 'date-time' });

export const InboxNoticeSchema: z.ZodType<InboxNotice> = z
  .object({
    notificationId: z.string(),
    source: z.string().meta({
      description: 'Who sent it: the contributor’s id, such as `projects`.',
    }),
    kind: z.enum(INBOX_KINDS as [InboxKind, ...InboxKind[]]),
    type: z.string().meta({
      description: 'What happened, such as `approval_requested`.',
    }),
    subject: z
      .object({
        type: z.string(),
        id: z.string(),
        label: z.string().nullable(),
      })
      .nullable(),
    decisionKey: z.string().nullable(),
    data: z.record(z.string(), z.json()).nullable().meta({
      description: 'The sender’s own values, as its renderer reads them.',
    }),
    count: z.number().int(),
    resolvedAt: dateTime().nullable(),
    outcome: z.string().nullable(),
  })
  .meta({ ref: 'StudioInboxNotice' });

export const InboxPendingSchema: z.ZodType<InboxPending> = z.object({
  info: z.number().int().meta({
    description: 'The caller’s unread notifications, excluding decisions.',
  }),
  decision: z.number().int().meta({
    description: 'The decisions still waiting on the caller.',
  }),
});

export const InboxWaitingSchema: z.ZodType<InboxWaiting> = z.object({
  item: z.object({
    id: z.string(),
    deliveryId: z.string(),
    notificationId: z.string(),
    title: z.string(),
    body: z.string(),
    target: z
      .discriminatedUnion('type', [
        z.object({ type: z.literal('route'), path: z.string() }),
        z.object({ type: z.literal('url'), url: z.string() }),
      ])
      .optional(),
    readAt: dateTime().optional(),
    createdAt: dateTime(),
  }),
  notice: InboxNoticeSchema,
});

/** `GET /items`: the newest first, a page at a time. */
export const ItemsQuery = z.object({
  unread: z.enum(['true', 'false']).optional().meta({
    description: 'Only unread items.',
  }),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  pageToken: z.string().min(1).max(512).optional(),
});

export const InboxItemSchema: z.ZodType<InboxItemView> = z
  .object({
    id: z.string().meta({ description: 'The in-app item id.' }),
    kind: z.enum(INBOX_KINDS as [InboxKind, ...InboxKind[]]),
    type: z.string().meta({
      description: 'What happened, such as `approval_requested`.',
    }),
    pending: z.boolean().meta({
      description: 'A decision still waiting on the person.',
    }),
    read: z.boolean(),
    issue: z.string().nullable().meta({
      description: 'The issue it is about, such as `PM-12`.',
    }),
    title: z.string(),
    body: z.string(),
    url: z.string().nullable().meta({
      description: 'Where it opens in the application.',
    }),
    createdAt: dateTime(),
  })
  .meta({ ref: 'StudioInboxItem' });
