import { createMigrator } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import { migrations } from './fixtures.js';

it.each(['unknown', 'started', 'draft'] as const)(
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
            transition: kind === 'draft' ? '$create' : 'submit',
            from: kind === 'draft' ? null : 'draft',
            to: kind === 'draft' ? 'draft' : 'headReview',
            actorId: 'zhoujie',
            input: {},
            at: '2026-10-01T00:00:00.000Z',
            version: 1,
            requestId: null,
            requestKey: '$v:1',
          },
        });
      if (kind === 'draft') {
        await migrator.latest();
        expect(
          await fixture.database
            .repository('officeFlowsParameterSnapshots')
            .count(),
        ).toBe(0);
      } else
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
