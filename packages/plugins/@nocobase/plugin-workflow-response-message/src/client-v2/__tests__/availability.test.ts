/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { isResponseMessageInstructionAvailable } from '../availability';

describe('isResponseMessageInstructionAvailable', () => {
  it('allows request interception workflows', () => {
    expect(isResponseMessageInstructionAvailable({ type: 'request-interception' })).toBe(true);
  });

  it('allows synchronous action workflows', () => {
    expect(isResponseMessageInstructionAvailable({ type: 'action', sync: true })).toBe(true);
    expect(isResponseMessageInstructionAvailable({ type: 'custom-action', sync: true })).toBe(true);
  });

  it('rejects asynchronous action workflows and unrelated workflow types', () => {
    expect(isResponseMessageInstructionAvailable({ type: 'action', sync: false })).toBe(false);
    expect(isResponseMessageInstructionAvailable({ type: 'custom-action' })).toBe(false);
    expect(isResponseMessageInstructionAvailable({ type: 'schedule' })).toBe(false);
  });
});
