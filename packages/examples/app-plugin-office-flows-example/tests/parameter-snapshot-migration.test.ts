import path from 'node:path';
import { createMigrator } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import {
  parameterIdentity,
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import { OfficeStore } from '../server/services/store.js';
import { registerLifecycles } from '../server/lifecycles/index.js';
import { COLLECTIONS } from '../server/scope.js';
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
      if (kind === 'creation-only') {
        await noTransaction.latest();
        const id = String(Number(record.record.id));
        expect(
          await fixture.database
            .repository('officeFlowsCreationRequests')
            .findOne({
              filter: {
                id: parameterIdentity(
                  '$parameter-start-v1',
                  'office',
                  'incoming',
                  id,
                  'proof',
                ),
              },
            }),
        ).toMatchObject({ status: 'unstarted', revision: 0 });
        const runtime = new LifecycleRuntime({
          creationRequestsCollection: 'officeFlowsCreationRequests',
          store: createRepositoryLifecycleStore(fixture.database, {
            collections: {
              transitions: COLLECTIONS.transitions,
              effectRuns: COLLECTIONS.effectRuns,
            },
          }),
        });
        registerLifecycles(runtime, new OfficeStore(fixture.database));
        expect(
          (await runtime.view('incoming', id, { id: 'zhoujie' })).state,
        ).toBe('draft');
        await runtime.fire('incoming', id, 'submit', {
          actor: { id: 'zhoujie' },
        });
        expect(
          (await runtime.view('incoming', id, { id: 'zhoujie' })).state,
        ).toBe('headReview');
        await noTransaction.latest();
      } else {
        await expect(noTransaction.latest()).rejects.toThrow(
          kind === 'started'
            ? 'START_PARAMETERS_UNRECOVERABLE'
            : kind === 'partial-history'
              ? 'DRAFT_EDIT_HISTORY_UNPROVEN'
              : 'START_HISTORY_UNKNOWN',
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
      }
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
