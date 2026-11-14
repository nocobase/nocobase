import { parameterIdentity } from '@nocobase/lifecycle';
import path from 'node:path';
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
      await migrator.upTo('202611130003_office_flows_definition_binding');
      const record = await fixture.database
        .repository('officeFlowsIncoming')
        .createOne({
          values: {
            number: 'HISTORY-1',
            title: 'History',
            code: 'UPGRADE',
            sender: 'Example office',
            senderRef: 'REF-1',
            summary: 'Upgrade acceptance',
            officeOpinion: 'Review required',
            distributionType: 'normal',
            registrarId: 'zhoujie',
            officeHeadId: 'xulei',
            officeLeaderId: 'fanqing',
            status: 'draft',
            statusChangedAt: '2026-10-01T00:00:00.000Z',
            lifecycleVersion: kind === 'partial-history' ? 3 : 1,
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
      const noTransaction = createMigrator({
        database: fixture.database,
        sources: [
          {
            packageName: 'office-snapshot-preflight-test',
            directory: path.resolve(
              import.meta.dirname,
              'fixtures/nontransactional-snapshot',
            ),
          },
        ],
      });
      await expect(noTransaction.latest()).rejects.toThrow(
        'CREATION_PARAMETERS_UNRECOVERABLE',
      );
      fixture.database.connection().collections.invalidate();
      expect(
        await fixture.database
          .connection()
          .collections.get('officeFlowsParameterSnapshots'),
      ).toBeUndefined();
      expect(
        await fixture.database
          .connection()
          .collections.get('officeFlowsCreationRequests'),
      ).toBeUndefined();
      // Fix an unprovable imported record, then retry the exact nontransactional migration.
      await fixture.database
        .repository('officeFlowsIncoming')
        .deleteMany({ filter: { id: record.record.id } });
      await noTransaction.latest();
      await noTransaction.latest();
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

it.each([
  'valid',
  'identity',
  'at',
  'schemaVersion',
  'origin',
  'values',
  'recovery',
])(
  'preflights a retained office dispatch creation snapshot (%s)',
  async (field) => {
    const fixture = await createTestDatabase();
    try {
      const owner = createMigrator({
        database: fixture.database,
        sources: migrations,
      });
      await owner.upTo('202611130003_office_flows_definition_binding');
      await fixture.database
        .builder()
        .createCollection('officeFlowsParameterSnapshots', (table) => {
          table.string('id', { length: 64 }).primary().notNull();
          table.json('payload').notNull();
        });
      const created = await fixture.database
        .repository('officeFlowsClerkTasks')
        .createOne({
          values: {
            number: 'OLD-DISPATCH',
            rootId: 1,
            parentId: 1,
            departmentName: 'Example',
            status: 'signing',
            statusChangedAt: '2026-10-01T00:00:00.000Z',
            lifecycleVersion: 1,
            createdAt: '2026-10-01T00:00:00.000Z',
            lifecycleDefinition: 'clerkTasks',
          },
        });
      const recordId = String(Number(created.record.id));
      const payload: Record<string, unknown> = {
        scope: 'office',
        lifecycle: 'clerkTasks',
        recordId,
        at: '2026-10-01T00:00:00.000Z',
        revision: 0,
        values: {
          dispatchRules: {
            departmentNames: [],
            ownDepartmentOnly: false,
            assigneeRole: 'clerks',
            ccHeads: false,
            ccLeaders: false,
          },
        },
        sources: {
          dispatchRules: {
            group: 'clerkTasks',
            schemaVersion: 1,
            revision: 0,
            origin: 'default',
          },
        },
      };
      const source = (
        payload.sources as Record<string, Record<string, unknown>>
      ).dispatchRules;
      if (field === 'identity') payload.recordId = 'other';
      if (field === 'at') payload.at = 'January 1, 2026';
      if (field === 'schemaVersion') source.schemaVersion = 2;
      if (field === 'origin') source.origin = 'unknown';
      if (field === 'values') payload.values = { dispatchRules: {} };
      if (field === 'recovery') payload.recoveredFrom = { transitionId: 12 };
      const id = parameterIdentity('office', 'clerkTasks', recordId);
      await fixture.database
        .repository('officeFlowsParameterSnapshots')
        .createOne({ values: { id, payload } });
      const migrator = createMigrator({
        database: fixture.database,
        sources: [
          {
            packageName: 'office-retained-snapshot-test',
            directory: path.resolve(
              import.meta.dirname,
              'fixtures/nontransactional-snapshot',
            ),
          },
        ],
      });
      if (field === 'valid') {
        await migrator.latest();
        await migrator.latest();
        await expect(migrator.rollback()).rejects.toThrow(
          'Parameter snapshots and receipts are retained.',
        );
      } else {
        await expect(migrator.latest()).rejects.toThrow(
          'PARAMETER_SNAPSHOT_INVALID',
        );
        expect(
          await fixture.database
            .connection()
            .collections.get('officeFlowsCreationRequests'),
        ).toBeUndefined();
      }
      expect(
        (
          await fixture.database
            .repository('officeFlowsParameterSnapshots')
            .findOne({ filter: { id } })
        )?.payload,
      ).toEqual(payload);
    } finally {
      await fixture.destroy();
    }
  },
);
