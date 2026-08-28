/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import { describe, expect, it } from 'vitest';
import PluginFlowEngineServer from '../plugin';
import { analyzeVariableTemplate } from '../template/variable-expression';
import { createFormItemRecordSlotResolvers } from '../variables/form-item-record-slot-resolvers';
import {
  createBuiltInRecordSlotResolvers,
  createFlowModelVariableContract,
  type CompileRecordSlotPoliciesOptions,
  type RecordSlotPolicies,
} from '../variables/record-slot-policy';
import {
  createNestedRecordSlotResolver,
  getRecordSlotResolverRegistry,
  type RecordSlotResolverRegistration,
} from '../variables/record-slot-resolvers';

function createApp(): Application {
  return {} as Application;
}

function installBuiltIns(app: Application) {
  const registry = getRecordSlotResolverRegistry(app);
  const disposers = [...createBuiltInRecordSlotResolvers(), ...createFormItemRecordSlotResolvers()].map((resolver) =>
    registry.register(resolver),
  );
  return () => disposers.forEach((dispose) => dispose());
}

async function compile(
  app: Application,
  flowModel: unknown,
  options: Omit<CompileRecordSlotPoliciesOptions, 'app'> = {},
) {
  const analysis = analyzeVariableTemplate(flowModel, { mode: 'flow-model' });
  return await createFlowModelVariableContract(analysis, { app, currentNode: flowModel, ...options });
}

function getPolicy(policies: RecordSlotPolicies, expression: string) {
  const key = analyzeVariableTemplate(expression).paths[0]?.canonicalKey;
  return key ? policies.get(key) : undefined;
}

describe('record slot policy compiler', () => {
  it('compiles exact direct, view, and popup slots without resource metadata', async () => {
    const app = createApp();
    const dispose = installBuiltIns(app);
    const contract = await compile(app, {
      props: [
        '{{ ctx.record.name }}',
        '{{ ctx.responseRecord.id }}',
        '{{ ctx.clickedRowRecord.title }}',
        '{{ ctx.view.record.department.name }}',
        '{{ ctx.popup.parent.record.title }}',
        '{{ ctx.popup.parent.parent.sourceRecord.name }}',
      ],
    });

    expect(getPolicy(contract.recordSlots, '{{ ctx.record.name }}')?.slot).toEqual([]);
    expect(getPolicy(contract.recordSlots, '{{ ctx.responseRecord.id }}')?.slot).toEqual([]);
    expect(getPolicy(contract.recordSlots, '{{ ctx.clickedRowRecord.title }}')?.slot).toEqual([]);
    expect(getPolicy(contract.recordSlots, '{{ ctx.view.record.department.name }}')?.slot).toEqual(['record']);
    expect(getPolicy(contract.recordSlots, '{{ ctx.popup.parent.record.title }}')?.slot).toEqual(['parent', 'record']);
    expect(getPolicy(contract.recordSlots, '{{ ctx.popup.parent.parent.sourceRecord.name }}')?.slot).toEqual([
      'parent',
      'parent',
      'sourceRecord',
    ]);
    dispose();
  });

  it('keeps built-in policies limited to the exact slot', async () => {
    const app = createApp();
    installBuiltIns(app);
    const contract = await compile(app, '{{ ctx.view.record.name }}');
    const policy = getPolicy(contract.recordSlots, '{{ ctx.view.record.name }}');

    expect(policy).toEqual({ status: 'resolved', slot: ['record'] });
  });

  it('derives Form slots from the target of a persisted association resource', async () => {
    const app = createApp();
    installBuiltIns(app);
    const permissions = { name: 'permissions' };
    const roles = {
      name: 'roles',
      getField: (name: string) => {
        if (name === 'title') return {};
        return name === 'permissions'
          ? { isRelationField: () => true, targetCollection: () => permissions }
          : undefined;
      },
    };
    const users = {
      getField: (name: string) =>
        name === 'roles' ? { isRelationField: () => true, targetCollection: () => roles } : undefined,
    };
    const contract = await compile(
      app,
      {
        use: 'CustomPersistedForm',
        stepParams: {
          resourceSettings: {
            init: { associationName: 'users.roles', collectionName: 'users', dataSourceKey: 'main' },
          },
        },
        subModels: {
          grid: {
            subModels: {
              items: [{ stepParams: { fieldSettings: { init: { fieldPath: 'permissions' } } } }],
            },
          },
        },
        props: ['{{ ctx.formValues.title }}', '{{ ctx.formValues.permissions.name }}'],
      },
      {
        getCollection: (_dataSourceKey, collection) => {
          if (collection === 'users') return users;
          if (collection === 'roles') return roles;
          return permissions;
        },
      },
    );

    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.title }}')?.slot).toEqual([]);
    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.permissions.name }}')?.slot).toEqual(['permissions']);
  });

  it('derives item and parent item slots from association field provenance', async () => {
    const app = createApp();
    installBuiltIns(app);
    const permissions = { name: 'permissions' };
    const roles = {
      name: 'roles',
      getField: (name: string) =>
        name === 'permissions'
          ? { isAssociationField: () => true, targetCollection: permissions }
          : name === 'title'
            ? {}
            : undefined,
    };
    const users = {
      name: 'users',
      getField: (name: string) =>
        name === 'roles' ? { isAssociationField: () => true, targetCollection: roles } : undefined,
    };
    const currentNode = {
      use: 'CustomAssociationField',
      stepParams: {
        fieldSettings: { init: { collectionName: 'users', dataSourceKey: 'main', fieldPath: 'roles' } },
      },
      props: [
        '{{ ctx.item.value.permissions }}',
        '{{ ctx.item.value.permissions.name }}',
        '{{ ctx.item.parentItem.value.roles.title }}',
        '{{ ctx.item.value.title }}',
      ],
    };
    const contract = await compile(app, currentNode, {
      getCollection: (_dataSourceKey, collection) => {
        if (collection === 'users') return users;
        if (collection === 'roles') return roles;
        return permissions;
      },
      loadAncestors: async () => [],
    });

    expect(getPolicy(contract.recordSlots, '{{ ctx.item.value.permissions.name }}')?.slot).toEqual([
      'value',
      'permissions',
    ]);
    expect(getPolicy(contract.recordSlots, '{{ ctx.item.value.permissions }}')?.slot).toEqual(['value', 'permissions']);
    expect(getPolicy(contract.recordSlots, '{{ ctx.item.parentItem.value.roles.title }}')?.slot).toEqual([
      'parentItem',
      'value',
      'roles',
    ]);
    expect(getPolicy(contract.recordSlots, '{{ ctx.item.value.title }}')).toBeUndefined();
  });

  it('keeps configured scalars and JSON values out of Form Record slots', async () => {
    const app = createApp();
    installBuiltIns(app);
    const collection = {
      getField: (name: string) => {
        if (name === 'status') return { type: 'string' };
        if (name === 'payload') return { type: 'json' };
        if (name === 'unconfigured') return { type: 'string' };
        return undefined;
      },
    };
    const contract = await compile(
      app,
      {
        use: 'CustomForm',
        stepParams: { resourceSettings: { init: { collectionName: 'orders', dataSourceKey: 'main' } } },
        subModels: {
          grid: {
            use: 'CustomGrid',
            subModels: {
              items: [
                {
                  use: 'CustomField',
                  stepParams: {
                    fieldSettings: { init: { collectionName: 'orders', dataSourceKey: 'main', fieldPath: 'status' } },
                  },
                },
              ],
            },
          },
        },
        props: [
          '{{ ctx.formValues.status }}',
          '{{ ctx.formValues.payload.value }}',
          '{{ ctx.formValues.unconfigured }}',
        ],
      },
      { getCollection: () => collection },
    );

    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.status }}')).toBeUndefined();
    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.payload.value }}')).toBeUndefined();
    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.unconfigured }}')?.slot).toEqual([]);
  });

  it('fails closed when an item parent collection has ambiguous provenance', async () => {
    const app = createApp();
    installBuiltIns(app);
    const targets: Record<string, string> = { lines: 'lines', owner: 'people', tasks: 'tasks' };
    const collections: Record<string, { name: string; getField: (fieldName: string) => unknown }> = {};
    for (const name of ['lines', 'people', 'projects', 'tasks', 'users']) {
      collections[name] = {
        name,
        getField: (fieldName) => {
          const target = targets[fieldName];
          return target ? { isAssociationField: () => true, targetCollection: collections[target] } : undefined;
        },
      };
    }
    const current = {
      subKey: 'grid',
      stepParams: { fieldSettings: { init: { collectionName: 'tasks', fieldPath: 'lines' } } },
      props: '{{ ctx.item.value.owner.name }}',
    };
    const contract = await compile(app, current, {
      getCollection: (_dataSourceKey, name) => collections[name],
      loadAncestors: async () => [
        {
          stepParams: { fieldSettings: { init: { collectionName: 'users', fieldPath: 'tasks' } } },
          subKey: 'grid',
        },
        {
          stepParams: { fieldSettings: { init: { collectionName: 'projects', fieldPath: 'tasks' } } },
          subKey: 'grid',
        },
      ],
    });

    expect(getPolicy(contract.recordSlots, '{{ ctx.item.value.owner.name }}')).toBeUndefined();
  });

  it('does not compile fixed slots when the plugin registrations are absent or disposed', async () => {
    const app = createApp();
    const model = {
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      props: '{{ ctx.record.name }}',
    };
    const options = { getCollection: () => ({}) };
    expect((await compile(app, model, options)).recordSlots.size).toBe(0);

    const dispose = installBuiltIns(app);
    expect((await compile(app, model, options)).recordSlots.size).toBe(1);
    dispose();
    expect((await compile(app, model, options)).recordSlots.size).toBe(0);

    const disposeReloaded = installBuiltIns(app);
    expect((await compile(app, model, options)).recordSlots.size).toBe(1);
    disposeReloaded();
  });

  it('disposes Form and item registrations across the plugin lifecycle', async () => {
    const app = createApp();
    const plugin = Object.create(PluginFlowEngineServer.prototype) as PluginFlowEngineServer;
    Object.defineProperties(plugin, {
      app: { value: app },
      recordSlotResolverDisposers: { configurable: true, value: [], writable: true },
    });
    const lifecycle = plugin as unknown as { registerRecordSlotResolvers: () => void };
    const registry = getRecordSlotResolverRegistry(app);

    lifecycle.registerRecordSlotResolvers();
    expect(registry.has('@nocobase/plugin-flow-engine', 'form:values')).toBe(true);
    expect(registry.has('@nocobase/plugin-flow-engine', 'form:item')).toBe(true);

    await plugin.afterDisable();
    expect(registry.has('@nocobase/plugin-flow-engine', 'form:values')).toBe(false);
    await plugin.afterEnable();
    expect(registry.has('@nocobase/plugin-flow-engine', 'form:item')).toBe(true);
    await plugin.remove();
    expect(registry.has('@nocobase/plugin-flow-engine', 'form:item')).toBe(false);
  });

  it('materializes nested Record only for a server-registered variable', async () => {
    const app = createApp();
    getRecordSlotResolverRegistry(app).register(
      createNestedRecordSlotResolver({
        owner: 'test-extension',
        id: 'backend',
        varName: 'backend',
      }),
    );
    const contract = await compile(app, {
      props: ['{{ ctx.backend.record.customer.name }}', '{{ ctx.unknown.record.customer.name }}'],
    });

    expect(getPolicy(contract.recordSlots, '{{ ctx.backend.record.customer.name }}')?.slot).toEqual(['record']);
    expect(getPolicy(contract.recordSlots, '{{ ctx.unknown.record.customer.name }}')).toBeUndefined();
  });

  it('fails closed for Form and item model names without an owning resolver', async () => {
    const app = createApp();
    installBuiltIns(app);
    for (const use of ['EditFormModel', 'CreateFormModel', 'FilterFormBlockModel', 'SubFormFieldModel']) {
      const contract = await compile(app, {
        use,
        stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
        props: [
          '{{ ctx.formValues.customer.name }}',
          '{{ ctx.formValues.status }}',
          '{{ ctx.item.value.owner.name }}',
          '{{ ctx.item.parentItem.value.users.name }}',
        ],
        subModels: {
          grid: {
            use: 'FormGridModel',
            subModels: {
              items: [
                { use: 'FilterFormItemModel', stepParams: { fieldSettings: { init: { fieldPath: 'customer' } } } },
                { use: 'SubFormListFieldModel', stepParams: { fieldSettings: { init: { fieldPath: 'owner' } } } },
              ],
            },
          },
        },
      });

      for (const expression of [
        '{{ ctx.formValues.customer.name }}',
        '{{ ctx.formValues.status }}',
        '{{ ctx.item.value.owner.name }}',
        '{{ ctx.item.parentItem.value.users.name }}',
      ]) {
        expect(getPolicy(contract.recordSlots, expression)).toBeUndefined();
      }
    }
  });

  it('allows a custom provider without adding its use name to core', async () => {
    const app = createApp();
    installBuiltIns(app);
    const node = {
      use: 'MyPrivateProvider',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      props: ['{{ ctx.formValues.customer.name }}', '{{ ctx.record.name }}'],
    };
    const customResolver: RecordSlotResolverRegistration = {
      owner: 'test-extension',
      id: 'private-form-provider',
      match: (path) => path.varName === 'formValues' && path.runtimeSegments[0] === 'customer',
      resolve: ({ currentNode }) =>
        currentNode === node ? { status: 'resolved', slot: ['customer'] } : { status: 'abstain' },
    };
    const dispose = getRecordSlotResolverRegistry(app).register(customResolver);

    const enabled = await compile(app, node, { getCollection: () => ({}) });
    expect(getPolicy(enabled.recordSlots, '{{ ctx.formValues.customer.name }}')?.slot).toEqual(['customer']);
    expect(getPolicy(enabled.recordSlots, '{{ ctx.record.name }}')?.slot).toEqual([]);

    dispose();
    const disabled = await compile(app, node, { getCollection: () => ({}) });
    expect(getPolicy(disabled.recordSlots, '{{ ctx.formValues.customer.name }}')).toBeUndefined();
    expect(getPolicy(disabled.recordSlots, '{{ ctx.record.name }}')?.slot).toEqual([]);
  });

  it('keeps valid siblings when metadata is missing or a resolver throws', async () => {
    const app = createApp();
    installBuiltIns(app);
    const registry = getRecordSlotResolverRegistry(app);
    registry.register({
      owner: 'test-extension',
      id: 'metadata-dependent-form',
      match: (path) => path.varName === 'formValues',
      resolve: ({ getCollection }) =>
        getCollection?.('main', 'orders') ? { status: 'resolved', slot: ['customer'] } : { status: 'abstain' },
    });
    registry.register({
      owner: 'test-extension',
      id: 'broken-item-provider',
      match: (path) => path.varName === 'item',
      resolve: () => {
        throw new Error('metadata unavailable');
      },
    });
    const contract = await compile(app, {
      props: ['{{ ctx.formValues.customer.name }}', '{{ ctx.item.value.owner.name }}', '{{ ctx.view.record.name }}'],
    });

    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.customer.name }}')).toBeUndefined();
    expect(getPolicy(contract.recordSlots, '{{ ctx.item.value.owner.name }}')).toBeUndefined();
    expect(getPolicy(contract.recordSlots, '{{ ctx.view.record.name }}')?.slot).toEqual(['record']);
  });
});
