/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

type AbortHandler = {
  abort(reason?: string): void;
};

export default class RunningExecutionRegistry {
  private readonly executions = new Map<string, Set<AbortHandler>>();

  register(executionId: number | string, handler: AbortHandler) {
    const key = String(executionId);
    const handlers = this.executions.get(key) ?? new Set<AbortHandler>();
    handlers.add(handler);
    this.executions.set(key, handlers);

    return () => this.unregister(executionId, handler);
  }

  unregister(executionId: number | string, handler?: AbortHandler) {
    const key = String(executionId);
    if (!handler) {
      this.executions.delete(key);
      return;
    }

    const handlers = this.executions.get(key);
    handlers?.delete(handler);
    if (!handlers?.size) {
      this.executions.delete(key);
    }
  }

  abort(executionId: number | string, reason?: string) {
    const handlers = this.executions.get(String(executionId));
    if (!handlers?.size) {
      return false;
    }

    for (const handler of handlers) {
      handler.abort(reason);
    }
    return true;
  }
}
