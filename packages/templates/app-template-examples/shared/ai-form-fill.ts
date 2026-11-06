import { z } from 'zod';

export const EXAMPLES_FORM_TOOL = 'examples_form_proposal';
export const EXAMPLES_FORM_SCOPE = 'examples-form-fill';
export const PROCUREMENT_DEPARTMENTS = [
  'design',
  'engineering',
  'marketing',
  'admin',
] as const;

/** Partial patches allow AI to fill only the details the user supplied. */
export const procurementFieldsSchema = z.strictObject({
  name: z.string().trim().min(1).max(120).optional(),
  department: z.enum(PROCUREMENT_DEPARTMENTS).optional(),
  quantity: z.number().int().min(1).max(10_000).optional(),
  budget: z.number().min(0).max(1_000_000).optional(),
  arrival: z.iso.date().optional(),
  purpose: z.string().trim().min(1).max(2000).optional(),
});
export const procurementProposalValuesSchema = procurementFieldsSchema.refine(
  (values) => Object.keys(values).length > 0,
  { message: 'Propose at least one editable field.' },
);

/** Retain legacy fields so existing conversation cards remain readable. */
export const formProposalValuesSchema = z
  .strictObject({
    ...procurementFieldsSchema.shape,
    priority: z.enum(['low', 'normal', 'high']).optional(),
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
