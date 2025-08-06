/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import 'ses';

export interface JSRunnerOptions {
  timeoutMs?: number;
  globals?: Record<string, any>;
}

export class JSRunner {
  private globals: Record<string, any>;
  private timeoutMs: number;

  constructor(options: JSRunnerOptions = {}) {
    this.globals = { console, setTimeout, clearTimeout, ...(options.globals || {}) };
    this.timeoutMs = options.timeoutMs ?? 5000; // 默认 5 秒超时
  }

  /**
   * 注册单个变量或函数
   */
  register(name: string, value: any): void {
    this.globals[name] = value;
  }

  /**
   * 异步运行代码，带错误处理和超时机制
   */
  async run(code: string): Promise<{
    success: boolean;
    value?: any;
    error?: any;
    timeout?: boolean;
  }> {
    const wrapped = `(async () => {
      try {
        ${code};
      } catch (e) {
        throw e;
      }
    })()`;

    const compartment = new Compartment(this.globals);

    try {
      const task = compartment.evaluate(wrapped);
      const timeoutPromise = new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('Execution timed out')), this.timeoutMs),
      );
      const result = await Promise.race([task, timeoutPromise]);
      return { success: true, value: result };
    } catch (err) {
      return {
        success: false,
        error: err,
        timeout: err.message === 'Execution timed out',
      };
    }
  }
}
