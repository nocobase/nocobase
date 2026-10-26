import { z } from 'zod';
const text = z.string().trim().max(160);
const date = z
  .union([z.iso.date(), z.literal('')])
  .transform((v) => v || null)
  .nullable()
  .optional();
export const AssetInput = z
  .object({
    assetNumber: text.min(1).max(64),
    name: text.min(1),
    serialNumber: text.nullable().optional(),
    model: text.nullable().optional(),
    manufacturer: text.nullable().optional(),
    categoryId: text.min(1),
    locationId: text.min(1),
    departmentId: text.min(1),
    purchaseDate: date,
    warrantyUntil: date,
    nextMaintenanceAt: date,
    purchaseCost: z.coerce.number().nonnegative().max(99999999999).default(0),
    vendor: text.nullable().optional(),
    notes: z.string().max(4000).nullable().optional(),
  })
  .strict();
export const AssetPatch = AssetInput.partial()
  .extend({ expectVersion: z.number().int().nonnegative() })
  .strict();
export const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(160).default(''),
  status: z.string().max(32).optional(),
  categoryId: text.optional(),
  locationId: text.optional(),
  mine: z.enum(['true', 'false']).optional(),
  exception: z.enum(['overdue', 'warranty', 'maintenance']).optional(),
  sort: z
    .enum([
      'createdAt',
      'assetNumber',
      'name',
      'purchaseCost',
      'statusChangedAt',
    ])
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
export const IdParams = z.object({ id: z.string().min(1).max(64) });
export const FireInput = z
  .object({
    transition: z.enum([
      'issue',
      'borrow',
      'return',
      'transferIdle',
      'transferIssued',
      'transferLoaned',
      'scrap',
    ]),
    input: z
      .object({
        custodianId: text.optional(),
        departmentId: text.optional(),
        locationId: text.optional(),
        dueDate: date,
        reason: z.string().trim().max(2000).optional(),
      })
      .strict()
      .default({}),
    expectVersion: z.number().int().nonnegative(),
    requestId: z.string().min(1).max(128),
  })
  .strict();
export const RequestInput = z
  .object({
    deviceId: text.min(1),
    kind: z.enum(['issue', 'return', 'borrow', 'transfer', 'repair']),
    reason: z.string().trim().min(1).max(2000),
    dueDate: date,
  })
  .strict();
export const HandleInput = z
  .object({
    decision: z.enum(['complete', 'reject']),
    resolution: z.string().trim().min(1).max(2000),
    custodianId: text.optional(),
    departmentId: text.optional(),
    locationId: text.optional(),
    expectVersion: z.number().int().nonnegative(),
  })
  .strict();
export const MaintenanceInput = z
  .object({
    deviceId: text.min(1),
    kind: z.enum(['repair', 'maintenance']),
    description: z.string().trim().min(1).max(2000),
  })
  .strict();
export const CompleteMaintenance = z
  .object({
    resolution: z.string().trim().min(1).max(2000),
    cost: z.coerce.number().min(0).max(99999999999),
    expectVersion: z.number().int().nonnegative(),
  })
  .strict();
export const StocktakeInput = z
  .object({ name: text.min(1), locationId: text.min(1) })
  .strict();
export const ObservationInput = z
  .object({
    actualLocationId: text.min(1),
    condition: z.enum(['good', 'damaged', 'missing']),
    resolved: z.boolean(),
    note: z.string().trim().max(2000),
    expectVersion: z.number().int().nonnegative(),
  })
  .strict();
export const ReferenceInput = z
  .object({ name: text.min(1), code: text.min(1).max(64) })
  .strict();
export const CsvInput = z.object({ csv: z.string().max(1000000) }).strict();
export type AssetValues = z.infer<typeof AssetInput>;
export type ListValues = z.infer<typeof ListQuery>;
