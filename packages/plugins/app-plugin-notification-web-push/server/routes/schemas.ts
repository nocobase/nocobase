import { z } from 'zod';
import type { Device as DeviceView } from '../subscriptions.js';
export const Device: z.ZodType<DeviceView> = z
  .strictObject({
    id: z.string(),
    name: z.string(),
    locale: z.string(),
    enabled: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ ref: 'WebPushDevice' });
export const Id: z.ZodType<{ id: string }> = z.strictObject({
  id: z.string().uuid(),
});

export const Changed: z.ZodType<{ enabled: boolean }> = z.strictObject({
  enabled: z.boolean(),
});
export const Done: z.ZodType<{ ok: boolean }> = z.strictObject({
  ok: z.boolean(),
});
