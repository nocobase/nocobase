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
}
