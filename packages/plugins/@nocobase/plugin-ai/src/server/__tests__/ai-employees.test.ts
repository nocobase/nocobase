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
import {
  AI_EMPLOYEE_KNOWLEDGE_BASE_PROMPT_INVALID,
  AI_EMPLOYEE_NICKNAME_INVALID,
  AI_EMPLOYEE_USERNAME_CONFLICT,
  AI_EMPLOYEE_USERNAME_INVALID,
} from '../../common/error-codes';
import { create, update } from '../resource/aiEmployees';

const createContext = (
  existingEmployee: unknown = null,
  values: Record<string, unknown> = { username: 'atlas', nickname: 'Atlas' },
) => {
  const findOne = vi.fn().mockResolvedValue(existingEmployee);
  const ctx = {
    action: {
      params: {
        values,
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

  it('trims valid profile names before inserting', async () => {
    const values = { username: '  sales-assistant_2  ', nickname: '  销售助理 2  ' };
    const { ctx, findOne } = createContext(null, values);
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await create(ctx, vi.fn() as Next);

    expect(values).toEqual({
      username: 'sales-assistant_2',
      nickname: '销售助理 2',
      knowledgeBase: { retrievalStrategy: 'onDemand' },
    });
    expect(findOne).toHaveBeenCalledWith({ filter: { username: 'sales-assistant_2' } });
    expect(actionCreate).toHaveBeenCalledOnce();
  });

  it('rejects invalid usernames before inserting', async () => {
    const { ctx } = createContext(null, { username: 'sales assistant!', nickname: 'Sales Assistant' });
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await expect(create(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 400,
      code: AI_EMPLOYEE_USERNAME_INVALID,
      message: 'Use 1-64 letters, numbers, underscores, or hyphens.',
    });
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it('rejects invalid nicknames before inserting', async () => {
    const { ctx } = createContext(null, { username: 'sales-assistant', nickname: '!!!///[]' });
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await expect(create(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 400,
      code: AI_EMPLOYEE_NICKNAME_INVALID,
      message: "Use 1-64 letters, numbers, spaces, or . _ - ' ( ) & ·.",
    });
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it('rejects creating an enabled knowledge-base configuration without the data placeholder', async () => {
    const values = {
      username: 'atlas',
      nickname: 'Atlas',
      enableKnowledgeBase: true,
      knowledgeBasePrompt: 'Use retrieved content.',
    };
    const { ctx } = createContext(null, values);
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await expect(create(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 400,
      code: AI_EMPLOYEE_KNOWLEDGE_BASE_PROMPT_INVALID,
      message: 'The Knowledge Base Prompt must include {knowledgeBaseData} before you can save it.',
      data: { field: 'knowledgeBasePrompt' },
    });
    expect(actionCreate).not.toHaveBeenCalled();
  });

  it('accepts an enabled knowledge-base configuration with the data placeholder', async () => {
    const values = {
      username: 'atlas',
      nickname: 'Atlas',
      enableKnowledgeBase: true,
      knowledgeBasePrompt: 'Use retrieved content: {knowledgeBaseData}',
    };
    const { ctx } = createContext(null, values);
    const actionCreate = vi.spyOn(actions, 'create').mockResolvedValue(undefined);

    await create(ctx, vi.fn() as Next);

    expect(actionCreate).toHaveBeenCalledOnce();
  });

  it('validates and trims profile names on update', async () => {
    const values = { username: '  atlas  ', nickname: '  Atlas Admin  ' };
    const { ctx } = createContext(null, values);
    const actionUpdate = vi.spyOn(actions, 'update').mockResolvedValue(undefined);

    await update(ctx, vi.fn() as Next);

    expect(values).toEqual({ username: 'atlas', nickname: 'Atlas Admin' });
    expect(actionUpdate).toHaveBeenCalledOnce();
  });

  it('rejects updating the prompt of an enabled knowledge-base configuration without the placeholder', async () => {
    const values = { knowledgeBasePrompt: 'Use retrieved content.' };
    const { ctx } = createContext(
      {
        enableKnowledgeBase: true,
        knowledgeBasePrompt: 'Old prompt: {knowledgeBaseData}',
      },
      values,
    );
    ctx.action.params.filterByTk = 'atlas';
    const actionUpdate = vi.spyOn(actions, 'update').mockResolvedValue(undefined);

    await expect(update(ctx, vi.fn() as Next)).rejects.toMatchObject({
      status: 400,
      code: AI_EMPLOYEE_KNOWLEDGE_BASE_PROMPT_INVALID,
    });
    expect(actionUpdate).not.toHaveBeenCalled();
  });

  it('does not validate legacy knowledge-base prompts during unrelated updates', async () => {
    const values = { enabled: false };
    const { ctx, findOne } = createContext(
      {
        enableKnowledgeBase: true,
        knowledgeBasePrompt: 'Legacy prompt without placeholder',
      },
      values,
    );
    ctx.action.params.filterByTk = 'atlas';
    const actionUpdate = vi.spyOn(actions, 'update').mockResolvedValue(undefined);

    await update(ctx, vi.fn() as Next);

    expect(findOne).not.toHaveBeenCalled();
    expect(actionUpdate).toHaveBeenCalledOnce();
  });
});
