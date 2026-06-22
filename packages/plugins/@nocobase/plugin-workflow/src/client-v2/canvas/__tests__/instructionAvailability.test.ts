/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getInstructionUnavailableMessage } from '../instructionAvailability';

describe('instruction availability', () => {
  const t = (key: string) => key;
  const workflow = {};
  const upstream = {};

  it('returns branch reason when async node is not supported in current branch', () => {
    const instruction = { async: true };

    expect(
      getInstructionUnavailableMessage(
        instruction as any,
        {
          engine: { isWorkflowSync: () => false },
          workflow,
          upstream,
          branchIndex: 0,
          branchContext: {
            syncOnly: true,
          },
        },
        t,
      ),
    ).toBe('This branch does not support asynchronous nodes.');
  });

  it('returns workflow reason when sync workflow tries to add async node', () => {
    const instruction = { async: true };

    expect(
      getInstructionUnavailableMessage(
        instruction as any,
        {
          engine: { isWorkflowSync: () => true },
          workflow,
          upstream,
          branchIndex: 0,
        },
        t,
      ),
    ).toBe('This type of node can not be used in current type of workflow or execute mode.');
  });

  it('returns default unavailable reason for instruction isAvailable check', () => {
    const instruction = {
      isAvailable: () => false,
    };

    expect(
      getInstructionUnavailableMessage(
        instruction as any,
        {
          engine: { isWorkflowSync: () => false },
          workflow,
          upstream,
          branchIndex: 0,
        },
        t,
      ),
    ).toBe('This type of node can not be used in current type of workflow or execute mode.');
  });

  it('returns null when instruction is available', () => {
    const instruction = {};

    expect(
      getInstructionUnavailableMessage(
        instruction as any,
        {
          engine: { isWorkflowSync: () => false },
          workflow,
          upstream,
          branchIndex: 0,
        },
        t,
      ),
    ).toBeNull();
  });
});
