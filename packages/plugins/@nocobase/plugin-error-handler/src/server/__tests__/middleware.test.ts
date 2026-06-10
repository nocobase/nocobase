/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import { vi } from 'vitest';
import Plugin from '..';
import { ErrorHandler } from '../error-handler';

describe('middleware', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      acl: false,
      plugins: ['error-handler'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should handle not null error', async () => {
    const collection = app.db.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    });

    await collection.sync();

    class CustomError extends Error {
      constructor(message) {
        super(message);
        this.name = 'CustomError';
      }
    }

    (app.pm.get(Plugin) as Plugin).errorHandler.register(
      (err) => err instanceof CustomError,
      (err, ctx) => {
        ctx.body = {
          errors: [err.message],
        };
      },
    );

    app.use(
      (ctx, next) => {
        ctx.throw(400, new CustomError('custom error'));
      },
      { after: 'dataSource' },
    );

    const response = await app.agent().resource('users').create({
      values: {},
    });

    expect(response.statusCode).toEqual(400);

    expect(response.body).toEqual({
      errors: ['custom error'],
    });
  });

  it('should respect error log level', async () => {
    const errorHandler = new ErrorHandler();
    const trace = vi.fn();
    const error = vi.fn();
    const err = Object.assign(new Error('Unauthenticated. Please sign in to continue.'), {
      code: 'EMPTY_TOKEN',
      logLevel: 'trace',
      status: 401,
    });
    const ctx = { log: { trace, error } };

    await errorHandler.middleware()(ctx, async () => {
      throw err;
    });

    expect(ctx).toMatchObject({
      status: 401,
      body: {
        errors: [
          {
            code: 'EMPTY_TOKEN',
            message: 'Unauthenticated. Please sign in to continue.',
          },
        ],
      },
    });
    expect(trace).toHaveBeenCalledWith(err.message, {
      method: 'error-handler',
      err: err.stack,
      cause: err.cause,
    });
    expect(error).not.toHaveBeenCalled();
  });

  it('should keep errors without log level as error logs', async () => {
    const errorHandler = new ErrorHandler();
    const trace = vi.fn();
    const error = vi.fn();
    const err = Object.assign(new Error('Your session has expired. Please sign in again.'), {
      code: 'INVALID_TOKEN',
      status: 401,
    });
    const ctx = { log: { trace, error } };

    await errorHandler.middleware()(ctx, async () => {
      throw err;
    });

    expect(error).toHaveBeenCalledWith(err.message, {
      method: 'error-handler',
      err: err.stack,
      cause: err.cause,
    });
    expect(trace).not.toHaveBeenCalled();
  });
});
