// Binding existing records to the definition that created them: an
// extraction written before the column existed is bound to `extractions`,
// and down drops the column again.
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { migrations } from './fixtures.js';

const TABLES = [
  'officeFlowsDataRequests',
  'officeFlowsExtractions',
  'officeFlowsIncoming',
  'officeFlowsClerkTasks',
  'officeFlowsTeamTasks',
  'officeFlowsExecutorTasks',
];

describeMigration('202611130003_office_flows_definition_binding', {
  sources: migrations,
  async before({ connection }) {
    await connection.repository('officeFlowsExtractions').createOne({
      values: {
        number: 'SJSY_CS-1',
        requestId: 1,
        periodKey: 'manual:1',
        origin: 'manual',
        scheduledDate: '2026-11-01',
        topic: 'Quarterly export',
        status: 'pending',
        statusChangedAt: '2026-11-01T00:00:00.000Z',
        lifecycleVersion: 0,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    });
  },
  async up({ connection, expectCollection }) {
    for (const name of TABLES)
      await expectCollection(name).toHaveField('lifecycleDefinition', {
        type: 'string',
        nullable: true,
      });
    const rows = await connection
      .repository('officeFlowsExtractions')
      .findMany({});
    expect(rows.map((row) => row.lifecycleDefinition)).toEqual(['extractions']);
  },
  async down({ expectCollection }) {
    for (const name of TABLES)
      await expectCollection(name).not.toHaveField('lifecycleDefinition');
  },
});
