import { z } from 'zod';

import type {
  AccountRoleTitle,
  AccountSummary,
  AccountSwitchState,
  SwitchableAccount,
} from '../../shared/types.js';

const AccountSummarySchema: z.ZodType<AccountSummary> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
});

const RoleTitleSchema: z.ZodType<AccountRoleTitle> = z.union([
  z.string(),
  z.object({
    key: z.string(),
    ns: z.string(),
    defaultValue: z.string(),
  }),
]);

export const SwitchableAccountSchema: z.ZodType<SwitchableAccount> = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    roleTitles: z.array(RoleTitleSchema).meta({
      description:
        'Directly assigned visible Permission Set titles; a descriptor is translated by the client.',
    }),
    current: z
      .boolean()
      .meta({ description: 'Whether requests currently act as this account.' }),
    own: z.boolean().meta({
      description:
        'Whether this is the signed-in person’s own account, which ending the switch returns to.',
    }),
  })
  .meta({ ref: 'AccountSwitcherSwitchableAccount' });

export const AccountSwitchStateSchema: z.ZodType<AccountSwitchState> = z
  .object({
    canSwitch: z.boolean().meta({
      description:
        'Whether the signed-in person, not the account acted as, may switch accounts.',
    }),
    switched: z
      .object({
        actor: AccountSummarySchema,
        target: AccountSummarySchema,
        expiresAt: z.iso.datetime(),
      })
      .nullable()
      .meta({ description: 'The switch in force for this session, if any.' }),
  })
  .meta({ ref: 'AccountSwitcherState' });

export const ListAccountsQuery: z.ZodObject<{
  q: z.ZodOptional<z.ZodString>;
  page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
  pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}> = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const StartSwitchInput: z.ZodObject<
  { userId: z.ZodString },
  z.core.$strict
> = z.strictObject({ userId: z.string().min(1).max(64) });
