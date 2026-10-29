import { z } from 'zod';

export const ProcurementState = z.enum([
  'draft',
  'submitted',
  'rejected',
  'approved',
]);
export const money = z.string().regex(/^(0|[1-9]\d{0,6})(\.\d{1,2})?$/);
export function minorUnits(value: string): number {
  const parsed = money.parse(value);
  const [whole, fraction = ''] = parsed.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
export function amount(
  lines: readonly { quantity: number; unitPrice: string }[],
): number {
  const total = lines.reduce(
    (sum, line) => sum + line.quantity * minorUnits(line.unitPrice),
    0,
  );
  if (!Number.isSafeInteger(total) || total > 2_000_000_000)
    throw new Error('The total exceeds the supported amount.');
  return total;
}
export const ProcurementLineInput = z.strictObject({
  id: z.string().uuid().optional(),
  materialId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100_000),
  unitPrice: money,
});
export const ProcurementInput = z.strictObject({
  title: z.string().trim().max(160),
  supplierId: z.string().uuid().nullable(),
  reviewerId: z.string().min(1).max(128).nullable(),
  lines: z.array(ProcurementLineInput).max(50),
  totalMinor: z.number().int().nonnegative().max(2_000_000_000),
});
export const ProcurementUpdate = ProcurementInput.extend({
  version: z.number().int().nonnegative(),
});
export type ProcurementInput = z.infer<typeof ProcurementInput>;
export const ProcurementLine = ProcurementLineInput.extend({
  id: z.string().uuid(),
  materialName: z.string(),
  unitPriceMinor: z.number(),
  amountMinor: z.number(),
});
export const ProcurementRecord = z.object({
  id: z.string(),
  title: z.string(),
  applicantId: z.string(),
  reviewerId: z.string().nullable(),
  supplierId: z.string().nullable(),
  status: ProcurementState,
  lifecycleVersion: z.number(),
  totalMinor: z.number(),
  createdAt: z.string(),
});
export const ProcurementDetail = z.object({
  record: ProcurementRecord,
  supplierName: z.string().nullable(),
  reviewerName: z.string().nullable(),
  lines: z.array(ProcurementLine),
  actions: z.object({
    edit: z.boolean(),
    submit: z.boolean(),
    approve: z.boolean(),
    reject: z.boolean(),
  }),
  history: z.array(
    z.object({
      id: z.string(),
      transition: z.string(),
      from: z.string().nullable(),
      to: z.string(),
      actorId: z.string(),
      at: z.string(),
    }),
  ),
});
export type ProcurementDetail = z.infer<typeof ProcurementDetail>;
export const ProcurementCandidate = z.object({
  id: z.string(),
  name: z.string(),
  unitPrice: z.string().optional(),
});
export const PROCUREMENT_ACCESS = {
  type: 'settings',
  id: 'procurement',
} as const;
export interface ProcurementActor {
  id: string;
  request: boolean;
  review: boolean;
}
