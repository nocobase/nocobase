/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { ErrorHandler } from '../errors/handler';

describe('create with exception', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      acl: false,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get error handler instance', async () => {
    const handler = app.errorHandler;
    expect(handler).toBeTruthy();
    expect(handler).toBeInstanceOf(ErrorHandler);
  });
});
