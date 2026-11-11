// Binding existing records to the definition that created them: a ticket
// written before the column existed is bound to `tickets`, and down drops
// the column again.
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { migrations } from './fixtures.js';

const TABLES = [
  'lifecycleExampleTickets',
  'lifecycleExampleExpenses',
  'lifecycleExampleOrders',
  'lifecycleExampleInvoices',
  'lifecycleExampleExports',
  'lifecycleExamplePurchases',
  'lifecycleExampleFulfilments',
  'lifecycleExampleSubscriptions',
];

const ticket = (subject: string) => ({
  values: {
    subject,
    description: 'Printer jam',
    category: 'hardware',
    priority: 'normal',
    requesterId: 'lin',
    status: 'open',
    statusChangedAt: '2026-11-01T00:00:00.000Z',
    lifecycleVersion: 1,
    createdAt: '2026-11-01T00:00:00.000Z',
  },
});

describeMigration('202611110002_lifecycle_example_definition_binding', {
  sources: migrations,
  async before({ connection }) {
    await connection
      .repository('lifecycleExampleTickets')
      .createOne(ticket('Written before the binding'));
  },
  async up({ connection, expectCollection }) {
    for (const name of TABLES)
      await expectCollection(name).toHaveField('lifecycleDefinition', {
        type: 'string',
        nullable: true,
      });
    const tickets = connection.repository('lifecycleExampleTickets');
    expect(
      (await tickets.findMany({})).map((row) => row.lifecycleDefinition),
    ).toEqual(['tickets']);
  },
  async down({ expectCollection }) {
    for (const name of TABLES)
      await expectCollection(name).not.toHaveField('lifecycleDefinition');
  },
});
