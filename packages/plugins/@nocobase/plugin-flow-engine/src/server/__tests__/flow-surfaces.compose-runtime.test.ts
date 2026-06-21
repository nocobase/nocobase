/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  compileComposeExecutionPlan,
  resolveComposeTargetKey,
  type FlowSurfaceComposeNormalizedBlockSpec,
} from '../flow-surfaces/compose-compiler';
import { executeComposeRuntime } from '../flow-surfaces/compose-runtime';

describe('flowSurfaces compose runtime helpers', () => {
  it('should compile list fields against item containers and preserve append layout strategy', () => {
    const normalizedBlocks: FlowSurfaceComposeNormalizedBlockSpec[] = [
      {
        key: 'employeeCards',
        type: 'gridCard',
        settings: {
          title: 'Employees',
        },
        fields: [
          {
            key: 'nickname',
            fieldPath: 'nickname',
          },
        ],
        actions: [],
        recordActions: [],
      },
    ];

    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks,
    });

    expect(plan.blocks).toHaveLength(1);
    expect(plan.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockKey: 'employeeCards',
          containerSource: 'item',
          payload: expect.objectContaining({
            key: 'nickname',
            fieldPath: 'nickname',
          }),
        }),
      ]),
    );
    expect(plan.layoutPlan).toEqual({
      kind: 'append',
    });
  });

  it('should choose explicit layout for replace mode even when no rows are declared', () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'replace',
      normalizedBlocks: [],
    });

    expect(plan.layoutPlan).toEqual({
      kind: 'explicit',
      layout: undefined,
    });
  });

  it('should remove existing items before creating new blocks in replace mode', async () => {
    const executionOrder: string[] = [];
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'replace',
      existingItemUids: ['old-1', 'old-2'],
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          fields: [],
          actions: [],
          recordActions: [],
        },
      ],
    });

    await executeComposeRuntime(plan, {
      removeExistingItem: async (uid) => {
        executionOrder.push(`remove:${uid}`);
      },
      createBlock: async () => {
        executionOrder.push('create:block');
        return {
          uid: 'block-1',
        };
      },
      createField: async () => ({
        uid: 'field-1',
      }),
      createAction: async () => ({
        uid: 'action-1',
      }),
      createRecordAction: async () => ({
        uid: 'record-action-1',
      }),
      buildExplicitLayoutPayload: async () => ({
        rows: {},
        sizes: {},
        rowOrder: [],
      }),
      setLayout: async (payload) => payload,
    });

    expect(executionOrder).toEqual(['remove:old-1', 'remove:old-2', 'create:block']);
  });

  it('should reject replace mode when removeExistingItem runtime dep is missing', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'replace',
      existingItemUids: ['old-1'],
      normalizedBlocks: [],
    });

    await expect(
      executeComposeRuntime(plan, {
        createBlock: async () => ({
          uid: 'block-1',
        }),
        createField: async () => ({
          uid: 'field-1',
        }),
        createAction: async () => ({
          uid: 'action-1',
        }),
        createRecordAction: async () => ({
          uid: 'record-action-1',
        }),
        buildExplicitLayoutPayload: async () => ({
          rows: {},
          sizes: {},
          rowOrder: [],
        }),
        setLayout: async (payload) => payload,
      }),
    ).rejects.toThrow(`flowSurfaces compose replace runtime deps missing 'removeExistingItem'`);
  });

  it('should reject missing settings runtime deps instead of silently dropping after-effects', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          settings: {
            title: 'Employees',
          },
          fields: [
            {
              key: 'nickname',
              fieldPath: 'nickname',
              settings: {
                title: 'Nickname',
              },
            },
          ],
          actions: [],
          recordActions: [],
        },
      ],
    });

    await expect(
      executeComposeRuntime(plan, {
        createBlock: async () => ({
          uid: 'block-1',
        }),
        createField: async () => ({
          uid: 'field-1',
        }),
        createAction: async () => ({
          uid: 'action-1',
        }),
        createRecordAction: async () => ({
          uid: 'record-action-1',
        }),
        buildAppendLayoutPayload: async () => ({
          rows: {},
          sizes: {},
          rowOrder: [],
        }),
        setLayout: async (payload) => payload,
      }),
    ).rejects.toThrow(`flowSurfaces compose block settings runtime deps missing 'applyNodeSettings'`);
  });

  it('should reject missing popup runtime deps instead of silently dropping action popup', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          fields: [],
          actions: [
            {
              key: 'addNew',
              type: 'addNew',
            },
          ],
          recordActions: [],
        },
      ],
    });

    await expect(
      executeComposeRuntime(plan, {
        createBlock: async () => ({
          uid: 'block-1',
        }),
        createField: async () => ({
          uid: 'field-1',
        }),
        createAction: async () => ({
          uid: 'action-1',
        }),
        createRecordAction: async () => ({
          uid: 'record-action-1',
        }),
        buildAppendLayoutPayload: async () => ({
          rows: {},
          sizes: {},
          rowOrder: [],
        }),
        setLayout: async (payload) => payload,
      }),
    ).rejects.toThrow(`flowSurfaces compose action popup runtime deps missing 'applyActionPopup'`);
  });

  it('should execute runtime and preserve compose result shape', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          settings: {
            title: 'Employees',
          },
          fields: [
            {
              key: 'nickname',
              fieldPath: 'nickname',
            },
          ],
          actions: [
            {
              key: 'refresh',
              type: 'refresh',
              settings: {
                title: 'Refresh',
              },
              popup: {
                mode: 'replace',
              },
            },
          ],
          recordActions: [
            {
              key: 'view',
              type: 'view',
              settings: {
                title: 'View',
              },
            },
          ],
        },
      ],
    });

    const calls: Record<string, unknown[]> = {
      blockSettings: [],
      fieldSettings: [],
      actionPopup: [],
      appendLayout: [],
      setLayout: [],
      fieldPayloads: [],
    };

    const result = await executeComposeRuntime(plan, {
      createBlock: async () => ({
        uid: 'block-1',
        gridUid: 'block-grid-1',
      }),
      applyNodeSettings: async (actionName, targetUid, settings) => {
        calls.blockSettings.push({ actionName, targetUid, settings });
      },
      createField: async (payload) => {
        calls.fieldPayloads.push(payload);
        return {
          uid: 'wrapper-1',
          wrapperUid: 'wrapper-1',
          fieldUid: 'field-1',
          innerFieldUid: 'field-1',
        };
      },
      applyFieldSettings: async (actionName, fieldResult, settings) => {
        calls.fieldSettings.push({ actionName, fieldResult, settings });
      },
      createAction: async () => ({
        uid: 'action-1',
        parentUid: 'block-1',
        scope: 'block',
      }),
      createRecordAction: async () => ({
        uid: 'record-action-1',
        parentUid: 'actions-column-1',
        scope: 'record',
      }),
      applyActionPopup: async (actionName, actionUid, popup) => {
        calls.actionPopup.push({ actionName, actionUid, popup });
      },
      collectActionKeys: async (actionUid) => ({
        popupPageUid: `${actionUid}-popup-page`,
      }),
      buildAppendLayoutPayload: async (input) => {
        calls.appendLayout.push(input);
        return {
          rows: {
            appendRow1: [['block-1']],
          },
          sizes: {
            appendRow1: [24],
          },
          rowOrder: ['appendRow1'],
        };
      },
      setLayout: async (payload) => {
        calls.setLayout.push(payload);
        return {
          ok: true,
          ...payload,
        };
      },
    });

    expect(calls.fieldPayloads[0]).toEqual(
      expect.objectContaining({
        target: {
          uid: 'block-1',
        },
        fieldPath: 'nickname',
      }),
    );
    expect(calls.appendLayout).toEqual([
      {
        gridUid: 'grid-1',
        appendedItemUids: ['block-1'],
      },
    ]);
    expect(calls.actionPopup).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionName: 'compose action',
          actionUid: 'action-1',
        }),
        expect.objectContaining({
          actionName: 'compose recordAction',
          actionUid: 'record-action-1',
        }),
      ]),
    );
    expect(result).toEqual(
      expect.objectContaining({
        target: {
          uid: 'grid-1',
        },
        mode: 'append',
        blocks: [
          expect.objectContaining({
            key: 'table',
            uid: 'block-1',
            actionsColumnUid: 'actions-column-1',
            fields: [
              expect.objectContaining({
                key: 'nickname',
                fieldUid: 'field-1',
              }),
            ],
            actions: [
              expect.objectContaining({
                key: 'refresh',
                popupPageUid: 'action-1-popup-page',
              }),
            ],
            recordActions: [
              expect.objectContaining({
                key: 'view',
                popupPageUid: 'record-action-1-popup-page',
              }),
            ],
          }),
        ],
        layout: expect.objectContaining({
          ok: true,
        }),
      }),
    );
  });

  it('should create list-like block fields under itemUid during runtime', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'employeeCards',
          type: 'gridCard',
          fields: [
            {
              key: 'nickname',
              fieldPath: 'nickname',
            },
          ],
          actions: [],
          recordActions: [],
        },
      ],
    });

    const fieldPayloads: Array<Record<string, unknown>> = [];
    await executeComposeRuntime(plan, {
      createBlock: async () => ({
        uid: 'block-1',
        itemUid: 'item-1',
      }),
      createField: async (payload) => {
        fieldPayloads.push(payload);
        return {
          uid: 'field-1',
        };
      },
      createAction: async () => ({
        uid: 'action-1',
      }),
      createRecordAction: async () => ({
        uid: 'record-action-1',
      }),
      buildAppendLayoutPayload: async () => ({
        rows: {},
        sizes: {},
        rowOrder: [],
      }),
      setLayout: async (payload) => payload,
    });

    expect(fieldPayloads[0]).toEqual(
      expect.objectContaining({
        target: {
          uid: 'item-1',
        },
      }),
    );
  });

  it('should continue later fields and actions when onFieldError asks compose runtime to continue', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'details',
          type: 'details',
          fields: [
            {
              key: 'title',
              fieldPath: 'title',
            },
            {
              key: 'hidden',
              fieldPath: 'hidden',
            },
          ],
          actions: [
            {
              key: 'refresh',
              type: 'refresh',
            },
          ],
          recordActions: [],
        },
      ],
    });

    const fieldOrder: string[] = [];
    const actionOrder: string[] = [];
    const capturedErrors: string[] = [];

    const result = await executeComposeRuntime(plan, {
      createBlock: async () => ({
        uid: 'block-1',
      }),
      createField: async (_payload, spec) => {
        fieldOrder.push(spec.key);
        if (spec.key === 'hidden') {
          throw new Error('hidden is not addable');
        }
        return {
          uid: `${spec.key}-wrapper`,
          wrapperUid: `${spec.key}-wrapper`,
          fieldUid: `${spec.key}-field`,
          innerFieldUid: `${spec.key}-field`,
        };
      },
      onFieldError: async ({ error, spec }) => {
        capturedErrors.push(`${spec.key}:${(error as Error).message}`);
        return 'continue' as const;
      },
      createAction: async (_payload, spec) => {
        actionOrder.push(spec.key);
        return {
          uid: `${spec.key}-action`,
        };
      },
      createRecordAction: async () => ({
        uid: 'record-action-1',
      }),
      buildAppendLayoutPayload: async () => ({
        rows: {},
        sizes: {},
        rowOrder: [],
      }),
      setLayout: async (payload) => payload,
    });

    expect(fieldOrder).toEqual(['title', 'hidden']);
    expect(capturedErrors).toEqual(['hidden:hidden is not addable']);
    expect(actionOrder).toEqual(['refresh']);
    expect(result.blocks[0].fields).toEqual([
      expect.objectContaining({
        key: 'title',
        fieldUid: 'title-field',
      }),
    ]);
    expect(result.blocks[0].actions[0]).toEqual(
      expect.objectContaining({
        key: 'refresh',
        uid: 'refresh-action',
      }),
    );
  });

  it('should resolve cross-block field target keys during runtime', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          fields: [],
          actions: [],
          recordActions: [],
        },
        {
          key: 'filter',
          type: 'filterForm',
          fields: [
            {
              key: 'status',
              fieldPath: 'status',
              target: 'table',
            },
          ],
          actions: [],
          recordActions: [],
        },
      ],
    });

    const fieldPayloads: Array<Record<string, unknown>> = [];
    await executeComposeRuntime(plan, {
      createBlock: async (_payload, spec) => ({
        uid: `${spec.key}-uid`,
      }),
      createField: async (payload) => {
        fieldPayloads.push(payload);
        return {
          uid: 'field-wrapper',
        };
      },
      createAction: async () => ({
        uid: 'action',
      }),
      createRecordAction: async () => ({
        uid: 'record-action',
      }),
      buildAppendLayoutPayload: async () => ({
        rows: {},
        sizes: {},
        rowOrder: [],
      }),
      setLayout: async (payload) => payload,
    });

    expect(fieldPayloads[0]).toEqual(
      expect.objectContaining({
        key: 'status',
        defaultTargetUid: 'table-uid',
      }),
    );
  });

  it('should pass full created keys to explicit layout builder', async () => {
    const explicitLayoutInputs: Array<Record<string, unknown>> = [];
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'replace',
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          fields: [],
          actions: [],
          recordActions: [
            {
              key: 'view',
              type: 'view',
            },
          ],
        },
      ],
      layout: {
        rows: [['table']],
      },
    });

    await executeComposeRuntime(plan, {
      createBlock: async () => ({
        uid: 'block-1',
        itemUid: 'item-1',
      }),
      createField: async () => ({
        uid: 'field-1',
      }),
      createAction: async () => ({
        uid: 'action-1',
      }),
      createRecordAction: async () => ({
        uid: 'record-action-1',
        parentUid: 'actions-column-1',
      }),
      applyActionPopup: async () => undefined,
      buildExplicitLayoutPayload: async (input) => {
        explicitLayoutInputs.push(input as Record<string, unknown>);
        return {
          rows: {},
          sizes: {},
          rowOrder: [],
        };
      },
      setLayout: async (payload) => payload,
    });

    expect(explicitLayoutInputs[0]).toEqual(
      expect.objectContaining({
        targetUid: 'grid-1',
        createdByKey: expect.objectContaining({
          table: expect.objectContaining({
            uid: 'block-1',
            itemUid: 'item-1',
            actionsColumnUid: 'actions-column-1',
          }),
        }),
      }),
    );
  });

  it('should reject empty or unknown target keys', () => {
    expect(() => resolveComposeTargetKey('', {}, 'field')).toThrow(
      `flowSurfaces compose field target key cannot be empty`,
    );
    expect(() => resolveComposeTargetKey('missing', {}, 'layout')).toThrow(
      `flowSurfaces compose layout target 'missing' was not created in the current compose call`,
    );
  });

  it('should reject missing layout runtime deps when append layout is required', async () => {
    const plan = compileComposeExecutionPlan({
      gridUid: 'grid-1',
      mode: 'append',
      normalizedBlocks: [
        {
          key: 'table',
          type: 'table',
          fields: [],
          actions: [],
          recordActions: [],
        },
      ],
    });

    await expect(
      executeComposeRuntime(plan, {
        createBlock: async () => ({
          uid: 'block-1',
        }),
        createField: async () => ({
          uid: 'field-1',
        }),
        createAction: async () => ({
          uid: 'action-1',
        }),
        createRecordAction: async () => ({
          uid: 'record-action-1',
        }),
      }),
    ).rejects.toThrow('flowSurfaces compose append layout runtime deps missing');
  });
});
