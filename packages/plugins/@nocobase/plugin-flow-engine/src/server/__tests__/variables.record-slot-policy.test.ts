/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';
import type { ResourcerContext } from '@nocobase/resourcer';
import { describe, expect, it } from 'vitest';
import { analyzeVariableTemplate } from '../template/variable-expression';
import {
  createBuiltInRecordSlotResolvers,
  createFlowModelVariableContract,
  type CompileRecordSlotPoliciesOptions,
  type RecordSlotPolicies,
} from '../variables/record-slot-policy';
import {
  createNestedRecordSlotResolver,
  getRecordSlotResolverRegistry,
  normalizeRecordSlotTarget,
  type RecordSlotResolverRegistration,
} from '../variables/record-slot-resolvers';

const ordersTarget = { kind: 'fixed', dataSourceKey: 'main', collection: 'orders' } as const;

function createApp(): Application {
  return {} as Application;
}

function installBuiltIns(app: Application) {
  const registry = getRecordSlotResolverRegistry(app);
  const disposers = createBuiltInRecordSlotResolvers().map((resolver) => registry.register(resolver));
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
  it('compiles exact direct, view, and popup slots from registered built-ins', async () => {
    const app = createApp();
    const dispose = installBuiltIns(app);
    const contract = await compile(
      app,
      {
        stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
        props: [
          '{{ ctx.record.name }}',
          '{{ ctx.responseRecord.id }}',
          '{{ ctx.clickedRowRecord.title }}',
          '{{ ctx.view.record.department.name }}',
          '{{ ctx.popup.parent.record.title }}',
          '{{ ctx.popup.parent.parent.sourceRecord.name }}',
        ],
      },
      { getCollection: () => ({}) },
    );

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

  it('keeps built-in slots but refuses a client-selected database target', async () => {
    const app = createApp();
    installBuiltIns(app);
    const contract = await compile(app, '{{ ctx.view.record.name }}');
    const policy = getPolicy(contract.recordSlots, '{{ ctx.view.record.name }}');
    if (!policy) throw new Error('Expected a built-in view Record policy');

    expect(
      await normalizeRecordSlotTarget(policy.target, {} as ResourcerContext, {
        collection: 'secrets',
        dataSourceKey: 'external',
        filterByTk: 1,
      }),
    ).toBeUndefined();
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
        use: 'EditFormModel',
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

    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.title }}')?.target).toEqual({
      kind: 'fixed',
      collection: 'roles',
      dataSourceKey: 'main',
    });
    expect(getPolicy(contract.recordSlots, '{{ ctx.formValues.permissions.name }}')?.target).toEqual({
      kind: 'fixed',
      collection: 'permissions',
      dataSourceKey: 'main',
    });
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

  it('materializes nested Record only for a server-registered variable and target', async () => {
    const app = createApp();
    getRecordSlotResolverRegistry(app).register(
      createNestedRecordSlotResolver({
        owner: 'test-extension',
        id: 'backend',
        varName: 'backend',
        target: ordersTarget,
      }),
    );
    const contract = await compile(app, {
      props: ['{{ ctx.backend.record.customer.name }}', '{{ ctx.unknown.record.customer.name }}'],
    });

    expect(getPolicy(contract.recordSlots, '{{ ctx.backend.record.customer.name }}')).toMatchObject({
      slot: ['record'],
      target: ordersTarget,
    });
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
        currentNode === node ? { status: 'resolved', slot: ['customer'], target: ordersTarget } : { status: 'abstain' },
    };
    const dispose = getRecordSlotResolverRegistry(app).register(customResolver);

    const enabled = await compile(app, node, { getCollection: () => ({}) });
    expect(getPolicy(enabled.recordSlots, '{{ ctx.formValues.customer.name }}')).toMatchObject({
      slot: ['customer'],
      target: ordersTarget,
    });
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
        getCollection?.('main', 'orders')
          ? { status: 'resolved', slot: ['customer'], target: ordersTarget }
          : { status: 'abstain' },
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
