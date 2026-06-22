/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { getInstructionAvailable } from '../instructionAvailability';

describe('getInstructionAvailable', () => {
  const t = (key: string) => key;

  it('blocks instructions whose own isAvailable rejects the workflow', () => {
    const instruction = {
      isAvailable: ({ workflow }: any) => workflow?.type === 'request-interception',
    };

    expect(
      getInstructionAvailable(instruction, {
        engine: { isWorkflowSync: () => false },
        workflow: { type: 'action', sync: false },
        t,
      }),
    ).toBe('This type of node can not be used in current type of workflow or execute mode.');
  });

  it('allows instructions whose own isAvailable accepts the workflow', () => {
    const instruction = {
      isAvailable: ({ workflow }: any) => workflow?.type === 'request-interception',
    };

    expect(
      getInstructionAvailable(instruction, {
        engine: { isWorkflowSync: () => false },
        workflow: { type: 'request-interception' },
        t,
      }),
    ).toBeNull();
  });

  it('blocks async instructions in sync workflows or sync-only branches', () => {
    const instruction = { async: true };

    expect(
      getInstructionAvailable(instruction, {
        engine: { isWorkflowSync: () => true },
        workflow: { type: 'action', sync: true },
        t,
      }),
    ).toBe('This type of node can not be used in current type of workflow or execute mode.');
    expect(
      getInstructionAvailable(instruction, {
        engine: { isWorkflowSync: () => false },
        workflow: { type: 'action', sync: false },
        branchContext: { syncOnly: true },
        t,
      }),
    ).toBe('This branch does not support asynchronous nodes.');
  });
});
