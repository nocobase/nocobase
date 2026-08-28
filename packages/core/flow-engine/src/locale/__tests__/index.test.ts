/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { getFlowEngineTranslation } from '../index';

describe('flow engine locale', () => {
  it('translates the default secondary confirmation text into Chinese', () => {
    expect(getFlowEngineTranslation('Please Confirm', 'zh-CN')).toBe('请确认');
    expect(getFlowEngineTranslation('Are you sure you want to perform the action?', 'zh-CN')).toBe(
      '确定要执行此操作吗？',
    );
  });
});
