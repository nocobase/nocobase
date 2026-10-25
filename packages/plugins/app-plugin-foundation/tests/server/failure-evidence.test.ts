import type { CollectionDefinition, DatabaseManager } from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it } from 'vitest';

import { files } from '../../server/capabilities/data.js';
import { knowledge } from '../../server/capabilities/intelligence.js';
import { mail } from '../../server/capabilities/messaging.js';
import { permissions } from '../../server/capabilities/people.js';
import {
  integrations,
  operations,
} from '../../server/capabilities/platform.js';
import { workflows } from '../../server/capabilities/processes.js';
import type { CapabilityCollector } from '../../server/capabilities/types.js';
import { Inventory, Probe } from '../../server/inventory.js';

const unavailable = async (): Promise<never> => {
  throw new Error('private driver connection detail');
};
const fileFields = ['disk', 'key', 'filename', 'ext', 'mimeType', 'size'];

async function collect(
  collector: CapabilityCollector,
  names: string[],
  options: {
    fail?: string[];
    count?: number;
    definition?: (name: string) => Promise<unknown>;
    failOwnMigrations?: boolean;
  } = {},
) {
  const database = {
    query: () => ({
      selectFrom: () => {
        let own = false;
        const query = {
          select: () => query,
          where: () => {
            own = true;
            return query;
          },
          executeTakeFirst: async () => {
            if (own && options.failOwnMigrations) return unavailable();
            return { count: options.count ?? 0, latest: null };
          },
        };
        return query;
      },
    }),
    collections: () => ({
      list: async () => ({
        items: names.map((name) => ({ name, kind: 'table', tableName: name })),
      }),
      get: options.definition ?? (async () => ({ fields: [] })),
    }),
    repository: (name: string) => {
      const fails = options.fail?.includes(name);
      return {
        count: fails ? unavailable : async () => options.count ?? 0,
        groupBy: fails
          ? unavailable
          : async () => [{ status: 'active', count: options.count ?? 0 }],
        findMany: fails ? unavailable : async () => [],
        aggregate: fails ? unavailable : async () => ({ total: 120 }),
      };
    },
  } as unknown as DatabaseManager;
  const probe = new Probe(await Inventory.read(database));
  const result = await collector.collect({
    probe,
    container: new ServiceContainer(),
    config: { get: () => undefined },
    applicationName: 'test-app',
    hasClient: true,
  });
  return { result, issues: probe.issues };
}

describe('evidence failures are not negative conclusions', () => {
  it('does not claim zero application migrations when their independent read fails', async () => {
    const { result, issues } = await collect(operations, [], {
      count: 8,
      failOwnMigrations: true,
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(result.status).toBe('active');
    expect(result.facts).toEqual([]);
    expect(result.metrics).toContainEqual(
      expect.objectContaining({ key: 'migrations', value: 8 }),
    );
    expect(result.metrics).toContainEqual(
      expect.objectContaining({ key: 'applicationMigrations', value: null }),
    );
  });
  it.each([
    [mail, ['mailAccounts']],
    [integrations, ['apikey']],
    [permissions, ['authorizationPermissionSets']],
    [workflows, ['scheduleDefinitions']],
    [knowledge, ['kbSpaces', 'kbDocs']],
  ] as [CapabilityCollector, string[]][])(
    '%s leaves the first failed read pending and recovers to a real zero',
    async (collector, names) => {
      const { result, issues } = await collect(collector, names, {
        fail: names,
      });
      expect(issues.length).toBeGreaterThan(0);
      expect(result.status).toBeNull();
      expect(result.reason).toBeUndefined();
      expect(result.facts ?? []).toEqual([]);
      const recovered = await collect(collector, names);
      expect(recovered.issues).toEqual([]);
      expect(recovered.result.status).not.toBeNull();
      expect(recovered.result.status).not.toBe('active');
    },
  );

  it('keeps a connected mailbox when message statistics fail', async () => {
    const { result } = await collect(mail, ['mailAccounts', 'mailMessages'], {
      fail: ['mailMessages'],
      count: 1,
    });
    expect(result.status).toBe('active');
    expect(result.reason).toBeUndefined();
    expect(result.metrics).toContainEqual(
      expect.objectContaining({ key: 'messages', value: null }),
    );
  });

  it('judges permission parts independently of confirmed sharing rules', async () => {
    const { result } = await collect(
      permissions,
      ['authorizationPermissionSets', 'authorizationSharingRules'],
      {
        fail: ['authorizationPermissionSets'],
        count: 1,
      },
    );
    expect(result.status).toBe('active');
    expect(result.parts).toContainEqual({
      key: 'permissionSets',
      status: null,
    });
    expect(result.parts).toContainEqual({
      key: 'sharingRules',
      status: 'active',
    });
  });

  it('keeps lifecycle storage integration without inventing absent transitions', async () => {
    const { result } = await collect(
      workflows,
      ['lifecycleTransitions', 'scheduleDefinitions'],
      {
        fail: ['lifecycleTransitions', 'scheduleDefinitions'],
      },
    );
    expect(result.status).toBe('active');
    expect(result.facts).toEqual([]);
    expect(result.parts).toContainEqual({ key: 'schedules', status: null });
    expect(result.parts).toContainEqual({
      key: 'lifecycles',
      status: 'active',
    });
  });
});

describe('file discovery and aggregation completeness', () => {
  const definition = async (name: string): Promise<CollectionDefinition> => {
    if (name === 'unreadable') return unavailable();
    return {
      name,
      fields: fileFields.map((name) => ({ name, type: 'string' })),
    } as CollectionDefinition;
  };

  it('marks all file metrics and the fact partial when a candidate is unreadable', async () => {
    const { result } = await collect(files, ['photos', 'unreadable'], {
      definition,
      count: 3,
    });
    expect(
      result.metrics?.map(({ key, value, complete }) => [key, value, complete]),
    ).toEqual([
      ['files', 3, false],
      ['storedBytes', 120, false],
      ['fileCollections', 1, false],
    ]);
    expect(result.facts?.[0]).toMatchObject({ code: 'fileCollectionsPartial' });
  });

  it('does not invent zero or no file tables when all candidates are unreadable', async () => {
    const { result } = await collect(files, ['unreadable'], { definition });
    expect(result.status).toBeNull();
    expect(result.reason).toBeUndefined();
    expect(result.metrics?.every((item) => item.value === null)).toBe(true);
  });

  it('keeps exact zero for a fully identified empty file table', async () => {
    const { result } = await collect(files, ['photos'], {
      definition,
      count: 0,
    });
    expect(result.metrics).toContainEqual(
      expect.objectContaining({ key: 'files', value: 0, complete: true }),
    );
    expect(result.metrics).toContainEqual(
      expect.objectContaining({
        key: 'fileCollections',
        value: 1,
        complete: true,
      }),
    );
  });

  it('separates aggregation failures from complete table discovery', async () => {
    const { result } = await collect(files, ['photos', 'otherPhotos'], {
      definition,
      fail: ['otherPhotos'],
      count: 3,
    });
    expect(result.metrics).toContainEqual(
      expect.objectContaining({ key: 'files', value: 3, complete: false }),
    );
    expect(result.metrics).toContainEqual(
      expect.objectContaining({
        key: 'fileCollections',
        value: 2,
        complete: true,
      }),
    );
  });
});
