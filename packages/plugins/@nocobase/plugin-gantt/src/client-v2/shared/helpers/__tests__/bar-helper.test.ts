/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, test } from 'vitest';
import { convertToBarTasks } from '../bar-helper';
import type { Task } from '../../types/public-types';

describe('convertToBarTasks', () => {
  test('keeps a minimum width for short tasks at the left edge', () => {
    const tasks: Task[] = [
      {
        id: '1',
        type: 'task',
        name: 'Short task',
        start: new Date('2026-05-25T00:00:00'),
        end: new Date('2026-05-25T02:00:00'),
        progress: 0,
      },
    ];

    const dates = [new Date('2026-05-25T00:00:00'), new Date('2026-05-26T00:00:00'), new Date('2026-05-27T00:00:00')];

    const [barTask] = convertToBarTasks(
      tasks,
      dates,
      80,
      40,
      20,
      2,
      8,
      false,
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#1677ff',
      '#52c41a',
      '#52c41a',
      '#1677ff',
      '#1677ff',
      '#faad14',
      '#faad14',
    );

    expect(barTask.typeInternal).toBe('smalltask');
    expect(barTask.x1).toBe(0);
    expect(barTask.x2 - barTask.x1).toBe(16);
  });
});
