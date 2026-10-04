import { z } from 'zod';

/** The body of `PUT /i18n/locale`: the language this session wants answers in. */
export const SetSessionLocaleInput: z.ZodObject<
  { locale: z.ZodString },
  z.core.$strict
> = z.strictObject({
  locale: z.string().trim().min(1, 'A locale is required.'),
});

export type SetSessionLocaleInput = z.infer<typeof SetSessionLocaleInput>;
