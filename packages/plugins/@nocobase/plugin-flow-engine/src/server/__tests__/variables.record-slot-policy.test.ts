/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ResourcerContext } from '@nocobase/resourcer';
import { generateFlowModelRd } from '@nocobase/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeVariableTemplate } from '../template/variable-expression';
import { authorizeVariablesResolve, type AuthorizationResult } from '../variables/allow-list';
import { compileRecordSlotPolicies, type ResolveFlowModelFieldKind } from '../variables/record-slot-policy';
import { resetVariablesRegistryForTest } from './test-utils';

const resolveFieldKind: ResolveFlowModelFieldKind = (_dataSourceKey, _collectionName, fieldPath) =>
  ['customer', 'owner'].includes(fieldPath) ? 'association' : 'field';

function compile(flowModel: unknown) {
  const analysis = analyzeVariableTemplate(flowModel, { mode: 'flow-model' });
  return { analysis, policies: compileRecordSlotPolicies(analysis, { flowModel, resolveFieldKind }) };
}

function getPolicy(flowModel: unknown, expression: string) {
  const { policies } = compile(flowModel);
  const key = analyzeVariableTemplate(expression).paths[0].canonicalKey;
  return policies.get(key);
}

function getFirstCanonicalKey(result: AuthorizationResult) {
  const key = result.analysis?.paths[0]?.canonicalKey;
  if (!key) throw new Error('Expected analyzed variable path');
  return key;
}

function formModel(use: string, props: unknown, configuredFields: string[] = []) {
  return {
    uid: `${use}-1`,
    use,
    stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
    subModels: {
      grid: {
        uid: `${use}-grid`,
        use: 'FormGridModel',
        subModels: {
          items: configuredFields.map((fieldPath, index) => ({
            uid: `${use}-item-${index}`,
            use: 'FormItemModel',
            stepParams: { fieldSettings: { init: { fieldPath } } },
          })),
        },
      },
    },
    props,
  };
}

describe('record slot policy compiler', () => {
  beforeEach(() => {
    resetVariablesRegistryForTest();
  });

  it('compiles fixed direct, view, popup parent, and item association slots per canonical path', () => {
    const model = {
      use: 'FlowModel',
      uid: 'fixed-slots',
      props: [
        '{{ ctx.record.name }}',
        '{{ ctx.responseRecord.id }}',
        '{{ ctx.clickedRowRecord.title }}',
        '{{ ctx.view.record.department.name }}',
        '{{ ctx.popup.parent.parent.sourceRecord.name }}',
        '{{ ctx.item.parentItem.value.owner.name }}',
        '{{ ctx.item.value.owner }}',
      ],
    };

    expect(getPolicy(model, '{{ ctx.record.name }}')).toMatchObject({ slot: [], source: 'direct-record' });
    expect(getPolicy(model, '{{ ctx.responseRecord.id }}')?.slot).toEqual([]);
    expect(getPolicy(model, '{{ ctx.clickedRowRecord.title }}')?.slot).toEqual([]);
    expect(getPolicy(model, '{{ ctx.view.record.department.name }}')?.slot).toEqual(['record']);
    expect(getPolicy(model, '{{ ctx.popup.parent.parent.sourceRecord.name }}')?.slot).toEqual([
      'parent',
      'parent',
      'sourceRecord',
    ]);
    expect(getPolicy(model, '{{ ctx.item.parentItem.value.owner.name }}')?.slot).toEqual([
      'parentItem',
      'value',
      'owner',
    ]);
    expect(getPolicy(model, '{{ ctx.item.value.owner }}')).toBeUndefined();
  });

  it('separates configured Form associations from unconfigured record anchors', () => {
    const model = formModel(
      'EditFormModel',
      {
        configured: '{{ ctx.formValues.customer.level.name }}',
        unconfigured: '{{ ctx.formValues.status }}',
      },
      ['customer'],
    );

    expect(getPolicy(model, '{{ ctx.formValues.customer.level.name }}')).toMatchObject({
      slot: ['customer'],
      source: 'form-association',
    });
    expect(getPolicy(model, '{{ ctx.formValues.status }}')).toMatchObject({ slot: [], source: 'form-record' });
  });

  it('compiles the complete persisted FilterForm field name', () => {
    const model = {
      uid: 'filter-form',
      use: 'FilterFormBlockModel',
      stepParams: { resourceSettings: { init: { dataSourceKey: 'main', collectionName: 'orders' } } },
      subModels: {
        grid: {
          uid: 'filter-grid',
          use: 'FormGridModel',
          subModels: {
            items: [
              {
                uid: 'owner-filter',
                use: 'FilterFormItemModel',
                props: { name: 'criteria.owner' },
                stepParams: { fieldSettings: { init: { fieldPath: 'owner' } } },
              },
            ],
          },
        },
      },
      props: '{{ ctx.formValues.criteria.owner.name }}',
    };

    expect(getPolicy(model, '{{ ctx.formValues.criteria.owner.name }}')).toMatchObject({
      slot: ['criteria', 'owner'],
      source: 'filter-form',
    });
  });

  it('fails closed when one canonical path has different persisted slots', () => {
    const model = {
      uid: 'ambiguous-page',
      use: 'PageModel',
      subModels: {
        blocks: [
          formModel('EditFormModel', '{{ ctx.formValues.customer.name }}', ['customer']),
          formModel('EditFormModel', '{{ ctx.formValues.customer.name }}'),
        ],
      },
    };

    expect(getPolicy(model, '{{ ctx.formValues.customer.name }}')).toBeUndefined();
  });

  it('gives configure roles fixed slots without RD but no dynamic form slot', async () => {
    const ctx = createFakeCtx({ currentRole: 'root' });
    const view = await authorizeVariablesResolve(ctx, { template: '{{ ctx.view.record.name }}' });
    const form = await authorizeVariablesResolve(ctx, { template: '{{ ctx.formValues.customer.name }}' });
    const item = await authorizeVariablesResolve(ctx, { template: '{{ ctx.item.value.owner.name }}' });

    expect(view.recordSlotPolicies.get(getFirstCanonicalKey(view))?.slot).toEqual(['record']);
    expect(form.recordSlotPolicies.get(getFirstCanonicalKey(form))).toBeUndefined();
    expect(item.recordSlotPolicies.get(getFirstCanonicalKey(item))).toBeUndefined();
  });

  it('loads and caches the persisted ancestor Form contract', async () => {
    const session = createTokenSession();
    const child = {
      uid: 'form-action',
      use: 'FormActionModel',
      parentId: 'form-grid',
      props: { value: '{{ ctx.formValues.customer.name }}' },
    };
    const grid = { uid: 'form-grid', use: 'FormGridModel', parentId: 'edit-form' };
    const form = formModel('EditFormModel', {}, ['customer']);
    form.uid = 'edit-form';
    const models: Record<string, unknown> = { [child.uid]: child, [grid.uid]: grid, [form.uid]: form };
    const findModelById = vi.fn(async (uid: string) => models[uid]);
    const ctx = createFakeCtx({ findModelById, token: session.token });

    const first = await authorizeVariablesResolve(ctx, {
      rd: session.rd(child.uid),
      template: '{{ ctx.formValues.customer.name }}',
    });
    const second = await authorizeVariablesResolve(ctx, {
      rd: session.rd(child.uid),
      template: '{{ ctx.formValues.customer.name }}',
    });

    expect(first.allowed).toBe(true);
    expect(first.recordSlotPolicies.get(getFirstCanonicalKey(first))?.slot).toEqual(['customer']);
    expect(second.recordSlotPolicies.get(getFirstCanonicalKey(second))?.slot).toEqual(['customer']);
    expect(findModelById.mock.calls.map(([uid]) => uid)).toEqual(['form-action', 'form-grid', 'edit-form']);
  });
});

function createTokenSession(userId = 1) {
  const signInTime = `variables-record-slot-policy-${userId}`;
  const payload = Buffer.from(JSON.stringify({ userId, signInTime })).toString('base64url');
  return {
    rd: (flowModelUid: string) => generateFlowModelRd(flowModelUid, `${userId}:${signInTime}`),
    token: `test.${payload}.sig`,
  };
}

function createFakeCtx(
  options: {
    currentRole?: string;
    findModelById?: (uid: string) => Promise<unknown>;
    token?: string;
  } = {},
) {
  const headers = options.token ? { authorization: `Bearer ${options.token}` } : {};
  const fields: Record<string, { isRelationField: () => boolean }> = {
    customer: { isRelationField: () => true },
    status: { isRelationField: () => false },
  };
  const collection = {
    fields: { get: (name: string) => fields[name] },
    getField: (name: string) => fields[name],
  };
  return {
    app: {
      acl: { getRole: () => ({ getStrategy: () => ({ allowConfigure: false }) }) },
      dataSourceManager: {
        get: () => ({ collectionManager: { getCollection: () => collection } }),
      },
    },
    db: {
      getCollection: () => ({ repository: { findModelById: options.findModelById || (async () => null) } }),
      getRepository: () => ({ find: async () => [] }),
    },
    get: (name: string) => headers[name.toLowerCase() as keyof typeof headers],
    state: {
      currentRole: options.currentRole || 'member',
      currentRoles: [options.currentRole || 'member'],
    },
  } as unknown as ResourcerContext;
}
