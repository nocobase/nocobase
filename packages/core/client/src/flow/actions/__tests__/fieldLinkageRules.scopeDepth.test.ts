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
});
