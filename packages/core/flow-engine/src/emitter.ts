/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class Emitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};
  private paused = false;

  // TODO: this was used only by replaceModel, better find a new approach and remove this
  setPaused(paused: boolean) {
    this.paused = paused;
  }

  on(event: string, callback: (...args: any[]) => void) {
    (this.events[event] ||= []).push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.events[event] = (this.events[event] || []).filter((fn) => fn !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (this.paused) {
      return;
    }
    (this.events[event] || []).forEach((fn) => fn(...args));
  }

  /**
   * 异步触发事件：按监听器注册顺序依次（串行）等待执行完成。
   * - 若某个监听器抛错/Promise reject，将中断后续执行并将异常向上传递（便于调用方统一处理）。
   * - 当前不提供并行触发能力；如需并发处理，请在监听器内部自行管理（例如在回调内使用 Promise.all）。
   */
  async emitAsync(event: string, ...args: any[]): Promise<void> {
    if (this.paused) return;
    const listeners = (this.events[event] || []).slice(); // 防止触发过程中被修改
    for (const fn of listeners) {
      // 兼容同步/异步监听器
      await fn(...args);
    }
  }
}
