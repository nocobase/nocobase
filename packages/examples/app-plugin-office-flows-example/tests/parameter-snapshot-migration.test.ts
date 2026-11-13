import { createMigrator } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import { migrations } from './fixtures.js';

it.each(['unknown', 'started', 'creation-only', 'partial-history'] as const)(
  'requires reliable office startup history (%s) without creating a baseline',
  async (kind) => {
    const fixture = await createTestDatabase();
    try {
      const migrator = createMigrator({
        database: fixture.database,
        sources: migrations,
      });
      await migrator.upTo('202611110003_office_flows_definition_binding');
      const record = await fixture.database
        .repository('officeFlowsIncoming')
        .createOne({
          values: {
            number: 'HISTORY-1',
            title: 'History',
            code: '',
            sender: '',
            senderRef: '',
            summary: '',
            officeOpinion: '',
            distributionType: 'normal',
            registrarId: 'zhoujie',
            officeHeadId: 'xulei',
            officeLeaderId: 'fanqing',
            status: 'draft',
            statusChangedAt: '2026-10-01T00:00:00.000Z',
            lifecycleVersion: 1,
            createdAt: '2026-10-01T00:00:00.000Z',
            lifecycleDefinition: 'incoming',
          },
        });
      if (kind !== 'unknown')
        await fixture.database.repository('officeFlowsTransitions').createOne({
          values: {
            lifecycle: 'incoming',
            recordId: String(Number(record.record.id)),
            transition: kind !== 'started' ? '$create' : 'submit',
            from: kind !== 'started' ? null : 'draft',
            to: kind !== 'started' ? 'draft' : 'headReview',
            actorId: 'zhoujie',
            input: {},
            at: '2026-10-01T00:00:00.000Z',
            version: 1,
            requestId: null,
            requestKey: '$v:1',
          },
        });
      if (kind === 'partial-history')
        await fixture.database.repository('officeFlowsTransitions').createOne({
          values: {
            lifecycle: 'incoming',
            recordId: String(Number(record.record.id)),
            transition: 'withdraw',
            from: 'headReview',
            to: 'draft',
            actorId: 'zhoujie',
            input: {},
            at: '2026-10-02T00:00:00.000Z',
            version: 3,
            requestId: null,
            requestKey: '$v:3',
          },
        });
      await expect(migrator.latest()).rejects.toThrow(
        kind === 'started'
          ? 'START_PARAMETERS_UNRECOVERABLE'
          : 'START_HISTORY_UNKNOWN',
      );
    } finally {
      await fixture.destroy();
    }
  },
);

it.each(['officeFlowsParameterSnapshots', 'officeFlowsCreationRequests'])(
  'refuses rollback while %s contains instance evidence',
  async (collection) => {
    const fixture = await createTestDatabase();
    try {
      const migrator = createMigrator({
        database: fixture.database,
        sources: migrations,
      });
      await migrator.latest();
      const values =
        collection === 'officeFlowsParameterSnapshots'
          ? { id: 'preserved-evidence', payload: { values: { holidays: [] } } }
          : {
              id: 'preserved-evidence',
              status: 'completed',
              revision: 1,
              actorId: 'test',
              fingerprint: '{}',
              recordId: '1',
              entryId: '1',
              at: '2026-11-13T00:00:00.000Z',
            };
      await fixture.database.repository(collection).createOne({ values });
      await expect(migrator.rollback()).rejects.toThrow(
        'Parameter snapshots and receipts are retained.',
      );
      expect(await fixture.database.repository(collection).count()).toBe(1);
    } finally {
      await fixture.destroy();
    }
  },
);
