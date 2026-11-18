import { describe, expect, it, vi } from 'vitest';
import {
  DatabaseTaskHooks,
  databaseTaskHooksToken,
} from '../src/database/index.js';
import { createTaskServiceResolver } from '../src/database/task-container.js';
import { ServiceContainer } from '@nocobase/service-provider';

describe('database task hook registration', () => {
  it('is isolated, rejects duplicate or blank names and never calls preparation during registration', () => {
    const first = new DatabaseTaskHooks();
    const second = new DatabaseTaskHooks();
    const beforeTasks = vi.fn(async () => {});
    first.register({ name: 'resources', beforeTasks });
    expect(second.snapshot()).toEqual([]);
    expect(beforeTasks).not.toHaveBeenCalled();
    expect(() => first.register({ name: 'resources', beforeTasks })).toThrow(
      'already registered',
    );
    expect(() => first.register({ name: ' ', beforeTasks })).toThrow(
      'must not be empty',
    );
  });

  it('freezes registration snapshots and captures names and callbacks without losing their receiver', async () => {
    const hooks = new DatabaseTaskHooks();
    const original = {
      name: 'original',
      calls: 0,
      async beforeTasks() {
        this.calls++;
      },
    };
    hooks.register(original);
    const snapshot = hooks.snapshot();
    original.name = 'changed';
    hooks.register({ name: 'later', async beforeTasks() {} });
    expect(snapshot.map((hook) => hook.name)).toEqual(['original']);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot[0])).toBe(true);
    await snapshot[0].beforeTasks({ resetConnections: [] });
    expect(original.calls).toBe(1);
  });

  it('does not expose registration controls to migrations or seeds', () => {
    const container = new ServiceContainer();
    container.instance(databaseTaskHooksToken, new DatabaseTaskHooks());
    const restricted = createTaskServiceResolver(container);
    expect(restricted.has(databaseTaskHooksToken)).toBe(false);
    expect(() => restricted.resolve(databaseTaskHooksToken)).toThrow(
      'not allowed',
    );
  });
});
