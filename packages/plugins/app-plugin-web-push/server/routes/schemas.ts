import { z } from 'zod';
import type { Device as DeviceView } from '../subscriptions.js';
export const Device: z.ZodType<DeviceView> = z.object({
  id: z.string(),
  name: z.string(),
  locale: z.string(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export const Id: z.ZodType<{ id: string }> = z.object({
  id: z.string().uuid(),
});

export const Changed: z.ZodType<{ enabled: boolean }> = z.object({
  enabled: z.boolean(),
});
export const Done: z.ZodType<{ ok: boolean }> = z.object({ ok: z.boolean() });
