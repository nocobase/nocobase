/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { normalizeTriggerTaskOptions } from '../utils';
import type { AIEmployee } from '../../types';

describe('normalizeTriggerTaskOptions', () => {
  it('keeps an AIEmployee object unchanged', async () => {
    const aiEmployee: AIEmployee = { username: 'nathan', nickname: 'Nathan' };
    const options = { aiEmployee, tasks: [{ title: 'Write' }], chatBoxUid: 'chat-box-1' };

    await expect(normalizeTriggerTaskOptions(options)).resolves.toBe(options);
  });

  it('resolves a string AI employee by exact username from the repository cache', async () => {
    const nathan: AIEmployee = { username: 'nathan', nickname: 'Nathan' };
    const getAIEmployees = vi.fn().mockResolvedValue([{ username: 'nathan-admin', nickname: 'Nathan Admin' }, nathan]);

    await expect(
      normalizeTriggerTaskOptions(
        { aiEmployee: 'nathan', tasks: [{ title: 'Write' }] },
        {
          aiConfigRepository: {
            getAIEmployees,
          },
        },
      ),
    ).resolves.toEqual({
      aiEmployee: nathan,
      tasks: [{ title: 'Write' }],
    });
    expect(getAIEmployees).toHaveBeenCalledTimes(1);
  });

  it('falls back to aiEmployees:listByUser when no repository is provided', async () => {
    const nathan: AIEmployee = { username: 'nathan', nickname: 'Nathan' };
    const listByUser = vi.fn().mockResolvedValue({
      data: {
        data: [nathan],
      },
    });

    await expect(
      normalizeTriggerTaskOptions(
        { aiEmployee: 'nathan', tasks: [{ title: 'Write' }] },
        {
          apiClient: {
            resource: () => ({
              listByUser,
            }),
          },
        },
      ),
    ).resolves.toEqual({
      aiEmployee: nathan,
      tasks: [{ title: 'Write' }],
    });
    expect(listByUser).toHaveBeenCalledTimes(1);
  });

  it('falls back to aiEmployees:listByUser when the repository cache has no exact username match', async () => {
    const nathan: AIEmployee = { username: 'nathan', nickname: 'Nathan' };
    const listByUser = vi.fn().mockResolvedValue({
      data: {
        data: [nathan],
      },
    });

    await expect(
      normalizeTriggerTaskOptions(
        { aiEmployee: 'nathan', tasks: [{ title: 'Write' }] },
        {
          aiConfigRepository: {
            getAIEmployees: vi.fn().mockResolvedValue([{ username: 'mira' }]),
          },
          apiClient: {
            resource: () => ({
              listByUser,
            }),
          },
        },
      ),
    ).resolves.toEqual({
      aiEmployee: nathan,
      tasks: [{ title: 'Write' }],
    });
    expect(listByUser).toHaveBeenCalledTimes(1);
  });

  it('returns null when a string AI employee is not accessible to the current user', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      normalizeTriggerTaskOptions(
        { aiEmployee: 'nathan', tasks: [{ title: 'Write' }] },
        {
          aiConfigRepository: {
            getAIEmployees: vi.fn().mockResolvedValue([{ username: 'mira' }]),
          },
        },
      ),
    ).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      '[plugin-ai] AI employee "nathan" was not found or is not accessible to the current user.',
    );

    warn.mockRestore();
  });
});
