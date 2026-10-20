import { z } from 'zod';
import type {
  BurstReceipt,
  CounterSnapshot,
  DemoState,
  PublicationReceipt,
  RoomAccess,
} from '../../shared/demo.js';

export const SnapshotSchema: z.ZodType<CounterSnapshot> = z
  .object({
    value: z.number().int().nonnegative().meta({
      description:
        'The current value in this account’s in-memory demonstration.',
    }),
    updatedAt: z.iso
      .datetime()
      .meta({ description: 'When the value last changed.' }),
  })
  .meta({ ref: 'RealtimeExampleSnapshot' });
export const AccessSchema: z.ZodType<RoomAccess> = z
  .object({
    id: z
      .uuid()
      .meta({ description: 'The caller-owned demonstration room identifier.' }),
    allowed: z.boolean().meta({
      description: 'Whether the owner may read and subscribe to this room.',
    }),
  })
  .meta({ ref: 'RealtimeExampleRoomAccess' });
export const StateSchema: z.ZodType<DemoState> = z
  .object({
    userId: z.string().meta({
      description: 'The authenticated account; never supplied by the caller.',
    }),
    room: AccessSchema,
  })
  .meta({ ref: 'RealtimeExampleState' });
export const ReceiptSchema: z.ZodType<PublicationReceipt> = z
  .object({
    eventId: z.string().meta({
      description:
        'The transient broker event identifier, not a delivery acknowledgement.',
    }),
    topic: z.string().meta({
      description: 'The registered topic that accepted the publication.',
    }),
  })
  .meta({ ref: 'RealtimeExampleReceipt' });
export const BurstSchema: z.ZodType<BurstReceipt> = z
  .object({
    published: z
      .number()
      .int()
      .meta({ description: 'Number of invalidations published.' }),
    lastEventId: z
      .string()
      .meta({ description: 'Identifier of the final publication.' }),
  })
  .meta({ ref: 'RealtimeExampleBurst' });
export const DisconnectSchema: z.ZodType<{ disconnected: number }> = z.object({
  disconnected: z.number().int().nonnegative().meta({
    description: 'Local sockets disconnected for the requesting account.',
  }),
});
export const RoomParams: z.ZodType<{ roomId: string }> = z.object({
  roomId: z.uuid(),
});
export const EmptyInput: z.ZodType<Record<string, never>> = z.strictObject({});
export const AccessInput: z.ZodType<{ allowed: boolean }> = z.strictObject({
  allowed: z.boolean(),
});
export const BurstInput: z.ZodType<{ count: number }> = z.strictObject({
  count: z.number().int().min(1).max(20),
});
