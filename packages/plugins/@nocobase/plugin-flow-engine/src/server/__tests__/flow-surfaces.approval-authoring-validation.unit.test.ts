/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { assertFlowSurfaceApprovalBlueprintAuthoringPayload } from '../flow-surfaces/approval/authoring-validation';
import { FlowSurfaceAggregateError } from '../flow-surfaces/errors';

function collectApprovalAuthoringErrorBody(values: Record<string, unknown>) {
  try {
    assertFlowSurfaceApprovalBlueprintAuthoringPayload(values);
  } catch (error) {
    expect(error).toBeInstanceOf(FlowSurfaceAggregateError);
    return (error as FlowSurfaceAggregateError).toResponseBody();
  }
  throw new Error('Expected approval blueprint authoring validation to fail');
}

describe('flowSurfaces approval blueprint authoring validation', () => {
  it('should allow optional initiator actions when approvalSubmit is omitted', () => {
    expect(() =>
      assertFlowSurfaceApprovalBlueprintAuthoringPayload({
        surface: 'initiator',
        workflowId: 1,
        blocks: [
          {
            key: 'applyForm',
            type: 'approvalInitiator',
            actions: ['approvalSaveDraft', 'approvalWithdraw'],
          },
        ],
      }),
    ).not.toThrow();
  });

  it('should reject explicit approvalSubmit on initiator blocks with aggregate retry guidance', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'initiator',
      workflowId: 1,
      blocks: [
        {
          key: 'applyForm',
          type: 'approvalInitiator',
          actions: ['approvalSubmit', 'approvalSaveDraft'],
        },
      ],
    });

    expect(body).toMatchObject({
      message:
        'flowSurfaces authoring validation failed with 1 error(s); fix all errors before retrying the same write',
      errorCount: 1,
      details: expect.objectContaining({
        retryPolicy: 'fix_all_errors_before_retry_same_write',
        sameWriteRetryRequired: true,
      }),
      errors: [
        expect.objectContaining({
          path: '$.blocks[0].actions',
          ruleId: 'approval-initiator-submit-action-default',
          details: expect.objectContaining({
            invalidAction: 'approvalSubmit',
            suggestedFix: expect.stringContaining('Remove approvalSubmit'),
          }),
        }),
      ],
    });
  });

  it('should aggregate initiator binding mistakes in one response', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'initiator',
      nodeId: 10,
    });

    expect(body.errorCount).toBe(2);
    expect(body.errors.map((error) => error.ruleId)).toEqual([
      'approval-initiator-workflow-id-required',
      'approval-initiator-node-id-forbidden',
    ]);
  });

  it('should aggregate common page-like block and layout authoring mistakes', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'initiator',
      workflowId: 1,
      blocks: [
        {
          key: 'applyForm',
          type: 'approvalInitiator',
        },
        {
          key: 'applyForm',
          type: 'approvalInitiator',
        },
        {
          key: 'missingType',
        },
        {
          key: 'rawBlock',
          type: 'approvalInitiator',
          use: 'ApplyFormModel',
        },
      ],
      layout: {
        rows: [['applyForm', 'applyForm'], ['missingBlock'], [{ uid: 'bogus' }]],
      },
    });

    expect(body.errors.map((error) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'approval-blueprint-block-key-duplicate',
        'approval-blueprint-block-type-or-template-required',
        'approval-blueprint-layout-key-unknown',
        'approval-blueprint-layout-key-duplicate',
        'approval-blueprint-layout-cell-key-empty',
        'approval-blueprint-block-public-fields-only',
      ]),
    );
  });

  it('should reject invalid template references before writes start', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'initiator',
      workflowId: 1,
      blocks: [
        {
          key: 'templated',
          type: 'approvalInitiator',
          resource: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
          template: {
            mode: 'bogus',
            usage: 'bogus',
          },
        },
        {
          key: 'fieldsTemplate',
          template: {
            uid: 'template-uid',
            usage: 'fields',
          },
          resource: {
            dataSourceKey: 'main',
            collectionName: 'employees',
          },
        },
        {
          key: 'blockTemplate',
          type: 'approvalInitiator',
          template: {
            uid: 'template-uid',
          },
        },
      ],
    });

    expect(body.errors.map((error) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'approval-blueprint-block-template-uid-required',
        'approval-blueprint-block-template-mode-unsupported',
        'approval-blueprint-block-template-usage-unsupported',
        'approval-blueprint-block-template-fields-resource-conflict',
        'approval-blueprint-block-template-block-conflict',
      ]),
    );
  });

  it('should reject approval blocks that do not belong to the selected surface', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'initiator',
      workflowId: 1,
      blocks: [
        {
          key: 'process',
          type: 'approvalApprover',
        },
      ],
    });

    expect(body).toMatchObject({
      errorCount: 1,
      errors: [
        expect.objectContaining({
          path: '$.blocks[0].type',
          ruleId: 'approval-block-not-allowed-for-surface',
          details: expect.objectContaining({
            surface: 'initiator',
            blockType: 'approvalApprover',
            expectedContainerUse: 'TriggerBlockGridModel',
          }),
        }),
      ],
    });
  });

  it('should aggregate task-card field and layout authoring mistakes', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'taskCard',
      workflowId: 1,
      fields: [
        {
          key: 'nickname',
          fieldPath: 'nickname',
        },
        {
          key: 'nickname',
          fieldPath: 'status',
        },
        {
          key: 'targeted',
          fieldPath: 'department',
          target: 'otherBlock',
        },
        {
          key: 'missingFieldPath',
        },
      ],
      layout: {
        rows: [['nickname'], ['missingField']],
      },
    });

    expect(body.errors.map((error) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'approval-blueprint-field-key-duplicate',
        'approval-task-card-field-target-forbidden',
        'approval-blueprint-field-invalid',
        'approval-blueprint-layout-key-unknown',
      ]),
    );
  });

  it('should reject duplicate singleton approval actions before writes start', () => {
    const body = collectApprovalAuthoringErrorBody({
      surface: 'approver',
      nodeId: 10,
      blocks: [
        {
          key: 'process',
          type: 'approvalApprover',
          actions: [
            'approvalApprove',
            {
              key: 'approveAgain',
              type: 'approvalApprove',
            },
            {
              key: 'rawAction',
              type: 'approvalReject',
              use: 'ProcessFormRejectModel',
            },
            {
              key: 'sameKey',
              type: 'approvalReject',
            },
            {
              key: 'sameKey',
              type: 'approvalReturn',
            },
          ],
        },
      ],
    });

    expect(body).toMatchObject({});
    expect(body.errors.map((error) => error.ruleId)).toEqual(
      expect.arrayContaining([
        'approval-action-singleton-duplicate',
        'approval-blueprint-action-public-fields-only',
        'approval-blueprint-action-key-duplicate',
      ]),
    );
    expect(body.errors.find((error) => error.ruleId === 'approval-action-singleton-duplicate')).toMatchObject({
      path: '$.blocks[0].actions[1]',
      details: expect.objectContaining({
        actionType: 'approvalApprove',
        firstIndex: 0,
        duplicateIndex: 1,
      }),
    });
  });
});
