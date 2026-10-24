import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';
import { driveManagerToken } from '@nocobase/app-server/drive';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, expect, it } from 'vitest';

import { files } from '../../server/capabilities/data.js';
import { mail } from '../../server/capabilities/messaging.js';
import { permissions } from '../../server/capabilities/people.js';
import { workflows } from '../../server/capabilities/processes.js';
import type { CapabilityCollector } from '../../server/capabilities/types.js';
import { DefaultFoundationService } from '../../server/services/foundation.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function fixture(collector: CapabilityCollector, names: string[]) {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'foundation-history-'));
  roots.push(rootDir);
  await writeFile(path.join(rootDir, 'package.json'), '{"name":"history-app"}');
  const state = {
    names,
    failed: new Set<string>(),
    definitionsFailed: new Set<string>(),
    nonFiles: new Set<string>(),
    count: 3,
    grants: true,
    now: Date.parse('2026-10-20T08:00:00Z'),
    connection: {},
    tablePrefix: '',
    providers: [] as { name: string; evidence: 'serverRegistration' }[],
    rootSet: 'root',
  };
  const database = {
    connection: () => state.connection,
    collections: () => ({
      list: async () => ({
        items: state.names.map((name) => ({
          name,
          kind: 'table',
          tableName: state.tablePrefix + name,
        })),
      }),
      get: async (name: string) => {
        if (state.definitionsFailed.has(name))
          throw new Error('private schema detail');
        return {
          name,
          fields: state.nonFiles.has(name)
            ? []
            : ['disk', 'key', 'filename', 'ext', 'mimeType', 'size'].map(
                (name) => ({ name, type: 'string' }),
              ),
        };
      },
    }),
    repository: (name: string) => {
      const read = () => {
        if (state.failed.has(name)) throw new Error('private driver detail');
        return state.count;
      };
      return {
        count: async () => read(),
        aggregate: async () => ({ total: read() * 40 }),
        groupBy: async () => [{ status: 'active', count: read() }],
        findMany: async () => {
          read();
          return [
            { key: 'member', grants: state.grants && state.count ? [{}] : [] },
          ];
        },
      };
    },
  } as unknown as DatabaseManager;
  const container = new ServiceContainer();
  container.instance(databaseManagerToken, database);
  container.instance(driveManagerToken, {} as never);
  const createService = () =>
    new DefaultFoundationService({
      container,
      rootDir,
      hasClient: true,
      config: {
        get: <T>() => ({ permissionSets: { rootSet: state.rootSet } }) as T,
      },
      collectors: [collector],
      now: () => state.now,
      runtimeProviders: () => state.providers,
    });
  const service = createService();
  const refresh = async () => {
    state.now += 60_000;
    return (await service.overview({ refresh: true })).capabilities[0]!;
  };
  return { state, service, refresh, createService, rootDir };
}

it('retains the original status and metric dates across repeated failures, then recovers', async () => {
  const { state, refresh } = await fixture(mail, [
    'mailAccounts',
    'mailMessages',
  ]);
  await refresh();
  const original = new Date(state.now).toISOString();
  state.failed.add('mailAccounts');
  state.count = 9;
  let current = await refresh();
  expect(current).toMatchObject({
    status: 'active',
    checkedAt: original,
    completeness: 'partial',
  });
  expect(current.reason).toBeUndefined();
  expect(current.metrics).toContainEqual(
    expect.objectContaining({
      key: 'connectedMailboxes',
      value: 3,
      checkedAt: original,
    }),
  );
  expect(current.metrics).toContainEqual(
    expect.objectContaining({ key: 'messages', value: 9 }),
  );
  expect(
    current.metrics.find((item) => item.key === 'messages')?.checkedAt,
  ).toBeUndefined();
  current = await refresh();
  expect(current.checkedAt).toBe(original);
  state.failed.clear();
  state.count = 0;
  current = await refresh();
  expect(current).toMatchObject({
    status: 'needsSetup',
    reason: 'noConnectedMailbox',
  });
  expect(current.checkedAt).toBeUndefined();
  expect(
    current.metrics.find((item) => item.key === 'connectedMailboxes'),
  ).toMatchObject({ value: 0, complete: true });
});

it('retains reliable observations after a whole collector failure without leaking the cause', async () => {
  let fail = false;
  const collector: CapabilityCollector = {
    ...mail,
    collect: (context) => {
      if (fail) throw new Error('private connection detail');
      return mail.collect(context);
    },
  };
  const { state, refresh } = await fixture(collector, ['mailAccounts']);
  await refresh();
  const original = new Date(state.now).toISOString();
  fail = true;
  const current = await refresh();
  expect(current).toMatchObject({
    status: 'active',
    checkedAt: original,
    completeness: 'failed',
  });
  expect(
    current.metrics.find((item) => item.key === 'connectedMailboxes'),
  ).toMatchObject({ value: 3, checkedAt: original });
  expect(JSON.stringify(current)).not.toContain('private');
});

it('retains scheduler metrics and its independently dated active subpart after a read failure', async () => {
  const { state, refresh } = await fixture(workflows, ['scheduleDefinitions']);
  await refresh();
  const original = new Date(state.now).toISOString();
  state.failed.add('scheduleDefinitions');
  const current = await refresh();
  expect(current).toMatchObject({ status: 'active', checkedAt: original });
  expect(
    current.metrics.find((item) => item.key === 'schedules'),
  ).toMatchObject({ value: 3, checkedAt: original });
  expect(current.parts).toContainEqual({
    key: 'schedules',
    status: 'active',
    checkedAt: original,
  });
});

it('does not reuse an earlier negative conclusion as current evidence or share history between services', async () => {
  const { state, refresh, createService } = await fixture(mail, [
    'mailAccounts',
  ]);
  state.count = 0;
  await refresh();
  state.failed.add('mailAccounts');
  expect(await refresh()).toMatchObject({ status: null });
  const isolated = (await createService().overview()).capabilities[0]!;
  expect(isolated.status).toBeNull();
  expect(
    isolated.metrics.find((item) => item.key === 'connectedMailboxes')?.value,
  ).toBeNull();
});

it('prefers the last complete file totals to a new partial scan with the original dates and facts', async () => {
  const { state, refresh } = await fixture(files, ['photos', 'otherPhotos']);
  await refresh();
  const original = new Date(state.now).toISOString();
  state.definitionsFailed.add('otherPhotos');
  state.count = 1;
  const current = await refresh();
  expect(current.metrics).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        key: 'files',
        value: 6,
        complete: true,
        checkedAt: original,
      }),
      expect.objectContaining({
        key: 'storedBytes',
        value: 240,
        checkedAt: original,
      }),
      expect.objectContaining({
        key: 'fileCollections',
        value: 2,
        checkedAt: original,
      }),
    ]),
  );
  expect(current.facts[0]).toMatchObject({
    code: 'fileCollections',
    checkedAt: original,
    params: { count: 2 },
  });
  state.definitionsFailed.add('photos');
  expect((await refresh()).metrics[0]).toMatchObject({
    value: 6,
    checkedAt: original,
  });
});

it.each([
  'catalog',
  'table',
  'connection',
  'ownership',
  'application',
  'definition',
])('invalidates exact file history when %s changes', async (change) => {
  const { state, refresh, rootDir } = await fixture(files, [
    'photos',
    'otherPhotos',
  ]);
  await refresh();
  if (change === 'catalog') state.names.push('newTable');
  if (change === 'table') state.tablePrefix = 'new_';
  if (change === 'connection') state.connection = {};
  if (change === 'ownership')
    state.providers.push({
      name: '@vendor/custom',
      evidence: 'serverRegistration',
    });
  if (change === 'application')
    await writeFile(
      path.join(rootDir, 'package.json'),
      '{"name":"another-app"}',
    );
  if (change === 'definition') state.nonFiles.add('photos');
  state.definitionsFailed.add('otherPhotos');
  const current = await refresh();
  expect(current.metrics.every((item) => item.checkedAt === undefined)).toBe(
    true,
  );
  expect(current.metrics.find((item) => item.key === 'files')?.complete).toBe(
    false,
  );
});

it('does not resurrect a previously active permission part contradicted by a current zero', async () => {
  const { state, refresh } = await fixture(permissions, [
    'authorizationPermissionSets',
    'authorizationSharingRules',
  ]);
  state.grants = false;
  await refresh();
  state.failed.add('authorizationPermissionSets');
  state.count = 0;
  const current = await refresh();
  expect(current.status).toBeNull();
  expect(current.parts).toContainEqual({
    key: 'sharingRules',
    status: 'unused',
  });
  state.rootSet = 'changedRoot';
  expect(
    (await refresh()).metrics.find((metric) => metric.key === 'grants')?.value,
  ).toBeNull();
});

it('dates historical composite usage from the still-applicable active part', async () => {
  const { state, refresh } = await fixture(permissions, [
    'authorizationPermissionSets',
    'authorizationSharingRules',
  ]);
  await refresh();
  const original = new Date(state.now).toISOString();
  state.failed.add('authorizationPermissionSets');
  await refresh();
  state.count = 0;
  const current = await refresh();
  expect(current).toMatchObject({ status: 'active', checkedAt: original });
  expect(current.parts).toContainEqual({
    key: 'permissionSets',
    status: 'active',
    checkedAt: original,
  });
  expect(current.parts).toContainEqual({
    key: 'sharingRules',
    status: 'unused',
  });
});
