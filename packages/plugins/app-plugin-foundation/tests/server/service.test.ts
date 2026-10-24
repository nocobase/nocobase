import { readFileSync } from 'node:fs';
import path from 'node:path';

import { driveManagerToken } from '@nocobase/app-server/drive';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { FOUNDATION_CAPABILITIES } from '../../shared/foundation.js';
import type { CapabilityCollector } from '../../server/capabilities/index.js';
import {
  ApplicationUnderConstruction,
  capability,
  metricValue,
  PACKAGE_ROOT,
} from '../helpers/application.js';

const now = new Date('2026-10-20T08:00:00.000Z');

describe('App Foundation overview', () => {
  let app: ApplicationUnderConstruction;

  beforeEach(async () => {
    app = await ApplicationUnderConstruction.create();
    await app.install(
      '@nocobase/app-plugin-authentication',
      '@nocobase/app-plugin-authorization',
    );
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('reports every capability in the band order, each with a status or a failure', async () => {
    const overview = await app.service().overview();

    expect(overview.capabilities.map((entry) => entry.key)).toEqual([
      ...FOUNDATION_CAPABILITIES,
    ]);
    expect(overview.connection).toBe('default');
    expect(Date.parse(overview.checkedAt)).not.toBeNaN();
  });

  it('withholds business counts when an unclassified runtime extension may own Collections', async () => {
    await app.migrateApplication();
    const overview = await app
      .service({
        runtimeProviders: () => [
          { name: '@vendor/injected-plugin', evidence: 'databaseContribution' },
        ],
      })
      .overview();
    expect(capability(overview, 'dataModeling')).toMatchObject({
      status: 'active',
      completeness: 'partial',
      facts: [{ code: 'collectionOwnershipUnknown' }],
    });
    expect(metricValue(overview, 'dataModeling', 'businessRecords')).toBeNull();
    expect(overview.inventory?.entries).toContainEqual(
      expect.objectContaining({
        name: '@vendor/injected-plugin',
        registration: 'observed',
        categories: [],
      }),
    );
  });

  it('lights up capabilities as the application is built', async () => {
    const service = app.service();

    // A fresh application: accounts and the data layer, nothing of its own yet.
    let overview = await service.overview();
    expect(capability(overview, 'dataModeling')).toMatchObject({
      status: 'active',
      facts: [{ code: 'noApplicationCollections' }],
    });
    expect(metricValue(overview, 'dataModeling', 'businessCollections')).toBe(
      0,
    );
    expect(capability(overview, 'usersAndOrganizations').status).toBe('active');
    expect(capability(overview, 'permissions')).toMatchObject({
      status: 'needsSetup',
      reason: 'onlyUnrestrictedAccess',
    });
    expect(capability(overview, 'workflows')).toMatchObject({
      status: 'unused',
      reason: 'noWorkflows',
    });
    expect(capability(overview, 'files')).toMatchObject({
      status: 'unused',
      reason: 'noFileCollection',
    });
    expect(capability(overview, 'notifications')).toMatchObject({
      status: 'unused',
      reason: 'notRegistered',
    });
    expect(capability(overview, 'audit')).toMatchObject({
      status: 'unused',
      reason: 'noRecognizedAudit',
    });

    // The application adds its own Collections, a file Collection and lifecycles.
    await app.migrateApplication();
    overview = await service.overview();
    expect(capability(overview, 'dataModeling').facts[0]).toEqual({
      code: 'applicationCollections',
      params: {
        count: 3,
        names: expect.arrayContaining([
          'equipment',
          'borrowings',
          'repairPhotos',
        ]),
      },
    });
    expect(metricValue(overview, 'dataModeling', 'relations')).toBe(1);
    // A file Collection without a drive to store into is wired in but cannot work yet.
    expect(capability(overview, 'files')).toMatchObject({
      status: 'needsSetup',
      reason: 'noDrive',
    });
    // Lifecycles are in use from the moment they are persisted, before anything moves.
    expect(capability(overview, 'workflows')).toMatchObject({
      status: 'active',
      facts: [{ code: 'lifecyclesWithoutTransitions' }],
    });

    app.container.instance(driveManagerToken, {} as never);
    overview = await service.overview();
    expect(capability(overview, 'files').status).toBe('active');
  });

  it('counts the application’s own records, not the ones NocoBase keeps', async () => {
    await app.migrateApplication();
    await app.database.repository('equipment').createMany({
      values: [
        { id: 'e1', name: 'Projector', createdAt: now },
        { id: 'e2', name: 'Camera', createdAt: now },
      ],
    });
    await app.database.repository('borrowings').createOne({
      values: {
        id: 'b1',
        equipmentId: 'e1',
        status: 'pending',
        createdAt: now,
      },
    });
    await app.database.repository('repairPhotos').createOne({
      values: {
        id: 'p1',
        disk: 'local',
        key: 'a.png',
        filename: 'a.png',
        ext: 'png',
        mimeType: 'image/png',
        size: 2048,
        createdAt: now,
        updatedAt: now,
      },
    });

    const overview = await app.service().overview({ countRecords: true });

    // Two pieces of equipment, one borrowing, one photo; the account and permission tables are not the application's.
    expect(metricValue(overview, 'dataModeling', 'businessRecords')).toBe(4);
    expect(metricValue(overview, 'files', 'files')).toBe(1);
    expect(metricValue(overview, 'files', 'storedBytes')).toBe(2048);
    expect(
      metricValue(overview, 'dataModeling', 'systemCollections'),
    ).toBeGreaterThan(0);
  });

  it('counts every permission set and grant across configuration pages', async () => {
    await app.migrateApplication();
    const values = Array.from({ length: 1001 }, (_, index) => ({
      id: `paged-role-${index}`,
      key: `paged-role-${index}`,
      title: `Role ${index}`,
      grants: [
        { resource: { type: 'page', id: 'equipment' }, action: 'access' },
      ],
      createdAt: now,
      updatedAt: now,
    }));
    for (let offset = 0; offset < values.length; offset += 200) {
      await app.database
        .repository('authorizationPermissionSets')
        .createMany({ values: values.slice(offset, offset + 200) });
    }
    const overview = await app.service().overview();
    expect(metricValue(overview, 'permissions', 'permissionSets')).toBe(1001);
    expect(metricValue(overview, 'permissions', 'grants')).toBe(1001);
    expect(capability(overview, 'permissions')).toMatchObject({
      completeness: 'complete',
      issues: [],
    });
  });

  it('counts grants outside the root Permission Set and lifecycle transitions', async () => {
    await app.migrateApplication();
    await app.database.repository('authorizationPermissionSets').createMany({
      values: [
        {
          id: 'root',
          key: 'root',
          title: 'Root',
          grants: [{ resource: { type: 'page', id: '*' }, action: 'access' }],
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'member',
          key: 'member',
          // A built-in set stores its title as a translation key, serialized into the text column.
          title: JSON.stringify({
            key: 'permissionSets.builtIn.member',
            ns: '@nocobase/app-plugin-authorization',
          }),
          grants: [
            { resource: { type: 'page', id: 'equipment' }, action: 'access' },
            {
              resource: { type: 'collection', id: 'borrowings' },
              action: 'create',
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    await app.database.repository('lifecycleTransitions').createMany({
      values: [1, 2, 3].map((version) => ({
        id: `t${version}`,
        lifecycle: 'borrowings',
        recordId: 'b1',
        transition: 'approve',
        to: 'borrowed',
        version,
        at: now,
      })),
    });
    await app.database.repository('lifecycleEffectRuns').createMany({
      values: [
        {
          id: 'r1',
          lifecycle: 'borrowings',
          effect: 'notify',
          status: 'succeeded',
          createdAt: now,
        },
        {
          id: 'r2',
          lifecycle: 'borrowings',
          effect: 'notify',
          status: 'dead',
          createdAt: now,
        },
      ],
    });

    const overview = await app.service().overview();

    expect(capability(overview, 'permissions').status).toBe('active');
    expect(metricValue(overview, 'permissions', 'grants')).toBe(2);
    expect(metricValue(overview, 'permissions', 'permissionSets')).toBe(1);
    // The page translates the key in the reader's language.
    expect(capability(overview, 'permissions').facts[0]).toEqual({
      code: 'permissionSets',
      params: {
        count: 1,
        names: [
          {
            key: 'permissionSets.builtIn.member',
            ns: '@nocobase/app-plugin-authorization',
          },
        ],
      },
    });
    expect(capability(overview, 'workflows').facts).toContainEqual({
      code: 'lifecycles',
      params: { count: 1, names: ['borrowings'], transitions: 3 },
    });
    expect(metricValue(overview, 'workflows', 'transitions')).toBe(3);
    expect(metricValue(overview, 'workflows', 'effectsSucceeded')).toBe(1);
    expect(metricValue(overview, 'workflows', 'effectsFailed')).toBe(1);
  });

  it('needs a channel before notifications are in use, and counts only accepted deliveries as delivered', async () => {
    await app.install(
      '@nocobase/app-plugin-notification',
      '@nocobase/app-plugin-notification-in-app',
    );
    const service = app.service();

    expect(capability(await service.overview(), 'notifications')).toMatchObject(
      { status: 'needsSetup', reason: 'noChannel' },
    );

    app.configure('notification', {
      channels: { inbox: { provider: 'in-app' } },
    });
    const overview = await service.overview();
    expect(capability(overview, 'notifications')).toMatchObject({
      status: 'active',
      facts: [
        {
          code: 'channels',
          params: { count: 1, names: ['inbox (in-app)'] },
        },
      ],
    });
    // No delivery yet: zero accepted is a real zero, not a missing value.
    expect(metricValue(overview, 'notifications', 'acceptedDeliveries')).toBe(
      0,
    );
  });

  it('needs a connected mailbox before mail is in use', async () => {
    await app.install('@nocobase/app-plugin-mail');

    expect(capability(await app.service().overview(), 'mail')).toMatchObject({
      status: 'needsSetup',
      reason: 'noConnectedMailbox',
    });
  });

  it('treats an API key nobody has used as no integration', async () => {
    await app.install('@nocobase/app-plugin-api-keys');

    expect(
      capability(await app.service().overview(), 'integrations'),
    ).toMatchObject({ status: 'unused', reason: 'noApiKey' });
  });

  it('reports the versions the application resolves', async () => {
    const overview = await app.service().overview();
    // Read from the installed manifest, which `@nocobase/db` does not export.
    const { version } = JSON.parse(
      readFileSync(
        path.join(PACKAGE_ROOT, 'node_modules/@nocobase/db/package.json'),
        'utf8',
      ),
    ) as { version: string };

    expect(capability(overview, 'dataModeling').packages).toContainEqual({
      name: '@nocobase/db',
      version,
    });
    // A package the application does not install is left out rather than shown without a version.
    expect(capability(overview, 'audit').packages).toEqual([]);
  });

  it('keeps the other capabilities when one fails or hangs, and gives the failed ones no status', async () => {
    const failing: CapabilityCollector = {
      key: 'mail',
      packages: [],
      collect: () => Promise.reject(new Error('connect ECONNREFUSED 10.0.0.4')),
    };
    const hanging: CapabilityCollector = {
      key: 'knowledge',
      packages: [],
      collect: () => new Promise(() => undefined),
    };
    const { CAPABILITY_COLLECTORS } =
      await import('../../server/capabilities/index.js');
    const collectors = CAPABILITY_COLLECTORS.map((collector) =>
      collector.key === 'mail'
        ? failing
        : collector.key === 'knowledge'
          ? hanging
          : collector,
    );

    const overview = await app
      .service({ collectors, collectorTimeoutMs: 50 })
      .overview();

    expect(capability(overview, 'mail')).toMatchObject({
      status: null,
      completeness: 'failed',
      issues: [{ code: 'COLLECTOR_FAILED' }],
    });
    expect(JSON.stringify(capability(overview, 'mail'))).not.toContain(
      'ECONNREFUSED',
    );
    expect(capability(overview, 'knowledge')).toMatchObject({
      status: null,
      completeness: 'failed',
      issues: [{ code: 'COLLECTOR_TIMEOUT' }],
    });
    expect(capability(overview, 'dataModeling').status).toBe('active');
  });

  it('answers a cached result until it expires or a refresh is asked for', async () => {
    let clock = Date.parse('2026-10-20T08:00:00.000Z');
    const service = app.service({ cacheTtlMs: 30_000, now: () => clock });

    const first = await service.overview();
    clock += 10_000;
    expect(await service.overview()).toBe(first);
    expect((await service.overview({ refresh: true })).checkedAt).not.toBe(
      first.checkedAt,
    );
    clock += 31_000;
    expect((await service.overview()).checkedAt).not.toBe(first.checkedAt);
  });

  it('preserves known catalog totals when a data scan times out', async () => {
    await app.migrateApplication();
    const overview = await app
      .service({
        collectorTimeoutMs: 20,
        collectors: [
          {
            key: 'dataModeling',
            packages: [],
            collect: () => new Promise(() => undefined),
          },
        ],
      })
      .overview();
    expect(capability(overview, 'dataModeling')).toMatchObject({
      status: 'active',
      completeness: 'partial',
      issues: [{ code: 'COLLECTOR_TIMEOUT' }],
    });
    expect(metricValue(overview, 'dataModeling', 'businessCollections')).toBe(
      3,
    );
    expect(metricValue(overview, 'dataModeling', 'fields')).toBeNull();
  });

  it('writes nothing while collecting', async () => {
    await app.migrateApplication();
    const before = await app.database.collections().list({ limit: 500 });
    const records = await app.database.repository('equipment').count();

    await app.service().overview();

    expect(await app.database.collections().list({ limit: 500 })).toEqual(
      before,
    );
    expect(await app.database.repository('equipment').count()).toBe(records);
  });
});
