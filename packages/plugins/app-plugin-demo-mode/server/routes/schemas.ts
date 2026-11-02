import { z } from 'zod';

import type { DemoSignInAccount } from '../../shared/accounts.js';

export const DemoSignInAccountSchema: z.ZodType<DemoSignInAccount> = z
  .object({
    username: z
      .string()
      .meta({ description: 'The username, or email when no username is set.' }),
    name: z.string().meta({ description: 'The account display name.' }),
    role: z.string().meta({
      description:
        'The dataset role label, falling back to plain titles or keys of directly assigned visible Permission Sets. Empty when neither is available.',
    }),
    roleTitles: z
      .array(
        z.union([
          z.string(),
          z.object({
            key: z.string().meta({
              description: 'Translation key for the Permission Set title.',
            }),
            ns: z.string().meta({
              description: 'Client namespace owning the title translations.',
            }),
            defaultValue: z.string().meta({
              description:
                'Permission Set key used when its translation is unavailable.',
            }),
          }),
        ]),
      )
      .optional()
      .meta({
        description:
          'Titles for client-side translation when no dataset role label is provided. Unrestricted administrator sets take precedence over other visible assignments.',
      }),
    current: z.boolean().meta({
      description: 'Whether the request is signed in as this account.',
    }),
  })
  .meta({ ref: 'DemoModeSignInAccount' });

export const DemoDefaultSignInSchema: z.ZodType<{ signedIn: boolean }> = z
  .object({
    signedIn: z
      .boolean()
      .meta({ description: 'Whether a new Super Admin session was created.' }),
  })
  .meta({ ref: 'DemoModeDefaultSignInResult' });

export const UsernameParam: z.ZodObject<{ username: z.ZodString }> = z.object({
  username: z.string().min(1).max(255),
});
