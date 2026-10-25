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
        'An optional dataset label, such as the account’s job title.',
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
