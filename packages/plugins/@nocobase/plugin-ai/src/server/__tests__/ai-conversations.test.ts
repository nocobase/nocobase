/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isAIEmployeeEnabled } from '../resource/aiConversations';

describe('aiConversations resource', () => {
  it('treats disabled AI employees as unavailable for conversation creation', () => {
    const employee = {
      get: (key: string) => (key === 'enabled' ? false : undefined),
    };

    expect(isAIEmployeeEnabled(employee as never)).toBe(false);
  });

  it('allows AI employees unless they are explicitly disabled', () => {
    const employee = {
      get: (key: string) => (key === 'enabled' ? true : undefined),
    };

    expect(isAIEmployeeEnabled(employee as never)).toBe(true);
    expect(isAIEmployeeEnabled(undefined)).toBe(true);
  });
});
