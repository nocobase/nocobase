/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  AI_EMPLOYEE_ATTACHMENT_COUNT_LIMIT,
  AI_EMPLOYEE_ATTACHMENT_SIZE_LIMIT_DEFAULT,
  formatAttachmentSizeLimit,
  resolveStorageSizeLimit,
  validateAIEmployeeAttachmentLimits,
} from '../../ai-employees/chatbox/utils';

describe('AI employee attachment limits', () => {
  it('uses the storage size rule as the total attachment size limit', () => {
    expect(resolveStorageSizeLimit({ size: 30 * 1024 * 1024 })).toBe(30 * 1024 * 1024);
    expect(resolveStorageSizeLimit({})).toBe(AI_EMPLOYEE_ATTACHMENT_SIZE_LIMIT_DEFAULT);
  });

  it('limits the total size of all attachments', () => {
    const sizeLimit = 20 * 1024 * 1024;
    expect(
      validateAIEmployeeAttachmentLimits([{ size: 12 * 1024 * 1024 }, { size: 9 * 1024 * 1024 }], sizeLimit),
    ).toEqual({ type: 'size', limit: sizeLimit });
  });

  it('allows no more than ten attachments', () => {
    const attachments = Array.from({ length: AI_EMPLOYEE_ATTACHMENT_COUNT_LIMIT + 1 }, () => ({ size: 1 }));
    expect(validateAIEmployeeAttachmentLimits(attachments, 1024)).toEqual({
      type: 'count',
      limit: AI_EMPLOYEE_ATTACHMENT_COUNT_LIMIT,
    });
  });

  it('formats the configured size limit for user-facing messages', () => {
    expect(formatAttachmentSizeLimit(20 * 1024 * 1024)).toBe('20 MB');
  });
});
