/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database, Model } from '@nocobase/database';
import { createMockServer, type MockServer } from '@nocobase/test';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionReferenceRecord } from '../../shared/types';
import PluginLightExtensionServer from '../plugin';
import { createLightExtensionContextsResource } from '../resources/lightExtensionContexts';
import {
  type ContextServiceContext,
  LightExtensionContextPackService,
} from '../services/LightExtensionContextPackService';
import {
  hashReferenceOwnerLocator,
  ReferenceOwnerAuthoringContextResolverRegistry,
} from '../services/ReferenceOwnerRegistry';
import type { ReferenceService } from '../services/ReferenceService';

describe('LightExtensionContextPackService', () => {
  it('keeps an unselected multi-binding entry ambiguous and exposes only safe reference summaries', async () => {
    const references = [reference('ref_orders', 'owner_orders'), reference('ref_customers', 'owner_customers')];
    const { service, readVisibleReferenceOwner } = createService({ references });

    const result = await service.getContextPack({ repoId: 'repo_sales', entryId: 'entry_dashboard' });

    expect(result).toMatchObject({
      contextMode: 'multiple',
      reason: 'multiple_bindings',
      references: [
        { id: 'ref_orders', ownerLocatorHash: references[0].ownerLocatorHash },
        { id: 'ref_customers', ownerLocatorHash: references[1].ownerLocatorHash },
      ],
    });
    expect(result.binding).toBeUndefined();
    expect(result.collection).toBeUndefined();
    expect(readVisibleReferenceOwner).not.toHaveBeenCalled();
  });

  it('builds distinct precise packs for two explicit bindings and filters collection fields through ACL', async () => {
    const references = [reference('ref_orders', 'owner_orders'), reference('ref_customers', 'owner_customers')];
    const owners = {
      owner_orders: owner('owner_orders', 'orders'),
      owner_customers: owner('owner_customers', 'customers'),
    };
    const can = vi.fn(async ({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'orders' && action === 'list') {
        return { params: { fields: ['id', 'title', 'status', 'customer'], except: ['customer'] } };
      }
      if (resource === 'orders' && action === 'update') {
        return { params: { fields: ['title', 'status'], blacklist: ['status'] } };
      }
      if (resource === 'customers' && action === 'list') {
        return false;
      }
      if (resource === 'customers' && action === 'update') {
        return false;
      }
      return {};
    });
    const { service } = createService({ references, owners });

    const orders = await service.getContextPack(
      { repoId: 'repo_sales', entryId: 'entry_dashboard', referenceId: 'ref_orders' },
      { can },
    );
    const customers = await service.getContextPack(
      { repoId: 'repo_sales', entryId: 'entry_dashboard', referenceId: 'ref_customers' },
      { can },
    );

    expect(orders).toMatchObject({
      contextMode: 'precise',
      reason: 'precise_binding',
      binding: { referenceId: 'ref_orders', owner: { modelUid: 'owner_orders', collectionName: 'orders' } },
      collection: {
        dataSourceKey: 'main',
        name: 'orders',
        fields: [
          expect.objectContaining({ name: 'id', readable: true, writable: false }),
          expect.objectContaining({ name: 'status', enum: ['draft', 'published'], readable: true, writable: false }),
          expect.objectContaining({ name: 'title', readable: true, writable: true }),
        ],
      },
    });
    expect(orders.collection?.fields.map((field) => field.name)).toEqual(['id', 'status', 'title']);
    expect(JSON.stringify(orders)).not.toContain('secret-default');
    expect(customers).toMatchObject({ contextMode: 'generic', reason: 'collection_read_denied' });
    expect(customers.binding).toBeUndefined();
    expect(customers.contextHash).not.toBe(orders.contextHash);
  });

  it('returns a generic pack for unsupported entry kinds without resolving an owner', async () => {
    const { service, readVisibleReferenceOwner } = createService({ entryKind: 'js-action' });

    const result = await service.getContextPack({ repoId: 'repo_sales', entryId: 'entry_dashboard' });

    expect(result).toMatchObject({ contextMode: 'generic', reason: 'entry_kind_unsupported' });
    expect(readVisibleReferenceOwner).not.toHaveBeenCalled();
  });

  it('uses the selected data source ACL instead of the main request ACL', async () => {
    const references = [reference('ref_orders', 'owner_orders')];
    const getPermission = vi.fn(async (_dataSourceKey, _collectionName, action: string) =>
      action === 'list' ? { params: { fields: ['id'] } } : false,
    );
    const { service } = createService({
      references,
      owners: { owner_orders: owner('owner_orders', 'orders', 'analytics') },
      getPermission,
    });
    const mainCan = vi.fn().mockResolvedValue({});

    const result = await service.getContextPack(
      { repoId: 'repo_sales', entryId: 'entry_dashboard', referenceId: 'ref_orders' },
      { can: mainCan, state: { currentRoles: ['analyst'] } },
    );

    expect(result.collection).toMatchObject({ dataSourceKey: 'analytics', name: 'orders' });
    expect(result.collection?.fields.map((field) => field.name)).toEqual(['id']);
    expect(getPermission).toHaveBeenCalledWith(
      'analytics',
      'orders',
      'list',
      expect.objectContaining({ state: { currentRoles: ['analyst'] } }),
    );
    expect(mainCan).not.toHaveBeenCalled();
  });

  it('normalizes the public context resource input and forwards the current ACL context', async () => {
    const getContextPack = vi.fn().mockResolvedValue({ contextMode: 'generic' });
    const resource = createLightExtensionContextsResource({
      getContextPack,
    } as unknown as LightExtensionContextPackService);
    const action = resource.actions?.get;
    if (typeof action !== 'function') {
      throw new Error('lightExtensionContexts:get is unavailable');
    }
    const can = vi.fn();
    const ctx = {
      action: {
        params: {
          values: {
            repoId: ' repo_sales ',
            entryId: ' entry_dashboard ',
            referenceId: ' ref_orders ',
          },
        },
      },
      auth: { user: { id: 7 } },
      can,
    };

    await action(ctx as never, vi.fn());

    expect(getContextPack).toHaveBeenCalledWith(
      { repoId: 'repo_sales', entryId: 'entry_dashboard', referenceId: 'ref_orders' },
      expect.objectContaining({ actorUserId: '7', can, currentUser: { id: 7 } }),
    );
    expect(ctx).toMatchObject({ body: { contextMode: 'generic' } });
  });

  it('bounds reference and settings metadata while keeping an explicit binding precise', async () => {
    const references = Array.from({ length: 129 }, (_, index) => reference(`ref_${index}`, `owner_${index}`));
    const { service } = createService({
      references,
      owners: { owner_128: owner('owner_128', 'orders') },
    });

    const unselected = await service.getContextPack({ repoId: 'repo_sales', entryId: 'entry_dashboard' });
    const selected = await service.getContextPack({
      repoId: 'repo_sales',
      entryId: 'entry_dashboard',
      referenceId: 'ref_128',
    });
    const oversized = createService({
      settingsSchema: { type: 'object', description: 'x'.repeat(70 * 1024) },
    });

    expect(unselected).toMatchObject({ contextMode: 'generic', reason: 'reference_limit_exceeded' });
    expect(unselected.references).toHaveLength(128);
    expect(selected).toMatchObject({ contextMode: 'precise', reason: 'precise_binding' });
    expect(selected.references).toEqual([expect.objectContaining({ id: 'ref_128' })]);
    await expect(
      oversized.service.getContextPack({ repoId: 'repo_sales', entryId: 'entry_dashboard' }),
    ).resolves.toMatchObject({
      contextMode: 'generic',
      reason: 'settings_schema_limit_exceeded',
      entry: { settingsSchema: null },
    });
  });

  it('rejects a Context Pack that exceeds the total serialized size limit', async () => {
    const oversized = createService({
      references: [reference('ref_orders', 'owner_orders')],
      owners: { owner_orders: owner('owner_orders', 'orders') },
      collectionFields: Array.from({ length: 512 }, (_, index) =>
        field(`field_${index}_${'x'.repeat(600)}`, { type: 'string' }),
      ),
    });

    await expect(
      oversized.service.getContextPack({
        repoId: 'repo_sales',
        entryId: 'entry_dashboard',
        referenceId: 'ref_orders',
      }),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_VALIDATION_FAILED',
      status: 422,
      details: { reasonCode: 'context_pack_too_large', maxBytes: 256 * 1024 },
    });
  });

  it('isolates concurrent Context Packs across real users, roles, and entries', async () => {
    let app: MockServer | undefined;
    try {
      app = await createMockServer({
        plugins: ['field-sort', 'users', 'auth', 'acl', 'data-source-manager', PluginLightExtensionServer],
      });
      const suffix = Date.now();
      const roleOrders = `contextOrders_${suffix}`;
      const roleCustomers = `contextCustomers_${suffix}`;
      await app.db.getRepository('roles').create({ values: { name: roleOrders } });
      await app.db.getRepository('roles').create({ values: { name: roleCustomers } });
      const userOrders = await app.db.getRepository('users').create({
        values: { nickname: `Context orders ${suffix}`, roles: [roleOrders] },
      });
      const userCustomers = await app.db.getRepository('users').create({
        values: { nickname: `Context customers ${suffix}`, roles: [roleCustomers] },
      });
      const repo = await app.db.getRepository('lightExtensionRepos').create({
        values: {
          vscRepoId: `vscr_context_${suffix}`,
          name: `context-${suffix}`,
          normalizedName: `context-${suffix}`,
        },
      });
      const repoId = String(repo.get('id'));
      const entryOrders = await createContextEntry(app, repoId, 'orders');
      const entryCustomers = await createContextEntry(app, repoId, 'customers');
      const references = new Map([
        [String(entryOrders.get('id')), integrationReference(repoId, String(entryOrders.get('id')), 'orders')],
        [String(entryCustomers.get('id')), integrationReference(repoId, String(entryCustomers.get('id')), 'customers')],
      ]);
      const referenceService = {
        readReferences: vi.fn(async ({ entryId }: { entryId: string }) => {
          const selected = references.get(entryId);
          return selected ? [selected] : [];
        }),
        readVisibleReferenceOwner: vi.fn(async (locator: { modelUid?: string }) =>
          locator.modelUid ? owner(locator.modelUid, locator.modelUid) : null,
        ),
      } as unknown as ReferenceService;
      const registry = new ReferenceOwnerAuthoringContextResolverRegistry();
      registry.register({
        ownerKinds: ['flowModel.step'],
        describe: ({ reference: selected, owner: selectedOwner }) => ({
          ownerKind: 'flowModel.step',
          modelUid: String(selectedOwner.uid),
          modelUse: String(selectedOwner.use),
          surface: 'js-model.render',
          dataSourceKey: 'main',
          collectionName: String(selected.ownerLocator.modelUid),
        }),
      });
      const service = new LightExtensionContextPackService(app.db, referenceService, registry, {
        getCollection: (_dataSourceKey, collectionName) =>
          collection(collectionName, [
            field('id', { type: 'bigInt' }),
            field(`${collectionName}Value`, { type: 'string' }),
          ]),
        getPermission: async (_dataSourceKey, collectionName, action, ctx) => {
          const roles = Array.isArray(ctx.state?.currentRoles) ? ctx.state.currentRoles : [];
          return action === 'list' && roles.includes(collectionName === 'orders' ? roleOrders : roleCustomers);
        },
      });
      const ordersContext = {
        actorUserId: String(userOrders.get('id')),
        currentUser: userOrders,
        state: { currentRoles: [roleOrders] },
      };
      const customersContext = {
        actorUserId: String(userCustomers.get('id')),
        currentUser: userCustomers,
        state: { currentRoles: [roleCustomers] },
      };
      const [ordersPack, customersPack, deniedOrders, deniedCustomers] = await Promise.all([
        service.getContextPack(
          { repoId, entryId: String(entryOrders.get('id')), referenceId: 'ref_orders' },
          ordersContext,
        ),
        service.getContextPack(
          { repoId, entryId: String(entryCustomers.get('id')), referenceId: 'ref_customers' },
          customersContext,
        ),
        service.getContextPack(
          { repoId, entryId: String(entryOrders.get('id')), referenceId: 'ref_orders' },
          customersContext,
        ),
        service.getContextPack(
          { repoId, entryId: String(entryCustomers.get('id')), referenceId: 'ref_customers' },
          ordersContext,
        ),
      ]);

      expect(ordersPack).toMatchObject({ contextMode: 'precise', collection: { name: 'orders' } });
      expect(customersPack).toMatchObject({ contextMode: 'precise', collection: { name: 'customers' } });
      expect(ordersPack.contextHash).not.toBe(customersPack.contextHash);
      expect(JSON.stringify(ordersPack)).not.toContain('customersValue');
      expect(JSON.stringify(customersPack)).not.toContain('ordersValue');
      expect(deniedOrders).toMatchObject({ contextMode: 'generic', reason: 'collection_read_denied' });
      expect(deniedCustomers).toMatchObject({ contextMode: 'generic', reason: 'collection_read_denied' });
    } finally {
      await app?.destroy();
    }
  });
});

function createService(
  options: {
    references?: LightExtensionReferenceRecord[];
    owners?: Record<string, Record<string, unknown>>;
    entryKind?: string;
    getPermission?: (
      dataSourceKey: string,
      collectionName: string,
      action: 'list' | 'update',
      ctx: ContextServiceContext,
    ) => unknown | Promise<unknown>;
    settingsSchema?: Record<string, unknown> | null;
    collectionFields?: ReturnType<typeof field>[];
  } = {},
) {
  const repoModel = model({ id: 'repo_sales' });
  const entryModel = model({
    id: 'entry_dashboard',
    repoId: 'repo_sales',
    kind: options.entryKind || 'js-block',
    entryName: 'dashboard',
    entryPath: 'src/client/js-blocks/dashboard/index.tsx',
    descriptorPath: 'src/client/js-blocks/dashboard/entry.json',
    settingsSchema:
      options.settingsSchema === undefined
        ? { type: 'object', properties: { title: { type: 'string' } } }
        : options.settingsSchema,
    healthStatus: 'ready',
  });
  const db = {
    getRepository: (name: string) => {
      if (name === 'lightExtensionRepos') {
        return { findOne: vi.fn().mockResolvedValue(repoModel) };
      }
      if (name === 'lightExtensionEntries') {
        return { findOne: vi.fn().mockResolvedValue(entryModel) };
      }
      throw new Error(`Unexpected repository ${name}`);
    },
  } as unknown as Database;
  const references = options.references || [];
  const readVisibleReferenceOwner = vi.fn(async (ownerLocator: { modelUid?: string }) =>
    ownerLocator.modelUid ? options.owners?.[ownerLocator.modelUid] || null : null,
  );
  const referenceService = {
    readReferences: vi.fn().mockResolvedValue(references),
    readVisibleReferenceOwner,
  } as unknown as ReferenceService;
  const registry = new ReferenceOwnerAuthoringContextResolverRegistry();
  registry.register({
    ownerKinds: ['flowModel.step'],
    describe: ({ reference: selected, owner: selectedOwner }) => ({
      ownerKind: 'flowModel.step',
      modelUid: String(selectedOwner.uid),
      modelUse: String(selectedOwner.use),
      surface: 'js-model.render',
      dataSourceKey: String(
        (selectedOwner.stepParams as { resourceSettings?: { init?: { dataSourceKey?: string } } })?.resourceSettings
          ?.init?.dataSourceKey || 'main',
      ),
      collectionName: String(
        (selectedOwner.stepParams as { resourceSettings?: { init?: { collectionName?: string } } })?.resourceSettings
          ?.init?.collectionName || selected.ownerLocator.modelUid,
      ),
    }),
  });
  const collections = {
    orders: collection(
      'orders',
      options.collectionFields || [
        field('id', { type: 'bigInt', allowNull: false }),
        field('title', { interface: 'input', type: 'string' }),
        field('status', {
          interface: 'select',
          type: 'string',
          enum: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        }),
        field('secret', { interface: 'password', type: 'string', defaultValue: 'secret-default' }),
        field('customer', { type: 'belongsTo', target: 'customers' }),
      ],
    ),
    customers: collection('customers', [field('id', { type: 'bigInt' }), field('name', { type: 'string' })]),
  };
  const service = new LightExtensionContextPackService(db, referenceService, registry, {
    getCollection: (_dataSourceKey, collectionName) => collections[collectionName as keyof typeof collections],
    ...(options.getPermission ? { getPermission: options.getPermission } : {}),
  });
  return { service, readVisibleReferenceOwner };
}

function reference(id: string, modelUid: string): LightExtensionReferenceRecord {
  const ownerLocator = {
    kind: 'flowModel.step' as const,
    modelUid,
    use: 'JSBlockModel' as const,
    stepPath: ['stepParams', 'jsSettings'] as ['stepParams', 'jsSettings'],
  };
  return {
    id,
    repoId: 'repo_sales',
    entryId: 'entry_dashboard',
    kind: 'js-block',
    ownerKind: 'flowModel.step',
    ownerLocator,
    ownerLocatorHash: hashReferenceOwnerLocator(ownerLocator),
    settingsHash: 'settings-hash',
    resolvedStatus: 'active',
  };
}

function owner(uid: string, collectionName: string, dataSourceKey = 'main'): Record<string, unknown> {
  return {
    uid,
    use: 'JSBlockModel',
    stepParams: { resourceSettings: { init: { dataSourceKey, collectionName } } },
  };
}

function collection(name: string, fields: ReturnType<typeof field>[]) {
  return {
    name,
    options: { name, title: name.toUpperCase() },
    getFields: () => fields,
  };
}

function field(name: string, options: Record<string, unknown>) {
  return { name, options: { name, ...options } };
}

async function createContextEntry(app: MockServer, repoId: string, entryName: string) {
  return app.db.getRepository('lightExtensionEntries').create({
    values: {
      repoId,
      kind: 'js-block',
      entryName,
      entryPath: `src/client/js-blocks/${entryName}/index.tsx`,
      descriptorPath: `src/client/js-blocks/${entryName}/entry.json`,
      settingsSchema: { type: 'object' },
    },
  });
}

function integrationReference(repoId: string, entryId: string, name: string): LightExtensionReferenceRecord {
  const selected = reference(`ref_${name}`, name);
  return { ...selected, repoId, entryId };
}

function model(values: Record<string, unknown>): Model {
  return {
    get: (key: string) => values[key],
  } as unknown as Model;
}
