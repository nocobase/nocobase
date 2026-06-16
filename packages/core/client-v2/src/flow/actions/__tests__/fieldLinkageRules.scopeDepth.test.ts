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
import { fieldLinkageRules, linkageSetFieldState } from '../linkageRules';

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
    const [patches, options] = setFormValues.mock.calls[0] as unknown as [any, any];
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
    const [patches, options] = setFormValues.mock.calls[0] as unknown as [any, any];
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
    const [patches, options] = setFormValues.mock.calls[0] as unknown as [any, any];
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

  it('retries row-scoped linkage rules when a row fork mounts after the initial retry tick', async () => {
    const setFormValues = vi.fn(async () => undefined);
    const linkageAssignHandler = vi.fn((actionCtx: any, { addFormValuePatch }: any) => {
      addFormValuePatch({ path: 'users.name', value: 'mounted-row-value' });
      expect(actionCtx.linkageScopeDepth).toBe(0);
      expect(actionCtx.inputArgs).toEqual({
        source: 'user',
        txId: 'tx-row-mounted',
        changedPaths: [['users', 0, 'name']],
      });
    });

    const engine = new FlowEngine() as any;
    const rowFork = new FlowModel({ uid: 'row-fork-mounted-retry', flowEngine: engine }) as any;
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
      uid: 'master-grid-mounted-retry',
      forks: new Set([rowFork]),
    };
    let mounted = false;
    engine.forEachModel = vi.fn((cb: (m: any) => void) => {
      if (mounted) {
        cb(masterModel);
      }
    });

    const gridModel: any = {
      uid: 'grid-model-mounted-retry',
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
      engine,
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-row-mounted',
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
          key: 'rule-mounted-retry',
          title: 'rule-mounted-retry',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageAssignField',
              params: {
                value: [
                  {
                    key: 'r-mounted-retry',
                    enable: true,
                    targetPath: 'users.name',
                    mode: 'assign',
                    value: 'mounted-row-value',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(linkageAssignHandler).toHaveBeenCalledTimes(0);

    mounted = true;
    engine.emitter.emit('model:mounted', { model: rowFork });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(linkageAssignHandler).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledTimes(1);
    expect(setFormValues).toHaveBeenCalledWith(
      [
        {
          path: ['users', 0, 'name'],
          value: 'mounted-row-value',
        },
      ],
      expect.objectContaining({
        source: 'linkage',
        linkageTxId: 'tx-row-mounted',
        linkageScopeDepth: 0,
      }),
    );
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

  it('applies row-scoped field state to the matching subtable column fork only', async () => {
    const engine = new FlowEngine();
    const makeColumnFork = (uid: string, fieldPath: string) => {
      const rowFork = new FlowModel({ uid, flowEngine: engine }) as any;
      rowFork.fieldPath = fieldPath;
      rowFork.context.defineProperty('subTableRowFork', {
        value: true,
      });
      rowFork.context.defineProperty('fieldIndex', {
        value: ['roles:0'],
      });
      rowFork.context.defineProperty('item', {
        value: {
          index: 0,
          __is_new__: true,
          value: {
            roleUid: 'role-uid-1',
            roleName: 'Role 1',
          },
        },
      });
      rowFork.context.defineProperty('app', {
        value: {
          jsonLogic: {
            apply: () => true,
          },
        },
      });
      rowFork.getAction = vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      });
      return rowFork;
    };

    const roleUidFork = makeColumnFork('role-uid-row-fork', 'roles.roleUid');
    const roleNameFork = makeColumnFork('role-name-row-fork', 'roles.roleName');
    const roleUidMaster: any = {
      uid: 'role-uid-master',
      forks: new Set([roleUidFork]),
    };
    const roleNameMaster: any = {
      uid: 'role-name-master',
      forks: new Set([roleNameFork]),
    };
    engine.forEachModel = vi.fn((cb: (model: any) => void) => {
      cb(roleUidMaster);
      cb(roleNameMaster);
    }) as any;

    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const gridModel: any = {
      uid: 'grid-model-role-state-row',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (model: any) => void) => {
          cb(roleUidMaster);
          cb(roleNameMaster);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-state-row',
        changedPaths: [['roles', 0, 'roleName']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (value: any) => value,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-role-state-row',
          title: 'rule-role-state-row',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-1',
                    enable: true,
                    targetPath: 'roles.roleName',
                    state: 'disabled',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(roleNameFork.props.disabled).toBe(true);
    expect(roleUidFork.props.disabled).toBeUndefined();
  });

  it('clears row-scoped required validation feedback when the required condition no longer matches', async () => {
    const engine = new FlowEngine();
    const requiredMessage = 'The field value is required';
    let conditionMatches = true;
    let fieldErrors = [requiredMessage, 'Custom error'];
    const jsonLogicApply = vi.fn(() => conditionMatches);
    const form = {
      getFieldError: vi.fn((name: any) =>
        JSON.stringify(name) === JSON.stringify(['roles', 0, 'title']) ? fieldErrors : [],
      ),
      setFields: vi.fn((fields: any[]) => {
        const first = fields[0];
        if (JSON.stringify(first?.name) === JSON.stringify(['roles', 0, 'title'])) {
          fieldErrors = first.errors;
        }
      }),
    };
    const rowFork = new FlowModel({ uid: 'role-name-required-row-fork', flowEngine: engine }) as any;
    rowFork.fieldPath = 'roles.title';
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
      value: {
        index: 0,
        length: 1,
        __is_new__: true,
        value: { uid: 'a', title: '', __is_new__: true },
      },
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: jsonLogicApply,
        },
      },
    });
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageSetFieldState') {
        return linkageSetFieldState;
      }
    });

    const roleNameMaster: any = {
      uid: 'role-name-required-master',
      forks: new Set([rowFork]),
    };
    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const gridModel: any = {
      uid: 'grid-model-role-required-row-state',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (model: any) => void) => {
          cb(roleNameMaster);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-required-state-row',
        changedPaths: [['roles', 0, 'uid']],
      },
      app: {
        jsonLogic: {
          apply: jsonLogicApply,
        },
      },
      resolveJsonTemplate: async (value: any) => value,
      t: (key: string) => key,
    };
    const params = {
      value: [
        {
          key: 'rule-role-required-row-state',
          title: 'rule-role-required-row-state',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-required-row',
                    enable: true,
                    targetPath: 'roles.title',
                    state: 'required',
                    condition: {
                      logic: '$and',
                      items: [{ path: 'role-uid', operator: '$includes', value: 'a', noValue: false }],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await fieldLinkageRules.handler(ctx, params);

    expect(rowFork.props.required).toBe(true);
    expect(rowFork.props.rules).toEqual([{ required: true, message: requiredMessage }]);
    expect(form.setFields).not.toHaveBeenCalled();

    conditionMatches = false;
    await fieldLinkageRules.handler(ctx, params);

    expect(rowFork.props.required).toBeUndefined();
    expect(rowFork.props.rules).toEqual([]);
    expect(form.setFields).toHaveBeenCalledWith([{ name: ['roles', 0, 'title'], errors: ['Custom error'] }]);
    expect(fieldErrors).toEqual(['Custom error']);
  });

  it('applies row-scoped field state to a rendered new subtable row before form value initialization', async () => {
    const engine = new FlowEngine();
    const form = {
      getFieldValue: vi.fn(() => undefined),
    };
    const rowFork = new FlowModel({ uid: 'role-name-new-row-fork', flowEngine: engine }) as any;
    rowFork.fieldPath = 'roles.title';
    rowFork.parent = {
      props: {
        value: [{ __index__: 'new-role-row', __is_new__: true }],
      },
    };
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
      value: {
        index: 0,
        __is_new__: true,
        value: { __index__: 'new-role-row', __is_new__: true },
      },
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageSetFieldState') {
        return linkageSetFieldState;
      }
    });

    const roleNameMaster: any = {
      uid: 'role-name-new-row-master',
      forks: new Set([rowFork]),
    };
    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const gridModel: any = {
      uid: 'grid-model-role-new-row-state',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (model: any) => void) => {
          cb(roleNameMaster);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-new-row-state',
        changedPaths: [['roles']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (value: any) => value,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-role-new-row-state',
          title: 'rule-role-new-row-state',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-new-row',
                    enable: true,
                    targetPath: 'roles.title',
                    state: 'disabled',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(rowFork.props.disabled).toBe(true);
  });

  it('keeps subtable row field hidden state on the inner field props without hiding the column fork', async () => {
    const engine = new FlowEngine();
    const setFormValues = vi.fn(async () => undefined);
    const setFieldValue = vi.fn();
    const form = {
      getFieldValue: vi.fn((path: any) => {
        if (JSON.stringify(path) === JSON.stringify(['roles', 0, 'title'])) {
          return 'Role 1';
        }
      }),
      setFieldValue,
    };
    const rowFork = new FlowModel({ uid: 'role-name-hidden-row-fork', flowEngine: engine }) as any;
    rowFork.fieldPath = 'roles.title';
    rowFork.context.defineProperty('subTableRowFork', {
      value: true,
    });
    rowFork.context.defineProperty('fieldIndex', {
      value: ['roles:0'],
    });
    rowFork.context.defineProperty('item', {
      value: {
        index: 0,
        length: 1,
        __is_new__: true,
        value: { title: 'Role 1', __is_new__: true },
      },
    });
    rowFork.context.defineProperty('setFormValues', {
      value: setFormValues,
    });
    rowFork.context.defineProperty('form', {
      value: form,
    });
    rowFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageSetFieldState') {
        return linkageSetFieldState;
      }
    });

    const roleNameMaster: any = {
      uid: 'role-name-hidden-row-master',
      forks: new Set([rowFork]),
    };
    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const gridModel: any = {
      uid: 'grid-model-role-hidden-row-state',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (model: any) => void) => {
          cb(roleNameMaster);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-hidden-row-state',
        changedPaths: [['roles', 0, 'title']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (value: any) => value,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-role-hidden-row-state',
          title: 'rule-role-hidden-row-state',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-hidden-row',
                    enable: true,
                    targetPath: 'roles.title',
                    state: 'hidden',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(rowFork.hidden).toBe(false);
    expect(rowFork.props.hidden).toBe(true);
    if (setFormValues.mock.calls.length) {
      expect(setFormValues).toHaveBeenCalledWith(
        [
          {
            path: ['roles', 0, 'title'],
            value: undefined,
          },
        ],
        expect.objectContaining({
          source: 'linkage',
          linkageTxId: 'tx-role-hidden-row-state',
          linkageScopeDepth: 0,
        }),
      );
    } else {
      expect(setFieldValue).toHaveBeenCalledWith(['roles', 0, 'title'], undefined);
    }
  });

  it('applies row-scoped field state to the rendered subform FormItem fork', async () => {
    const engine = new FlowEngine();
    const form = {
      getFieldValue: vi.fn(() => undefined),
    };
    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };

    const formItemMaster = new FlowModel({ uid: 'role-title-form-item', flowEngine: engine }) as any;
    formItemMaster.getStepParams = vi.fn((flowKey: string, stepKey: string) => {
      if (flowKey === 'fieldSettings' && stepKey === 'init') {
        return { fieldPath: 'roles.title' };
      }
    });
    const formItemFork = formItemMaster.createFork({ disabled: false }, `roles:0:${formItemMaster.uid}`) as any;
    formItemFork.context.defineProperty('fieldIndex', {
      value: ['roles:0'],
    });
    formItemFork.context.defineProperty('fieldKey', {
      value: ['roles:0'],
    });

    const rowGridFork = new FlowModel({ uid: 'roles-row-grid-fork', flowEngine: engine }) as any;
    rowGridFork.subModels = {
      items: [formItemMaster],
    };
    rowGridFork.context.defineProperty('fieldIndex', {
      value: ['roles:0'],
    });
    rowGridFork.context.defineProperty('fieldKey', {
      value: ['roles:0'],
    });
    rowGridFork.context.defineProperty('form', {
      value: form,
    });
    rowGridFork.context.defineProperty('item', {
      value: {
        index: 0,
        length: 1,
      },
    });
    rowGridFork.context.defineProperty('app', {
      value: {
        jsonLogic: {
          apply: () => true,
        },
      },
    });
    rowGridFork.getAction = vi.fn((name: string) => {
      if (name === 'linkageSetFieldState') {
        return linkageSetFieldState;
      }
    });

    const gridMaster: any = {
      uid: 'roles-grid-master',
      forks: new Set([rowGridFork]),
    };
    engine.forEachModel = vi.fn((cb: (model: any) => void) => {
      cb(gridMaster);
      cb(formItemMaster);
    }) as any;

    const rootGridModel: any = {
      uid: 'grid-model-role-form-item-row-state',
      flowEngine: engine,
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: rootGridModel,
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-form-item-row-state',
        changedPaths: [['roles']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (value: any) => value,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-role-form-item-row-state',
          title: 'rule-role-form-item-row-state',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-form-item-row',
                    enable: true,
                    targetPath: 'roles.title',
                    state: 'disabled',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(formItemFork.props.disabled).toBe(true);
    expect(formItemMaster.props.disabled).toBeUndefined();

    formItemFork.setProps({ disabled: false });
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(formItemFork.props.disabled).toBe(true);
  });

  it('keeps row-scoped field state option limits on the row fork without syncing sibling field forks', async () => {
    const engine = new FlowEngine();
    const selectedOptions = [{ label: 'Draft', value: 'draft' }];
    const statusCellFork0 = { uid: 'status-field-component', setProps: vi.fn() };
    const statusCellFork1 = { uid: 'status-field-component', setProps: vi.fn() };
    const statusFieldComponentModel: any = {
      uid: 'status-field-component',
      props: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Published', value: 'published' },
        ],
      },
      forks: new Set([statusCellFork0, statusCellFork1]),
      setProps: vi.fn(),
    };
    const makeStatusFork = (uid: string, rowIndex: number, conditionMatched: boolean) => {
      const rowFork = new FlowModel({ uid, flowEngine: engine }) as any;
      rowFork.fieldPath = 'roles.status';
      rowFork.subModels = {
        field: statusFieldComponentModel,
      };
      rowFork.context.defineProperty('subTableRowFork', {
        value: true,
      });
      rowFork.context.defineProperty('fieldIndex', {
        value: [`roles:${rowIndex}`],
      });
      rowFork.context.defineProperty('item', {
        value: {
          index: rowIndex,
          __is_new__: true,
          value: {
            status: rowIndex === 0 ? 'draft' : 'published',
          },
        },
      });
      rowFork.context.defineProperty('app', {
        value: {
          jsonLogic: {
            apply: () => conditionMatched,
          },
        },
      });
      rowFork.getAction = vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      });
      return rowFork;
    };

    const statusFork0 = makeStatusFork('status-row-fork-0', 0, true);
    const statusFork1 = makeStatusFork('status-row-fork-1', 1, false);
    const statusMaster: any = {
      uid: 'status-master',
      forks: new Set([statusFork0, statusFork1]),
    };

    const rolesField: any = {
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => ({ name, isAssociationField: () => false }),
      },
    };
    const gridModel: any = {
      uid: 'grid-model-role-options-row',
      context: {
        blockModel: {
          collection: {
            getField: (name: string) => (name === 'roles' ? rolesField : null),
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: (cb: (model: any) => void) => {
          cb(statusMaster);
        },
      },
      flowKey: 'eventSettings',
      inputArgs: {
        source: 'user',
        txId: 'tx-role-options-row',
        changedPaths: [['roles', 0, 'status']],
      },
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      resolveJsonTemplate: async (value: any) => value,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-role-options-row',
          title: 'rule-role-options-row',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-options',
                    enable: true,
                    targetPath: 'roles.status',
                    state: 'limitOptions',
                    selectedOptions,
                    condition: {
                      logic: '$and',
                      items: [{ path: '{{ ctx.item.value.status }}', operator: '$eq', value: 'draft' }],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(statusFork0.props.__rowScopedFieldOptions).toEqual(selectedOptions);
    expect(statusFork1.props.__rowScopedFieldOptions).toBeUndefined();
    expect(statusFieldComponentModel.setProps).not.toHaveBeenCalledWith({ options: selectedOptions });
    expect(statusCellFork0.setProps).not.toHaveBeenCalled();
    expect(statusCellFork1.setProps).not.toHaveBeenCalled();
  });

  it('keeps relation subfield state block-scoped when no row target model exists', async () => {
    const roleNameField: any = {
      name: 'roleName',
      isAssociationField: () => false,
    };
    const rolesField: any = {
      type: 'belongsToMany',
      interface: 'm2m',
      isAssociationField: () => true,
      targetCollection: {
        getField: (name: string) => (name === 'roleName' ? roleNameField : null),
      },
    };
    const rolesFieldModel: any = {
      uid: 'roles-field',
      hidden: false,
      props: { label: 'Roles' },
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') {
          return { fieldPath: 'roles' };
        }
      },
      setProps(key: any, value?: any) {
        if (typeof key === 'string') {
          this.props[key] = value;
        } else {
          this.props = { ...this.props, ...key };
        }
      },
    };
    const blockModel: any = {
      collection: {
        getField: (name: string) => (name === 'roles' ? rolesField : null),
      },
    };
    const gridModel: any = {
      uid: 'grid-model-relation-field-state',
      context: {
        blockModel,
      },
      subModels: {
        grid: {
          subModels: {
            items: [rolesFieldModel],
          },
        },
      },
      getAction: vi.fn((name: string) => {
        if (name === 'linkageSetFieldState') {
          return linkageSetFieldState;
        }
      }),
      __allModels: [],
    };
    const ctx: any = {
      model: gridModel,
      engine: {
        forEachModel: vi.fn(),
      },
      flowKey: 'eventSettings',
      app: {
        jsonLogic: {
          apply: () => true,
        },
      },
      getAction: gridModel.getAction,
      resolveJsonTemplate: async (value: any) => value,
    };

    await fieldLinkageRules.handler(ctx, {
      value: [
        {
          key: 'rule-relation-field-state',
          title: 'rule-relation-field-state',
          enable: true,
          condition: { logic: '$and', items: [] },
          actions: [
            {
              name: 'linkageSetFieldState',
              params: {
                value: [
                  {
                    key: 'state-relation-field',
                    enable: true,
                    targetPath: 'roles.roleName',
                    state: 'disabled',
                    condition: { logic: '$and', items: [] },
                  },
                ],
              },
            },
          ],
        },
      ],
    });

    expect(rolesFieldModel.props.disabled).toBe(true);
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
