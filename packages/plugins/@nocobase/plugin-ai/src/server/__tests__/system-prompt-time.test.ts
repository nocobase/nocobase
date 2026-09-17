/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIEmployee } from '../ai-employees/ai-employee';
import { createAIChatConversation } from '../manager/ai-chat-conversation';

const createdAt = new Date('2026-09-17T06:20:09.000Z');

function setup(options: { missing?: boolean; locale?: string; timezone?: string } = {}) {
  const findConversation = vi.fn().mockResolvedValue(options.missing ? null : { get: () => createdAt });
  const getRepository = vi.fn((name: string) => {
    if (name === 'aiConversations') {
      return { findOne: findConversation };
    }
    return { findOne: vi.fn().mockResolvedValue(null), find: vi.fn().mockResolvedValue([]) };
  });
  const db = { getRepository, sequelize: { getDialect: () => 'postgres' } };
  const ctx = {
    db,
    state: {},
    get: () => undefined,
    request: { header: { 'x-timezone': options.timezone ?? 'UTC' } },
    getCurrentLocale: () => options.locale ?? 'en-US',
  } as unknown as Context;
  const conversation = createAIChatConversation(ctx, 'session-1');
  const employee = Object.create(AIEmployee.prototype) as AIEmployee;
  Reflect.set(employee, 'ctx', ctx);
  Reflect.set(employee, 'db', db);
  Reflect.set(employee, 'employee', { username: 'nathan', nickname: 'Nathan', about: '', toJSON: () => ({}) });
  Reflect.set(employee, 'plugin', {
    knowledgeBaseManager: { isEnabledKnowledgeBase: vi.fn().mockResolvedValue(false) },
    workContextHandler: { background: vi.fn().mockResolvedValue([]) },
  });
  Reflect.set(employee, 'aiChatConversation', conversation);
  Reflect.set(employee, 'getAvailableSkills', async () => []);
  Reflect.set(employee, 'getAvailableAIEmployees', async () => []);
  return { employee, conversation, findConversation };
}

describe('conversation creation time in system prompts', () => {
  afterEach(() => vi.useRealTimers());

  it('reads the persisted conversation creation time', async () => {
    const { conversation, findConversation } = setup();
    expect(await conversation.getCreatedAt()).toEqual(createdAt);
    expect(findConversation).toHaveBeenCalledWith({
      filterByTk: 'session-1',
      fields: ['createdAt'],
      transaction: undefined,
    });
  });

  it('keeps the prompt identical across later calls and recreated agents', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T06:21:00Z'));
    const { employee } = setup();
    const first = await employee.getSystemPrompt([]);
    expect(first).toContain('<current_datetime>09/17/2026, 06:20:09 (UTC)</current_datetime>');
    vi.setSystemTime(new Date('2026-09-18T09:30:00Z'));
    expect(await employee.getSystemPrompt([])).toBe(first);
    expect(await setup().employee.getSystemPrompt([])).toBe(first);
  });

  it('formats the supplied creation time in the requested timezone', async () => {
    const { employee } = setup({ timezone: 'Asia/Shanghai' });
    expect(await employee.getSystemPrompt([])).toContain(
      '<current_datetime>09/17/2026, 14:20:09 (Asia/Shanghai)</current_datetime>',
    );
  });

  it('uses the supplied creation time for the ISO fallback', async () => {
    const { employee } = setup({ timezone: 'Invalid/Timezone' });
    expect(await employee.getSystemPrompt([])).toContain(
      '<current_datetime>2026-09-17T06:20:09.000Z (Invalid/Timezone)</current_datetime>',
    );
  });

  it('omits the timestamp when the conversation is missing instead of using the live clock', async () => {
    const { employee, conversation } = setup({ missing: true });
    expect(await conversation.getCreatedAt()).toBeUndefined();
    expect(await employee.getSystemPrompt([])).not.toContain('</current_datetime>');
  });
});
