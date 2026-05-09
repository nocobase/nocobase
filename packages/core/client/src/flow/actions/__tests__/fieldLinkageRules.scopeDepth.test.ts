/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { fieldLinkageRules } from '../linkageRules';

describe('fieldLinkageRules action - linkage scope metadata', () => {
  const targetCollection: any = {
    getField: (name: string) => ({ name, isAssociationField: () => false }),
  };
  const usersField: any = {
    type: 'hasMany',
    isAssociationField: () => true,
    targetCollection,
  };

  it('passes linkageTxId and scope depth to row-scoped setFormValues', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const linkageAssignHandler = vi.fn((actionCtx: any, { addFormValuePatch }: any) => {
      addFormValuePatch({ path: 'users.name', value: '456' });
      expect(actionCtx.linkageScopeDepth).toBe(0);
      expect(actionCtx.inputArgs).toEqual({
        source: 'user',
        txId: 'tx-row-1',
        changedPaths: [['users', 0, 'name']],
      });
    });

    const engine = new FlowEngine();
    const rowFork = new FlowModel({ uid: 'row-fork', flowEngine: engine }) as any;
    rowFork.context.defineProperty('fieldIndex', {
      value: ['users:0'],
    });
    rowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.subModels = { items: [] };
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageAssignField') {
        return {
          handler: linkageAssignHandler,
        };
      }
    });

    const masterModel: any = {
      uid: 'master-grid',
      forks: new Set([rowFork]),
    };

    const modelContext: any = {
      blockModel: {
        collection: {
          getField: (name: string) => (name === 'users' ? usersField : null),
        },
      },
    };

    const gridModel: any = {
      uid: 'grid-model',
      context: modelContext,
      getAction: vi.fn((name: string) => {
        if (name === 'linkageAssignField') {
          return {
            handler: linkageAssignHandler,
          };
        }
      }),
      __allModels: [],
    };

    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          cb(masterModel);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-row-1',
        changedPaths: [['users', 0, 'name']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => v,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          title: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'users.name',
                    mode: 'assign',
                    value: '456',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledTimes(1);
    const [patches, options] = setFormValues.mock.calls[0];
    expect(patches).toEqual([
      {
        path: ['users', 0, 'name'],
        value: '456',
      },
    ]);
    expect(options).toMatchObject({
      source: 'linkage',
      linkageTxId: 'tx-row-1',
      linkageScopeDepth: 0,
    });
  });

  it('keeps valueTitleField when splitting row-scoped assign rules', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const linkageAssignHandler = vi.fn((actionCtx: any, { value, addFormValuePatch }: any) => {
      expect(actionCtx.linkageScopeDepth).toBe(0);
      expect(Array.isArray(value)).toBe(true);
      expect(value[0]).toMatchObject({
        targetPath: 'users.name',
        valueTitleField: 'nickname',
      });
      addFormValuePatch({ path: 'users.name', value: 'from-row-title-field' });
    });

    const engine = new FlowEngine();
    const rowFork = new FlowModel({ uid: 'row-fork-title-field', flowEngine: engine }) as any;
    rowFork.context.defineProperty('fieldIndex', {
      value: ['users:0'],
    });
    rowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.subModels = { items: [] };
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageAssignField') {
        return {
          handler: linkageAssignHandler,
        };
      }
    });

    const masterModel: any = {
      uid: 'master-grid-title-field',
      forks: new Set([rowFork]),
    };

    const gridModel: any = {
      uid: 'grid-model-title-field',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'users' ? usersField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageAssignField') {
          return {
            handler: linkageAssignHandler,
          };
        }
      }),
      __allModels: [],
    };

    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          cb(masterModel);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-row-title-field',
        changedPaths: [['users', 0, 'name']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => v,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-title-field',
          title: 'rule-title-field',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'users.name',
                    mode: 'assign',
                    value: 'from-row-title-field',
                    valueTitleField: 'nickname',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledWith(
      [
        {
          path: ['users', 0, 'name'],
          value: 'from-row-title-field',
        },
      ],
      expect.objectContaining({
        linkageTxId: 'tx-row-title-field',
      }),
    );
  });

  it('prefers inherited linkageTxId over current event txId', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const linkageAssignHandler = vi.fn((actionCtx: any, { addFormValuePatch }: any) => {
      addFormValuePatch({ path: 'users.name', value: 'from-inherited-tx' });
      expect(actionCtx.linkageScopeDepth).toBe(0);
      expect(actionCtx.inputArgs).toEqual({
        source: 'linkage',
        txId: 'tx-current-linkage-event',
        linkageTxId: 'tx-root-user-event',
        changedPaths: [['users', 0, 'name']],
      });
    });

    const engine = new FlowEngine();
    const rowFork = new FlowModel({ uid: 'row-fork-inherited-tx', flowEngine: engine }) as any;
    rowFork.context.defineProperty('fieldIndex', {
      value: ['users:0'],
    });
    rowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.subModels = { items: [] };
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageAssignField') {
        return {
          handler: linkageAssignHandler,
        };
      }
    });

    const masterModel: any = {
      uid: 'master-grid-inherited-tx',
      forks: new Set([rowFork]),
    };

    const gridModel: any = {
      uid: 'grid-model-inherited-tx',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'users' ? usersField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageAssignField') {
          return {
            handler: linkageAssignHandler,
          };
        }
      }),
      __allModels: [],
    };

    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          cb(masterModel);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'linkage',
        txId: 'tx-current-linkage-event',
        linkageTxId: 'tx-root-user-event',
        changedPaths: [['users', 0, 'name']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => v,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          title: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'users.name',
                    mode: 'assign',
                    value: 'from-inherited-tx',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledTimes(1);
    const [patches, options] = setFormValues.mock.calls[0];
    expect(patches).toEqual([
      {
        path: ['users', 0, 'name'],
        value: 'from-inherited-tx',
      },
    ]);
    expect(options).toMatchObject({
      source: 'linkage',
      linkageTxId: 'tx-root-user-event',
      linkageScopeDepth: 0,
    });
  });

  it('keeps linkage metadata when row-scoped execution is deferred then retried', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const linkageAssignHandler = vi.fn((actionCtx: any, { addFormValuePatch }: any) => {
      addFormValuePatch({ path: 'users.name', value: 'retry-value' });
      expect(actionCtx.linkageScopeDepth).toBe(0);
      expect(actionCtx.inputArgs).toEqual({
        source: 'user',
        txId: 'tx-row-retry',
        changedPaths: [['users', 0, 'name']],
      });
    });

    const engine = new FlowEngine();
    const rowFork = new FlowModel({ uid: 'row-fork-retry', flowEngine: engine }) as any;
    rowFork.context.defineProperty('fieldIndex', {
      value: ['users:0'],
    });
    rowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.subModels = { items: [] };
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageAssignField') {
        return {
          handler: linkageAssignHandler,
        };
      }
    });

    const masterModel: any = {
      uid: 'master-grid-retry',
      forks: new Set([rowFork]),
    };

    const gridModel: any = {
      uid: 'grid-model-retry',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'users' ? usersField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageAssignField') {
          return {
            handler: linkageAssignHandler,
          };
        }
      }),
      __allModels: [],
    };

    let scanRound = 0;

    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          scanRound += 1;
          if (scanRound === 1) {
            return;
          }
          cb(masterModel);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-row-retry',
        changedPaths: [['users', 0, 'name']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => v,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-1',
          title: 'rule-1',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'users.name',
                    mode: 'assign',
                    value: 'retry-value',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(0);
    expect(setFormValues).toHaveBeenCalledTimes(0);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledTimes(1);
    const [patches, options] = setFormValues.mock.calls[0];
    expect(patches).toEqual([
      {
        path: ['users', 0, 'name'],
        value: 'retry-value',
      },
    ]);
    expect(options).toMatchObject({
      source: 'linkage',
      linkageTxId: 'tx-row-retry',
      linkageScopeDepth: 0,
    });
  });

  it('runs row-scoped linkage rules for subtable row forks without subModels.items and deduplicates the same row', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const linkageAssignHandler = vi.fn((actionCtx: any, { value, addFormValuePatch }: any) => {
      expect(actionCtx.linkageScopeDepth).toBe(0);
      expect(actionCtx.item?.value?.uid).toBe('role-uid-1');
      expect(value[0]?.value).toBe('role-uid-1');
      addFormValuePatch({ path: 'roles.name', value: value[0].value });
    });

    const engine = new FlowEngine();
    const makeRowFork = (uid: string) => {
      const rowFork = new FlowModel({ uid, flowEngine: engine }) as any;
      rowFork.context.defineMethod('subTableRowFork', () => true);
      rowFork.context.defineProperty('fieldIndex', {
        value: ['roles:0'],
      });
      rowFork.context.defineProperty('item', {
        value: {
          index: 0,
          __is_new__: true,
          value: {
            uid: 'role-uid-1',
          },
        },
      });
      rowFork.context.defineProperty('setFormValues', {
        value: setFormValues,
      });
      rowFork.context.defineProperty('app', {
        value: {
          jsonLogic: {
            apply: () => true,
          },
        },
      });
      rowFork.getAction = vi.fn((name: string) => {
        if (name === 'linkageAssignField') {
          return {
            handler: linkageAssignHandler,
          };
        }
      });
      return rowFork;
    };

    const rowFork1 = makeRowFork('role-row-fork-1');
    const rowFork2 = makeRowFork('role-row-fork-2');

    const masterModel1: any = {
      uid: 'master-role-grid-1',
      forks: new Set([rowFork1]),
    };
    const masterModel2: any = {
      uid: 'master-role-grid-2',
      forks: new Set([rowFork2]),
    };

    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };

    const gridModel: any = {
      uid: 'grid-model-role-row',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageAssignField') {
          return {
            handler: linkageAssignHandler,
          };
        }
      }),
      __allModels: [],
    };

    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          cb(masterModel1);
          cb(masterModel2);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-row',
        changedPaths: [['roles', 0, 'uid']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => {
        if (v === '{{ ctx.item.value.uid }}') {
          return 'role-uid-1';
        }
        return v;
      },
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-role-row',
          title: 'rule-role-row',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r1',
                    enable: true,
                    targetPath: 'roles.name',
                    mode: 'assign',
                    value: '{{ ctx.item.value.uid }}',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledWith(
      [
        {
          path: ['roles', 0, 'name'],
          value: 'role-uid-1',
        },
      ],
      expect.objectContaining({
        source: 'linkage',
        linkageTxId: 'tx-role-row',
        linkageScopeDepth: 0,
      }),
    );
  });

  it('keeps row-scoped default patches following while current value is still the last default', async () => {
    const store = {
      roles: [{ uid: 'role-uid-1', name: '' }],
    };
    const getAt = (path: Array<string | number>) => path.reduce((acc: any, seg) => acc?.[seg], store as any);
    const setAt = (path: Array<string | number>, value: any) => {
      let cur: any = store;
      for (const seg of path.slice(0, -1)) {
        cur = cur[seg];
      }
      cur[path[path.length - 1]] = value;
    };
    const pathKey = (path: Array<string | number>) => JSON.stringify(path);
    const lastDefaults = new Map<string, any>();
    const form = {
      getFieldValue: (path: Array<string | number>) => getAt(path),
    };
    const formValueRuntime = {
      canApplyDefaultValuePatch: vi.fn((path: Array<string | number>, value: any) => {
        const current = getAt(path);
        const last = lastDefaults.get(pathKey(path));
        if (current === undefined || current === null || current === '') return true;
        if (typeof last !== 'undefined' && current === last) return true;
        if (current === value) {
          lastDefaults.set(pathKey(path), value);
        }
        return false;
      }),
      recordDefaultValuePatch: vi.fn((path: Array<string | number>, value: any) => {
        lastDefaults.set(pathKey(path), value);
      }),
    };
    const setFormValues = vi.fn(async (patches: Array<{ path: Array<string | number>; value: any }>) => {
      for (const patch of patches) {
        setAt(patch.path, patch.value);
      }
    });
    const defaultHandler = vi.fn((actionCtx: any, { value, addFormValuePatch }: any) => {
      addFormValuePatch({ path: value[0].targetPath, value: value[0].value, whenEmpty: true });
    });

    const engine = new FlowEngine();
    const rowFork = new FlowModel({ uid: 'role-default-row-fork', flowEngine: engine }) as any;
    rowFork.context.defineProperty('subTableRowFork', {
      value: true,
    });
    rowFork.context.defineProperty('fieldIndex', {
      value: ['roles:0'],
    });
    rowFork.context.defineProperty('form', {
      value: form,
    });
    rowFork.context.defineProperty('item', {
      get: () => ({
        index: 0,
        __is_new__: true,
        value: store.roles[0],
      }),
    });
    rowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'setFieldsDefaultValue') {
        return {
          handler: defaultHandler,
        };
      }
    });

    const masterModel: any = {
      uid: 'master-role-default-grid',
      forks: new Set([rowFork]),
    };
    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const blockModel: any = {
      collection: {
        getField: (name: string) => (name === 'roles' ? rolesField : null),
      },
      formValueRuntime,
    };
    rowFork.context.defineProperty('blockModel', {
      value: blockModel,
    });
    const gridModel: any = {
      uid: 'grid-model-role-default-row',
      context: {
        blockModel,
      },
      getAction: vi.fn((name: string) => {
        if (name === 'setFieldsDefaultValue') {
          return {
            handler: defaultHandler,
          };
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          cb(masterModel);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-default-row',
        changedPaths: [['roles', 0, 'uid']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => v,
    };
    const makeParams = (value: string) => ({
      value: [
        {
          key: `rule-${value}`,
          title: `rule-${value}`,
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'setFieldsDefaultValue',
              params: {
                value: [
                  {
                    key: `r-${value}`,
                    enable: true,
                    targetPath: 'roles.name',
                    mode: 'default',
                    value,
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    await fieldLinkageRules.handler(ctx, makeParams('role-uid-1'));
    expect(store.roles[0].name).toBe('role-uid-1');

    store.roles[0].uid = 'role-uid-2';
    await fieldLinkageRules.handler(ctx, makeParams('role-uid-2'));
    expect(store.roles[0].name).toBe('role-uid-2');
    expect(setFormValues).toHaveBeenCalledTimes(2);
    expect(formValueRuntime.canApplyDefaultValuePatch).toHaveBeenCalledTimes(2);
    expect(formValueRuntime.recordDefaultValuePatch).toHaveBeenCalledTimes(2);

    store.roles[0].name = 'manual';
    store.roles[0].uid = 'role-uid-3';
    await fieldLinkageRules.handler(ctx, makeParams('role-uid-3'));
    expect(store.roles[0].name).toBe('manual');
    expect(setFormValues).toHaveBeenCalledTimes(2);
  });

  it('skips stale subtable row forks after the row has been removed', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const defaultHandler = vi.fn((actionCtx: any, { addFormValuePatch }: any) => {
      addFormValuePatch({ path: 'roles.title', value: 'stale-title', whenEmpty: true });
    });
    const form = {
      getFieldValue: vi.fn((path: Array<string | number>) => {
        if (JSON.stringify(path) === JSON.stringify(['roles', 2])) {
          return undefined;
        }
        if (JSON.stringify(path) === JSON.stringify(['roles'])) {
          return [
            { name: '1', title: '1' },
            { name: '3', title: '3' },
          ];
        }
      }),
    };

    const engine = new FlowEngine();
    const staleRowFork = new FlowModel({ uid: 'stale-role-row-fork', flowEngine: engine }) as any;
    staleRowFork.context.defineProperty('subTableRowFork', {
      value: true,
    });
    staleRowFork.context.defineProperty('fieldIndex', {
      value: ['roles:2'],
    });
    staleRowFork.context.defineProperty('form', {
      value: form,
    });
    staleRowFork.context.defineProperty('item', {
      value: {
        index: 2,
        __is_new__: true,
        value: { name: '3', title: '3' },
      },
    });
    staleRowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    staleRowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    staleRowFork.getAction = vi.fn((name: string) => {
      if (name === 'setFieldsDefaultValue') {
        return {
          handler: defaultHandler,
        };
      }
    });

    const masterModel: any = {
      uid: 'master-stale-role-grid',
      forks: new Set([staleRowFork]),
    };
    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const blockModel: any = {
      collection: {
        getField: (name: string) => (name === 'roles' ? rolesField : null),
      },
      formValueRuntime: {
        canApplyDefaultValuePatch: vi.fn(() => true),
        recordDefaultValuePatch: vi.fn(),
      },
    };
    staleRowFork.context.defineProperty('blockModel', {
      value: blockModel,
    });

    const gridModel: any = {
      uid: 'grid-model-stale-role-row',
      context: {
        blockModel,
      },
      getAction: vi.fn((name: string) => {
        if (name === 'setFieldsDefaultValue') {
          return {
            handler: defaultHandler,
          };
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (m: any) => void) => {
          cb(masterModel);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-stale-row',
        changedPaths: [['roles']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (v: any) => v,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-stale-row',
          title: 'rule-stale-row',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'setFieldsDefaultValue',
              params: {
                value: [
                  {
                    key: 'r-stale-row',
                    enable: true,
                    targetPath: 'roles.title',
                    mode: 'default',
                    value: 'stale-title',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(defaultHandler).not.toHaveBeenCalled();
    expect(setFormValues).not.toHaveBeenCalled();
  });
});
