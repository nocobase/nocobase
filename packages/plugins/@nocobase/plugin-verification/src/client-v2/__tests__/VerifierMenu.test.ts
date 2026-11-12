/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { expect, it, vi } from 'vitest';
import { VerificationUserCenterItemModel } from '../user-center/VerificationUserCenterItemModel';

it('rechecks whether any verifier is configured after a failed request', async () => {
  const hasAny = vi
    .fn()
    .mockResolvedValueOnce({ data: { data: false } })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { data: true } });
  const item = Object.create(VerificationUserCenterItemModel.prototype);
  Object.defineProperty(item, 'context', { value: { api: { resource: () => ({ hasAny }) } } });
  await expect(item.checkAvailability()).resolves.toBe(false);
  await expect(item.checkAvailability()).rejects.toThrow('offline');
  await expect(item.checkAvailability()).resolves.toBe(true);
});
