/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AI_EMPLOYEE_USERNAME_CONFLICT } from '../../common/error-codes';
import { create } from '../resource/aiEmployees';

const createContext = (existingEmployee: unknown = null) => {
  const findOne = vi.fn().mockResolvedValue(existingEmployee);
  const ctx = {
    action: {
      params: {
        values: {
          username: 'atlas',
        },
      },
    },
    db: {
      getRepository: vi.fn().mockReturnValue({ findOne }),
    },
    t: (message: string) => message,
    throw: (status: number, details: { code: string; message: string }) => {
      throw Object.assign(new Error(details.message), { status, ...details });
    },
  } as unknown as Context;

  return { ctx, findOne };
};

describe('aiEmployees.create', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects a duplicate username before inserting', async () => {
    const { ctx, findOne } = createContext({ username: 'atlas' });
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await expect(create(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 409,
      code: AI_EMPLOYEE_USERNAME_CONFLICT,
      message: 'Username already exists',
    });

    expect(findOne).toHaveBeenCalledWith({
      filter: { username: 'atlas' },
    });
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it('maps a concurrent unique constraint failure to the same business error', async () => {
    const { ctx } = createContext();
    const uniqueConstraintError = Object.assign(new Error('duplicate key'), {
      name: 'SequelizeUniqueConstraintError',
    });
    vi.spyOn(actions, 'create').mockRejectedValue(uniqueConstraintError);

    await expect(create(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 409,
      code: AI_EMPLOYEE_USERNAME_CONFLICT,
      message: 'Username already exists',
    });
  });

  it('preserves non-unique errors from the default create action', async () => {
    const { ctx } = createContext();
    const originalError = new Error('database unavailable');
    vi.spyOn(actions, 'create').mockRejectedValue(originalError);

    await expect(create(ctx, vi.fn() as Next)).rejects.toBe(originalError);
  });
});
