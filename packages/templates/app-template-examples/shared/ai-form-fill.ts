import { z } from 'zod';

export const EXAMPLES_FORM_TOOL = 'examples_form_proposal';
export const EXAMPLES_FORM_SCOPE = 'examples-form-fill';

/** The example's editable fields only; the read-only record id is deliberately absent. */
export const formProposalValuesSchema = z
  .strictObject({
    name: z.string().trim().min(1).max(120).optional(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    budget: z.number().min(0).max(1_000_000).optional(),
    subscribe: z.boolean().optional(),
  })
  .refine((values) => Object.keys(values).length > 0, {
    message: 'Propose at least one editable field.',
  });

/** Target tokens are untrusted proposal data, not server authorization credentials. */
export const formProposalSchema = z.strictObject({
  formId: z.string().min(1).max(128),
  instance: z.string().min(1).max(128),
  identity: z.string().min(1).max(128),
  revision: z.string().min(1).max(128),
  values: formProposalValuesSchema,
});

export type FormProposal = z.infer<typeof formProposalSchema>;
export type FormProposalValues = z.infer<typeof formProposalValuesSchema>;
