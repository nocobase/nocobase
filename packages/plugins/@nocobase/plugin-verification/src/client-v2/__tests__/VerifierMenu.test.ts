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

it('rechecks user-manageable verifiers on each opening, including after a failed request', async () => {
  const list = vi
    .fn()
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: { data: [{ name: 'bound', boundInfo: { bound: true } }] } })
    .mockResolvedValueOnce({ data: { data: [{ name: 'available', boundInfo: { bound: false } }] } });
  const item = Object.create(VerificationUserCenterItemModel.prototype);
  Object.defineProperty(item, 'context', { value: { api: { resource: () => ({ listByUser: list }) } } });
  await expect(item.checkAvailability()).resolves.toBe(false);
  await expect(item.checkAvailability()).rejects.toThrow('offline');
  await expect(item.checkAvailability()).resolves.toBe(true);
  await expect(item.checkAvailability()).resolves.toBe(true);
});
