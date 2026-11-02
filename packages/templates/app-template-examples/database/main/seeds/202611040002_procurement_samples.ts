import { defineSeed } from '@nocobase/db';

export default defineSeed({
  name: '202611040002_procurement_samples', sample: true,
  async run(context) {
    const supplier = context.repository('procurementSuppliers');
    const material = context.repository('procurementMaterials');
    for (const [id, name, active] of [
      ['00000000-0000-4000-8000-000000000001', 'Atlas Office', true],
      ['00000000-0000-4000-8000-000000000002', 'Retired Supplier', false],
    ] as const) if (!(await supplier.findOne({ filter: { id } }))) await supplier.createOne({ values: { id, name, active, allowedUserId: null } });
    for (const [id, name, unitPriceMinor, active] of [
      ['00000000-0000-4000-8000-000000000011', 'Notebook', 1250, true],
      ['00000000-0000-4000-8000-000000000012', 'Desk lamp', 3500, true],
      ['00000000-0000-4000-8000-000000000013', 'Retired material', 100, false],
    ] as const) if (!(await material.findOne({ filter: { id } }))) await material.createOne({ values: { id, name, unitPriceMinor, active, allowedUserId: null } });
  },
});
