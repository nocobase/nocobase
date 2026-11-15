import {
  parameterIdentity,
  LifecycleRuntime,
  createRepositoryLifecycleStore,
} from '@nocobase/lifecycle';
import { registerLifecycles } from '../server/lifecycles/index.js';
import { OfficeStore } from '../server/services/store.js';
import { OfficeFlowsService } from '../server/services/office-flows.js';
import path from 'node:path';
import { createMigrator } from '@nocobase/db';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';
import { migrations } from './fixtures.js';

it.each([
  'unknown',
  'started',
  'creation-only',
  'partial-history',
  'closed',
] as const)(
  'supplements released office records once despite missing creation history (%s)',
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
            status: kind === 'closed' ? 'closed' : 'draft',
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
      const original = await fixture.database
        .repository('officeFlowsTransitions')
        .findMany();
      await noTransaction.latest();
      const snapshot = (
        await fixture.database
          .repository('officeFlowsParameterSnapshots')
          .findOne({
            filter: {
              id: parameterIdentity(
                'office',
                'incoming',
                String(Number(record.record.id)),
              ),
            },
          })
      )?.payload;
      expect(snapshot).toMatchObject({
        lifecycle: 'incoming',
        revision: 0,
        sources: {
          dispatchRules: { origin: 'upgrade' },
          managementGroups: { origin: 'upgrade' },
        },
      });
      expect(
        await fixture.database.repository('officeFlowsTransitions').findMany(),
      ).toEqual(original);
      if (kind === 'unknown' || kind === 'closed') {
        const runtime = new LifecycleRuntime({
          store: createRepositoryLifecycleStore(fixture.database, {
            collections: {
              transitions: 'officeFlowsTransitions',
              effectRuns: 'officeFlowsEffectRuns',
            },
          }),
        });
        const store = new OfficeStore(fixture.database);
        registerLifecycles(runtime, store);
        const service = new OfficeFlowsService(
          fixture.database,
          runtime,
          store,
        );
        const id = String(Number(record.record.id));
        const before = await service.incomingDetail(id, 'zhoujie');
        expect(before.parameterSnapshot).toEqual(snapshot);
        await fixture.database
          .repository('officeFlowsWorkflowParameters')
          .createOne({
            values: {
              id: 'office.incoming',
              revision: 1,
              values: {
                dispatchRules: {
                  departmentNames: [],
                  ownDepartmentOnly: false,
                  assigneeRole: 'heads',
                  ccHeads: false,
                  ccLeaders: false,
                },
                managementGroups: [],
              },
            },
          });
        if (kind === 'unknown')
          await service.fire('incoming', id, 'submit', {}, 'zhoujie');
        expect(
          (await service.incomingDetail(id, 'zhoujie')).parameterSnapshot,
        ).toEqual(snapshot);
      }
      await noTransaction.latest();
      expect(
        await fixture.database
          .repository('officeFlowsParameterSnapshots')
          .count(),
      ).toBe(1);
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

it.each(['dataRequests', 'clerkTasks', 'teamTasks'])(
  'supplements released completed %s records and retains business deadlines',
  async (definition) => {
    const fixture = await createTestDatabase();
    try {
      const owner = createMigrator({
        database: fixture.database,
        sources: migrations,
      });
      await owner.upTo('202611130003_office_flows_definition_binding');
      const collection =
        definition === 'dataRequests'
          ? 'officeFlowsDataRequests'
          : definition === 'clerkTasks'
            ? 'officeFlowsClerkTasks'
            : 'officeFlowsTeamTasks';
      const created = await fixture.database.repository(collection).createOne({
        values: {
          number: 'LEGACY',
          status: definition === 'dataRequests' ? 'completed' : 'done',
          statusChangedAt: '2026-10-01T00:00:00.000Z',
          createdAt: '2026-10-01T00:00:00.000Z',
          lifecycleVersion: 7,
          lifecycleDefinition: definition,
          ...(definition === 'dataRequests'
            ? {
                applicantId: 'zhangwei',
                subject: 'Historical request',
                reason: 'Historical test',
                volume: 'small',
                scope: 'internal',
                frequency: 'once',
                deliveryDate: '2026-12-10',
              }
            : { rootId: 1, parentId: 1, departmentName: 'Example' }),
        },
      });
      const before = await fixture.database
        .repository(collection)
        .findOne({ filter: { id: created.record.id } });
      await owner.latest();
      expect(
        await fixture.database
          .repository(collection)
          .findOne({ filter: { id: created.record.id } }),
      ).toEqual(before);
      const id = String(Number(created.record.id));
      const snapshot = (
        await fixture.database
          .repository('officeFlowsParameterSnapshots')
          .findOne({
            filter: { id: parameterIdentity('office', definition, id) },
          })
      )?.payload;
      expect(snapshot).toMatchObject({ lifecycle: definition, revision: 0 });
      const runtime = new LifecycleRuntime({
        store: createRepositoryLifecycleStore(fixture.database, {
          collections: {
            transitions: 'officeFlowsTransitions',
            effectRuns: 'officeFlowsEffectRuns',
          },
        }),
      });
      registerLifecycles(runtime, new OfficeStore(fixture.database));
      expect(
        (await runtime.view(definition, id, { id: 'zhangwei' }))
          .parameterSnapshot,
      ).toEqual(snapshot);
      if (definition === 'teamTasks')
        expect(snapshot).toMatchObject({
          values: { dispatchRules: { ownDepartmentOnly: true } },
        });
    } finally {
      await fixture.destroy();
    }
  },
);

it.each(['configuration', 'binding'])(
  'preflights invalid office %s before any schema writes',
  async (kind) => {
    const fixture = await createTestDatabase();
    try {
      const owner = createMigrator({
        database: fixture.database,
        sources: migrations,
      });
      await owner.upTo('202611130003_office_flows_definition_binding');
      await fixture.database.repository('officeFlowsClerkTasks').createOne({
        values: {
          number: 'BAD',
          rootId: 1,
          parentId: 1,
          departmentName: 'Example',
          status: 'done',
          statusChangedAt: '2026-10-01T00:00:00.000Z',
          createdAt: '2026-10-01T00:00:00.000Z',
          lifecycleVersion: 1,
          lifecycleDefinition: kind === 'binding' ? 'unknown' : 'clerkTasks',
        },
      });
      if (kind === 'configuration')
        await fixture.database
          .repository('officeFlowsWorkflowParameters')
          .createOne({
            values: {
              id: 'office.clerkTasks',
              revision: 1,
              values: { dispatchRules: { ownDepartmentOnly: 'invalid' } },
            },
          });
      const migrator = createMigrator({
        database: fixture.database,
        sources: [
          {
            packageName: 'office-preflight',
            directory: path.resolve(
              import.meta.dirname,
              'fixtures/nontransactional-snapshot',
            ),
          },
        ],
      });
      const before = await fixture.database
        .repository('officeFlowsWorkflowParameters')
        .findMany();
      await expect(migrator.latest()).rejects.toThrow(
        kind === 'configuration'
          ? 'CONFIGURATION_INVALID'
          : 'DEFINITION_BINDING_UNKNOWN',
      );
      fixture.database.connection().collections.invalidate();
      expect(
        await fixture.database
          .connection()
          .collections.get('officeFlowsParameterSnapshots'),
      ).toBeUndefined();
      expect(
        await fixture.database
          .repository('officeFlowsWorkflowParameters')
          .findMany(),
      ).toEqual(before);
    } finally {
      await fixture.destroy();
    }
  },
);
