import { z } from 'zod';

/** The body of `PUT /i18n/locale`: the language this session wants answers in. */
export const SetSessionLocaleInput: z.ZodObject<
  { locale: z.ZodString },
  z.core.$strict
> = z.strictObject({
  locale: z.string().trim().min(1, 'A locale is required.'),
});

/** What `GET /i18n/locales` answers in `data`, for the API document at `/api/swagger/docs`. */
export const ServerLocaleListSchema: z.ZodType = z
  .object({
    defaultLocale: z.string().meta({
      description:
        'The language the server answers in when a session has chosen none.',
    }),
    locales: z.array(
      z.object({
        locale: z
          .string()
          .meta({ description: 'A BCP 47 tag, such as `zh-CN`.' }),
        label: z
          .string()
          .meta({ description: 'The language’s name in that language.' }),
        direction: z.enum(['ltr', 'rtl']),
      }),
    ),
  })
  .meta({ ref: 'I18nLocaleList' });

export type SetSessionLocaleInput = z.infer<typeof SetSessionLocaleInput>;
