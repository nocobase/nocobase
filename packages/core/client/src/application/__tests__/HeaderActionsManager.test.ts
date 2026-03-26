/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { HeaderActionsManager } from '../HeaderActionsManager';

const createItem = (name: string, options: Record<string, any> = {}) => ({
  name,
  componentLoader: vi.fn().mockResolvedValue(name),
  ...options,
});

describe('HeaderActionsManager', () => {
  it('should register one or multiple actions and sort them correctly', () => {
    const manager = new HeaderActionsManager();

    manager.register(createItem('todo'));
    manager.register([createItem('inbox', { order: 301 }), createItem('asyncTasks', { order: 300 })]);

    expect(manager.getItems().map((item) => item.name)).toEqual(['todo', 'asyncTasks', 'inbox']);
  });

  it('should unregister one or multiple actions', () => {
    const manager = new HeaderActionsManager();

    manager.register([createItem('todo'), createItem('inbox'), createItem('asyncTasks')]);
    manager.unregister('inbox');
    expect(manager.getItems().map((item) => item.name)).toEqual(['todo', 'asyncTasks']);

    manager.unregister(['todo', 'asyncTasks']);
    expect(manager.getItems()).toEqual([]);
  });

  it('should filter visible actions by acl allow function', () => {
    const manager = new HeaderActionsManager();

    manager.register([
      createItem('todo', { snippet: '*' }),
      createItem('inbox', { snippet: 'pm.notification' }),
      createItem('asyncTasks', { snippet: 'pm.async-tasks' }),
    ]);

    expect(
      manager
        .resolveVisibleItems((snippet) => snippet === '*' || snippet === 'pm.async-tasks')
        .map((item) => item.name),
    ).toEqual(['todo', 'asyncTasks']);
  });

  it('should override same-name action and fallback after source unmount', async () => {
    const manager = new HeaderActionsManager();

    manager.register([
      {
        ...createItem('todo', { order: 100 }),
        sourceId: 'source-a',
        componentLoader: vi.fn().mockResolvedValue('TodoA'),
      } as any,
    ]);

    manager.register([
      {
        ...createItem('todo', { order: 200 }),
        sourceId: 'source-b',
        componentLoader: vi.fn().mockResolvedValue('TodoB'),
      } as any,
    ]);

    expect(await manager.getItems()[0].componentLoader()).toBe('TodoB');

    manager.unregisterBySource('source-b');
    expect(await manager.getItems()[0].componentLoader()).toBe('TodoA');
  });
});
