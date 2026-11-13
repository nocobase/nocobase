import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

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

// A request written before the binding column belongs to the only
// definition the table has had.
describeMigration('202611130004_procurement_definition_binding', {
  sources: [
    {
      packageName: 'procurement-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  async before({ connection }) {
    await connection.repository('procurementRequests').createOne({
      values: {
        id: 'request-before-binding',
        title: 'Notebooks',
        applicantId: 'lin',
        status: 'draft',
        statusChangedAt: '2026-11-01T00:00:00.000Z',
        lifecycleVersion: 1,
        totalMinor: 1250,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    });
  },
  async up({ connection, expectCollection }) {
    await expectCollection('procurementRequests').toHaveField(
      'lifecycleDefinition',
      { type: 'string', nullable: true },
    );
    const rows = await connection
      .repository('procurementRequests')
      .findMany({});
    expect(rows.map((row) => row.lifecycleDefinition)).toEqual(['procurement']);
  },
  async down({ expectCollection }) {
    await expectCollection('procurementRequests').not.toHaveField(
      'lifecycleDefinition',
    );
  },
});
