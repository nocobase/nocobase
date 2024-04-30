/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACL } from '..';
import { AllowManager } from '../allow-manager';
describe('allow manager', () => {
  let acl: ACL;

  beforeEach(() => {
    acl = new ACL();
  });

  it('should allow star resource', async () => {
    const allowManager = new AllowManager(acl);

    allowManager.allow('*', 'download', 'public');

    expect(await allowManager.isAllowed('users', 'download', {})).toBeTruthy();
    expect(await allowManager.isAllowed('users', 'fake-method', {})).toBeFalsy();
    expect(await allowManager.isAllowed('users', 'other-method', {})).toBeFalsy();
  });
});
