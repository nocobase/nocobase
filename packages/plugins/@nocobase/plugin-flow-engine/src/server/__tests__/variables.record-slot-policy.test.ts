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

const resolveFieldKind: ResolveFlowModelFieldKind = (_dataSourceKey, collectionName, fieldPath) => {
  if (collectionName === 'users') {
    return ['roles', 'roles.users'].includes(fieldPath) ? 'association' : 'field';
  }
  return ['customer', 'owner'].includes(fieldPath) ? 'association' : 'field';
};

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

  it('compiles fixed direct, view, and popup parent slots per canonical path', () => {
    const model = {
      use: 'FlowModel',
      uid: 'fixed-slots',
      props: [
        '{{ ctx.record.name }}',
        '{{ ctx.responseRecord.id }}',
        '{{ ctx.clickedRowRecord.title }}',
        '{{ ctx.view.record.department.name }}',
        '{{ ctx.popup.parent.parent.sourceRecord.name }}',
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
  });

  it('proves item associations from the persisted owner and server collection metadata', () => {
    const model = {
      uid: 'roles-wrapper',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
        },
      },
      subModels: {
        field: {
          uid: 'roles-popup-sub-table',
          use: 'PopupSubTableFieldModel',
          parentId: 'roles-wrapper',
          subModels: {
            popup: {
              uid: 'roles-popup-grid',
              use: 'BlockGridModel',
              parentId: 'roles-popup-sub-table',
              subModels: {
                blocks: [
                  {
                    uid: 'roles-popup-form',
                    use: 'PopupSubTableFormModel',
                    parentId: 'roles-popup-grid',
                    props: [
                      '{{ ctx.item.value.users.nickname }}',
                      '{{ ctx.item.parentItem.value.roles.title }}',
                      '{{ ctx.item.value.title.name }}',
                      '{{ ctx.item.value.strategy.actions }}',
                      '{{ ctx.item.value.users }}',
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    };

    expect(getPolicy(model, '{{ ctx.item.value.users.nickname }}')).toMatchObject({
      slot: ['value', 'users'],
      source: 'item-association',
    });
    expect(getPolicy(model, '{{ ctx.item.parentItem.value.roles.title }}')?.slot).toEqual([
      'parentItem',
      'value',
      'roles',
    ]);
    expect(getPolicy(model, '{{ ctx.item.value.title.name }}')).toBeUndefined();
    expect(getPolicy(model, '{{ ctx.item.value.strategy.actions }}')).toBeUndefined();
    expect(getPolicy(model, '{{ ctx.item.value.users }}')).toBeUndefined();
  });

  it('counts only persisted item context boundaries, not association field owners', () => {
    const directField = {
      uid: 'direct-popup-field',
      use: 'PopupSubTableFieldModel',
      stepParams: {
        fieldSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
        },
      },
      props: '{{ ctx.item.value.users.nickname }}',
    };
    const subTable = {
      uid: 'sub-table-wrapper',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
        },
      },
      subModels: {
        field: {
          uid: 'sub-table-field',
          use: 'SubTableFieldModel',
          subModels: {
            columns: [
              {
                uid: 'sub-table-column',
                use: 'SubTableColumnModel',
                props: '{{ ctx.item.value.users.nickname }}',
              },
            ],
          },
        },
      },
    };
    expect(getPolicy(directField, '{{ ctx.item.value.users.nickname }}')).toBeUndefined();
    expect(getPolicy(subTable, '{{ ctx.item.value.users.nickname }}')?.slot).toEqual(['value', 'users']);
  });

  it.each(['RecordPickerFieldModel', 'PopupSubTableFieldModel', 'SubTableFieldModel', 'SubFormListFieldModel'])(
    'counts the disabled picker popup item context for %s',
    (use) => {
      const wrapperUid = `${use}-wrapper`;
      const fieldUid = `${use}-field`;
      const model = {
        uid: wrapperUid,
        use: 'FormItemModel',
        stepParams: {
          fieldSettings: {
            init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
          },
        },
        subModels: {
          field: {
            uid: fieldUid,
            use,
            parentId: wrapperUid,
            subModels: {
              'grid-block': {
                uid: `${use}-picker-grid`,
                use: 'BlockGridModel',
                parentId: fieldUid,
                subKey: 'grid-block',
                props: [
                  '{{ ctx.item.value.users.nickname }}',
                  '{{ ctx.item.parentItem.value.users.nickname }}',
                  '{{ ctx.item.parentItem.value.roles.title }}',
                  '{{ ctx.item.parentItem.parentItem.value.roles.title }}',
                ],
              },
            },
          },
        },
      };

      expect(getPolicy(model, '{{ ctx.item.value.users.nickname }}')).toBeUndefined();
      if (use === 'SubFormListFieldModel') {
        expect(getPolicy(model, '{{ ctx.item.parentItem.value.users.nickname }}')?.slot).toEqual([
          'parentItem',
          'value',
          'users',
        ]);
        expect(getPolicy(model, '{{ ctx.item.parentItem.parentItem.value.roles.title }}')?.slot).toEqual([
          'parentItem',
          'parentItem',
          'value',
          'roles',
        ]);
      } else {
        expect(getPolicy(model, '{{ ctx.item.parentItem.value.roles.title }}')?.slot).toEqual([
          'parentItem',
          'value',
          'roles',
        ]);
        expect(getPolicy(model, '{{ ctx.item.parentItem.parentItem.value.roles.title }}')).toBeUndefined();
      }
    },
  );

  it('rejects parent and root slots across a scalar picker owner', () => {
    const model = {
      uid: 'outer-wrapper',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
        },
      },
      subModels: {
        field: {
          uid: 'outer-sub-form',
          use: 'SubFormFieldModel',
          parentId: 'outer-wrapper',
          subModels: {
            item: {
              uid: 'scalar-wrapper',
              use: 'FormItemModel',
              stepParams: {
                fieldSettings: {
                  init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'status' },
                },
              },
              subModels: {
                field: {
                  uid: 'scalar-picker',
                  use: 'RecordPickerFieldModel',
                  parentId: 'scalar-wrapper',
                  subModels: {
                    'grid-block': {
                      uid: 'scalar-picker-grid',
                      use: 'BlockGridModel',
                      parentId: 'scalar-picker',
                      subKey: 'grid-block',
                      props: [
                        '{{ ctx.item.value.users.nickname }}',
                        '{{ ctx.item.parentItem.value.users.nickname }}',
                        '{{ ctx.item.parentItem.parentItem.value.roles.title }}',
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    expect(getPolicy(model, '{{ ctx.item.value.users.nickname }}')).toBeUndefined();
    expect(getPolicy(model, '{{ ctx.item.parentItem.value.users.nickname }}')).toBeUndefined();
    expect(getPolicy(model, '{{ ctx.item.parentItem.parentItem.value.roles.title }}')).toBeUndefined();
  });

  it('ignores config objects that imitate FlowModel item hosts outside subModels', () => {
    const model = {
      uid: 'config-host-imitation',
      use: 'FlowModel',
      stepParams: {
        arbitraryConfig: {
          use: 'SubFormFieldModel',
          stepParams: {
            fieldSettings: {
              init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
            },
          },
          props: '{{ ctx.item.value.users.nickname }}',
        },
      },
    };

    expect(getPolicy(model, '{{ ctx.item.value.users.nickname }}')).toBeUndefined();
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

  it('does not invent an unconfigured record anchor for CreateForm', () => {
    const model = formModel('CreateFormModel', '{{ ctx.formValues.status }}');

    expect(getPolicy(model, '{{ ctx.formValues.status }}')).toBeUndefined();
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

  it('loads a persisted item owner from the ancestor chain', async () => {
    const session = createTokenSession();
    const child = {
      uid: 'item-action',
      use: 'FormActionModel',
      parentId: 'roles-popup-form',
      props: { value: '{{ ctx.item.value.users.nickname }}' },
    };
    const popupForm = {
      uid: 'roles-popup-form',
      use: 'PopupSubTableFormModel',
      parentId: 'roles-popup-grid',
    };
    const popupGrid = {
      uid: 'roles-popup-grid',
      use: 'BlockGridModel',
      parentId: 'roles-field',
    };
    const owner = {
      uid: 'roles-field',
      use: 'PopupSubTableFieldModel',
      parentId: 'roles-wrapper',
    };
    const wrapper = {
      uid: 'roles-wrapper',
      use: 'FormItemModel',
      stepParams: {
        fieldSettings: {
          init: { dataSourceKey: 'main', collectionName: 'users', fieldPath: 'roles' },
        },
      },
      subModels: { field: { uid: owner.uid, use: owner.use } },
    };
    const models: Record<string, unknown> = {
      [child.uid]: child,
      [popupForm.uid]: popupForm,
      [popupGrid.uid]: popupGrid,
      [owner.uid]: owner,
      [wrapper.uid]: wrapper,
    };
    const findModelById = vi.fn(async (uid: string) => models[uid]);
    const ctx = createFakeCtx({ findModelById, token: session.token });

    const result = await authorizeVariablesResolve(ctx, {
      rd: session.rd(child.uid),
      template: '{{ ctx.item.value.users.nickname }}',
      contextParams: { 'item.value.users': { collection: 'users', filterByTk: 1 } },
    });

    expect(result.allowed).toBe(true);
    expect(result.recordSlotPolicies.get(getFirstCanonicalKey(result))?.slot).toEqual(['value', 'users']);
    expect(findModelById.mock.calls.map(([uid]) => uid)).toEqual([
      'item-action',
      'roles-popup-form',
      'roles-popup-grid',
      'roles-field',
      'roles-wrapper',
    ]);
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
  type TestCollection = {
    fields: { get: (name: string) => TestField | undefined };
    getField: (name: string) => TestField | undefined;
  };
  type TestField = {
    isRelationField: () => boolean;
    targetCollection?: TestCollection;
  };
  const fields: Record<string, TestField> = {
    customer: { isRelationField: () => true },
    status: { isRelationField: () => false },
  };
  const collection = {
    fields: { get: (name: string) => fields[name] },
    getField: (name: string) => fields[name],
  };
  const userFields: Record<string, TestField> = {};
  const roleFields: Record<string, TestField> = {
    title: { isRelationField: () => false },
    strategy: { isRelationField: () => false },
  };
  const usersCollection: TestCollection = {
    fields: { get: (name) => userFields[name] },
    getField: (name) => userFields[name],
  };
  const rolesCollection: TestCollection = {
    fields: { get: (name) => roleFields[name] },
    getField: (name) => roleFields[name],
  };
  userFields.roles = { isRelationField: () => true, targetCollection: rolesCollection };
  roleFields.users = { isRelationField: () => true, targetCollection: usersCollection };
  const collections: Record<string, TestCollection> = { users: usersCollection, roles: rolesCollection };
  return {
    app: {
      acl: { getRole: () => ({ getStrategy: () => ({ allowConfigure: false }) }) },
      dataSourceManager: {
        get: () => ({ collectionManager: { getCollection: () => collection } }),
      },
    },
    db: {
      getCollection: (name: string) =>
        name === 'flowModels'
          ? { repository: { findModelById: options.findModelById || (async () => null) } }
          : collections[name] || collection,
      getRepository: () => ({ find: async () => [] }),
    },
    get: (name: string) => headers[name.toLowerCase() as keyof typeof headers],
    state: {
      currentRole: options.currentRole || 'member',
      currentRoles: [options.currentRole || 'member'],
    },
  } as unknown as ResourcerContext;
}
