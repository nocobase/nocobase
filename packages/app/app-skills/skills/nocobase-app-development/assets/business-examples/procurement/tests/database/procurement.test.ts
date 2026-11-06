import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

describeMigration('202611040001_create_procurement', {
  sources: [
    {
      packageName: 'procurement-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  async up({ expectCollection }) {
    for (const name of [
      'procurementSuppliers',
      'procurementMaterials',
      'procurementRequests',
      'procurementLines',
    ])
      await expectCollection(name).toExist();
    await expectCollection('procurementRequests').toHaveField(
      'lifecycleVersion',
      { type: 'integer', nullable: false },
    );
    await expectCollection('procurementRequests').toHaveIndex([
      'reviewerId',
      'status',
    ]);
    await expectCollection('procurementLines').toHaveField('amountMinor', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('procurementLines').toHaveIndex([
      'requestId',
      'position',
    ]);
  },
  async down({ expectCollection }) {
    for (const name of [
      'procurementLines',
      'procurementRequests',
      'procurementMaterials',
      'procurementSuppliers',
    ])
      await expectCollection(name).not.toExist();
  },
});
