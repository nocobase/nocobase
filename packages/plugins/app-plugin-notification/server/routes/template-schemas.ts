import { z } from 'zod';
import type {
  NotificationTemplateContent,
  NotificationTemplatePreview,
  NotificationTemplateText,
  NotificationTemplateView,
} from '../../shared/templates.js';

export const templateParams: z.ZodObject<{ templateId: z.ZodString }> =
  z.object({ templateId: z.string().min(1).max(200) });
export const templateQuery: z.ZodObject<{
  search: z.ZodOptional<z.ZodString>;
  category: z.ZodOptional<z.ZodString>;
  channel: z.ZodOptional<z.ZodString>;
}> = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(200).optional(),
  channel: z.string().max(200).optional(),
});
export const previewInput: z.ZodObject<
  { locale: z.ZodString },
  z.core.$strict
> = z.strictObject({ locale: z.string().min(1).max(50) });
export const templateContentSchema: z.ZodType<NotificationTemplateContent> =
  z.object({
    title: z.string(),
    body: z.string(),
    html: z.string().optional(),
  });
export const templateTextSchema: z.ZodType<NotificationTemplateText> = z
  .union([
    z.string(),
    z.object({ ns: z.string(), key: z.string(), defaultValue: z.string() }),
  ])
  .meta({
    ref: 'NotificationTemplateText',
    description:
      'Plain text, or a translation key in a client namespace that the browser resolves in the interface language, with its default text.',
  });
export const templateSchema: z.ZodType<NotificationTemplateView> = z
  .object({
    id: z.string(),
    contributor: z.string(),
    contributorLabel: templateTextSchema.optional(),
    category: templateTextSchema,
    name: templateTextSchema,
    trigger: templateTextSchema,
    recipients: templateTextSchema,
    businessRule: templateTextSchema,
    locales: z.array(z.string()),
    localeMode: z.enum(['separate', 'combined']),
    languagePolicy: templateTextSchema,
    variables: z.array(
      z.object({ name: z.string(), description: templateTextSchema }),
    ),
    channels: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        label: templateTextSchema.optional(),
        typeLabel: templateTextSchema.optional(),
        configured: z.boolean(),
        enabled: z.boolean().nullable(),
      }),
    ),
  })
  .meta({ ref: 'NotificationTemplate' });
export const previewSchema: z.ZodType<NotificationTemplatePreview> = z
  .object({
    synthetic: z.literal(true),
    requestedLocale: z.string(),
    effectiveLocale: z.string(),
    content: templateContentSchema,
    definition: templateContentSchema,
  })
  .meta({ ref: 'NotificationTemplatePreview' });
