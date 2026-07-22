/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  EMPLOYEE_PROMPT_VARIABLE_NAMESPACES,
  buildEmployeeSubmitValues,
  createAIEmployee,
  deleteAIEmployee,
  isAIEmployeeUsernameConflictError,
  isKnowledgeBaseEnabled,
  listAIEmployees,
  listKnowledgeBases,
  moveAIEmployee,
  normalizeSkillSettings,
  updateAIEmployee,
  updateAIEmployeeEnabled,
} from '../pages/EmployeesPage';
import { isValidAIEmployeeNickname, isValidAIEmployeeUsername } from '../../common/ai-employee-validation';

describe('EmployeesPage request helpers', () => {
  it('keeps the role prompt editor wired to v2 variable namespaces', () => {
    expect(EMPLOYEE_PROMPT_VARIABLE_NAMESPACES).toEqual(['user', 'roleName', 'locale', 'now', 'timestamp']);
  });

  it('lists employees with the selected category filter', async () => {
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ username: 'atlas' }, { nickname: 'invalid' }],
        count: 1,
      },
    });
    const apiClient = {
      resource: () => ({ list }),
    };

    await expect(listAIEmployees(apiClient, { category: 'developer', page: 2, pageSize: 20 })).resolves.toEqual({
      data: [{ username: 'atlas' }],
      total: 1,
    });

    expect(list).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      filter: {
        category: 'developer',
      },
      sort: ['sort'],
    });
  });

  it('moves employees by username and the sortable sort field', async () => {
    const move = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ move }),
    };

    await moveAIEmployee(apiClient, 'atlas', 'viz');

    expect(move).toHaveBeenCalledWith({
      sourceId: 'atlas',
      targetId: 'viz',
      sortField: 'sort',
    });
  });

  it('creates an employee through aiEmployees.create with trimmed profile names', async () => {
    const create = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ create }),
    };

    await createAIEmployee(apiClient, {
      username: '  atlas  ',
      nickname: '  Atlas  ',
      enabled: true,
      builtIn: false,
    });

    expect(create).toHaveBeenCalledWith({
      values: {
        username: 'atlas',
        nickname: 'Atlas',
        enabled: true,
        builtIn: false,
      },
    });
  });

  it('validates username and multilingual nickname formats', () => {
    expect(isValidAIEmployeeUsername('sales-assistant_2')).toBe(true);
    expect(isValidAIEmployeeUsername('sales assistant')).toBe(false);
    expect(isValidAIEmployeeUsername('sales!')).toBe(false);
    expect(isValidAIEmployeeUsername('a'.repeat(65))).toBe(false);

    expect(isValidAIEmployeeNickname('销售助理 2')).toBe(true);
    expect(isValidAIEmployeeNickname("D'Arcy (R&D) · 2")).toBe(true);
    expect(isValidAIEmployeeNickname('!!!///[]')).toBe(false);
    expect(isValidAIEmployeeNickname('a'.repeat(65))).toBe(false);
  });

  it('recognizes the stable duplicate username business error', () => {
    expect(
      isAIEmployeeUsernameConflictError({
        response: {
          data: {
            errors: [{ code: 'AI_EMPLOYEE_USERNAME_CONFLICT', message: 'Username already exists' }],
          },
        },
      }),
    ).toBe(true);
    expect(
      isAIEmployeeUsernameConflictError({
        response: {
          data: {
            errors: [{ code: 'OTHER_ERROR' }],
          },
        },
      }),
    ).toBe(false);
    expect(isAIEmployeeUsernameConflictError(new Error('network failure'))).toBe(false);
  });

  it('updates an employee by username and strips edit-only fields', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ update }),
    };

    await updateAIEmployee(apiClient, {
      username: 'atlas',
      nickname: 'Atlas',
      enabled: false,
      builtIn: true,
      about: 'custom prompt',
      _aboutMode: 'custom',
    });

    expect(update).toHaveBeenCalledWith({
      filterByTk: 'atlas',
      values: {
        username: 'atlas',
        nickname: 'Atlas',
        builtIn: true,
        about: 'custom prompt',
      },
    });
  });

  it('keeps selected tools when updating an employee', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ update }),
    };

    await updateAIEmployee(apiClient, {
      username: 'atlas',
      builtIn: false,
      skillSettings: {
        tools: [{ name: 'external_lookup', autoCall: true }],
      },
    });

    expect(update).toHaveBeenCalledWith({
      filterByTk: 'atlas',
      values: {
        username: 'atlas',
        builtIn: false,
        skillSettings: {
          tools: [{ name: 'external_lookup', autoCall: true }],
        },
      },
    });
  });

  it('keeps model settings from all form values when submitting', () => {
    expect(
      buildEmployeeSubmitValues(
        {
          username: 'atlas',
          nickname: 'Atlas',
        },
        {
          username: 'atlas',
          nickname: 'Atlas',
          modelSettings: {
            enabled: true,
            models: [{ llmService: 'openai', model: 'gpt-4.1' }],
          },
        },
      ),
    ).toMatchObject({
      username: 'atlas',
      nickname: 'Atlas',
      modelSettings: {
        enabled: true,
        models: [{ llmService: 'openai', model: 'gpt-4.1' }],
      },
    });
  });

  it('normalizes saved tool settings for display and submit', () => {
    expect(
      normalizeSkillSettings({
        skills: ['summarize', 123],
        tools: ['external_lookup', { name: 'notify_user', autoCall: true }, { autoCall: true }],
      }),
    ).toEqual({
      skills: ['summarize'],
      tools: [
        { name: 'external_lookup', autoCall: false },
        { name: 'notify_user', autoCall: true },
      ],
    });
  });

  it('uses null about when built-in employee keeps system default prompt', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ update }),
    };

    await updateAIEmployee(apiClient, {
      username: 'atlas',
      enabled: true,
      builtIn: true,
      about: 'old custom prompt',
      _aboutMode: 'system',
    });

    expect(update).toHaveBeenCalledWith({
      filterByTk: 'atlas',
      values: {
        username: 'atlas',
        builtIn: true,
        about: null,
      },
    });
  });

  it('deletes an employee by username', async () => {
    const destroy = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ destroy }),
    };

    await deleteAIEmployee(apiClient, 'atlas');

    expect(destroy).toHaveBeenCalledWith({
      filterByTk: 'atlas',
    });
  });

  it('updates the enabled switch by username', async () => {
    const update = vi.fn().mockResolvedValue({});
    const apiClient = {
      resource: () => ({ update }),
    };

    await updateAIEmployeeEnabled(apiClient, 'atlas', false);

    expect(update).toHaveBeenCalledWith({
      filterByTk: 'atlas',
      values: {
        enabled: false,
      },
    });
  });

  it('loads knowledge base feature state and options', async () => {
    const isKnowledgeBaseEnabledAction = vi.fn().mockResolvedValue({
      data: {
        data: { enabled: true },
      },
    });
    const list = vi.fn().mockResolvedValue({
      data: {
        data: [{ key: 'sales', name: 'Sales' }, { key: 'bad' }],
      },
    });
    const apiClient = {
      resource: (name: string) =>
        name === 'aiSettings' ? { isKnowledgeBaseEnabled: isKnowledgeBaseEnabledAction } : { list },
    };

    await expect(isKnowledgeBaseEnabled(apiClient)).resolves.toBe(true);
    await expect(listKnowledgeBases(apiClient)).resolves.toEqual([{ key: 'sales', name: 'Sales' }]);
    expect(list).toHaveBeenCalledWith({
      fields: ['key', 'name'],
      filter: {
        enabled: true,
      },
    });
  });
});
