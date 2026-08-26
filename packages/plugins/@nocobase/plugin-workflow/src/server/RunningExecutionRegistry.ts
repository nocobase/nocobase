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
  private readonly executions = new Map<string, AbortHandler>();

  register(executionId: number | string, handler: AbortHandler) {
    this.executions.set(String(executionId), handler);
  }

  unregister(executionId: number | string) {
    this.executions.delete(String(executionId));
  }

  abort(executionId: number | string, reason?: string) {
    const handler = this.executions.get(String(executionId));
    if (!handler) {
      return false;
    }

    handler.abort(reason);
    return true;
  }
}
