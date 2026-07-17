/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resetRunJSRuntimeElement } from '@nocobase/flow-engine';
import type { JSPageRuntimeFacade } from '@nocobase/light-extension-sdk/client';
import { readRunJSRuntimeError, type RunJSRuntimeError } from '../../../components/runjs-source';

export interface JSPageRuntimeState {
  runId: number;
  running: boolean;
  error: RunJSRuntimeError | null;
}

export interface JSPageRuntimeRunContext {
  readonly runId: number;
  readonly element: HTMLElement;
  readonly page: JSPageRuntimeFacade;
  isCurrent(): boolean;
}

export interface JSPageRuntimeControllerOptions<TResolved> {
  uid: string;
  isActive(): boolean;
  resolve(context: JSPageRuntimeRunContext): Promise<TResolved>;
  execute(resolved: TResolved, context: JSPageRuntimeRunContext): Promise<void>;
  setDocumentTitle(title: string): void;
  createRuntimeElement?(): HTMLElement;
  onStateChange?(state: JSPageRuntimeState): void;
}

type ActiveRun = {
  id: number;
  followUp: boolean;
  host: HTMLElement;
  element: HTMLElement;
};

export class JSPageRuntimeController<TResolved> {
  private options: JSPageRuntimeControllerOptions<TResolved> | null;
  private hostElement: HTMLElement | null = null;
  private runtimeElement: HTMLElement | null = null;
  private activeRun: ActiveRun | null = null;
  private followUpRequested = false;
  private disposed = false;
  private generation = 0;
  private currentState: JSPageRuntimeState = {
    runId: 0,
    running: false,
    error: null,
  };

  constructor(options: JSPageRuntimeControllerOptions<TResolved>) {
    this.options = options;
  }

  get state(): JSPageRuntimeState {
    return { ...this.currentState };
  }

  setElement(element: HTMLElement | null): void {
    if (this.disposed || !element) {
      return;
    }
    this.hostElement = element;
    if (this.runtimeElement && !this.activeRun && this.runtimeElement.parentElement !== element) {
      element.replaceChildren(this.runtimeElement);
    }
  }

  run(): Promise<void> {
    if (!this.canRun()) {
      return Promise.resolve();
    }
    this.followUpRequested = false;
    return this.startRun(false);
  }

  /**
   * A refresh while idle runs immediately. During a primary run it queues one follow-up and resolves immediately,
   * so page code can safely await ctx.page.refresh(). A refresh from the follow-up is ignored to prevent loops.
   */
  refresh(): Promise<void> {
    if (!this.canRun()) {
      return Promise.resolve();
    }
    if (!this.activeRun) {
      return this.startRun(false);
    }
    if (!this.activeRun.followUp) {
      this.followUpRequested = true;
    }
    return Promise.resolve();
  }

  deactivate(): void {
    if (this.disposed) {
      return;
    }
    this.generation += 1;
    this.followUpRequested = false;
    const activeElement = this.activeRun?.element;
    this.activeRun = null;
    if (activeElement) {
      resetRunJSRuntimeElement(activeElement);
      if (this.runtimeElement === activeElement) {
        this.runtimeElement = null;
      }
    }
    this.updateState({ runId: this.generation, running: false, error: null });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.generation += 1;
    this.followUpRequested = false;
    this.activeRun = null;
    if (this.runtimeElement) {
      resetRunJSRuntimeElement(this.runtimeElement);
    }
    this.hostElement?.replaceChildren();
    this.runtimeElement = null;
    this.hostElement = null;
    this.updateState({ runId: this.generation, running: false, error: null });
    this.options = null;
  }

  private canRun(): boolean {
    return !this.disposed && Boolean(this.hostElement) && Boolean(this.options?.isActive());
  }

  private async startRun(followUp: boolean): Promise<void> {
    const options = this.options;
    const host = this.hostElement;
    if (!options || !host || this.disposed || !options.isActive()) {
      return;
    }

    const runId = ++this.generation;
    const previousElement = this.runtimeElement;
    if (previousElement) {
      resetRunJSRuntimeElement(previousElement);
    }
    host.replaceChildren();

    const element = options.createRuntimeElement?.() || document.createElement('div');
    const activeRun: ActiveRun = { id: runId, followUp, host, element };
    this.runtimeElement = element;
    this.activeRun = activeRun;
    this.updateState({ runId, running: true, error: null });

    const context: JSPageRuntimeRunContext = {
      runId,
      element,
      page: this.createPageFacade(runId),
      isCurrent: () => this.isCurrent(activeRun),
    };

    try {
      const resolved = await options.resolve(context);
      if (!this.isCurrent(activeRun)) {
        resetRunJSRuntimeElement(element);
        return;
      }

      await options.execute(resolved, context);
      if (!this.isCurrent(activeRun)) {
        resetRunJSRuntimeElement(element);
        return;
      }

      host.replaceChildren(element);
      this.updateState({ runId, running: false, error: null });
    } catch (error) {
      if (!this.isCurrent(activeRun)) {
        resetRunJSRuntimeElement(element);
        return;
      }

      resetRunJSRuntimeElement(element);
      if (this.runtimeElement === element) {
        this.runtimeElement = null;
      }
      host.replaceChildren();
      const normalizedError = readRunJSRuntimeError(error);
      this.updateState({ runId, running: false, error: normalizedError });
      throw normalizedError;
    } finally {
      if (this.activeRun?.id === runId) {
        this.activeRun = null;
        const shouldFollowUp = this.followUpRequested && !followUp && this.canRun();
        this.followUpRequested = false;
        if (shouldFollowUp) {
          this.startRun(true).catch(() => undefined);
        }
      }
    }
  }

  private createPageFacade(runId: number): JSPageRuntimeFacade {
    const controller = this;
    const uid = this.options?.uid || '';
    return {
      uid,
      get active() {
        return Boolean(controller.options?.isActive());
      },
      refresh() {
        if (controller.activeRun?.id !== runId) {
          return Promise.resolve();
        }
        return controller.refresh();
      },
      setDocumentTitle(title: string) {
        if (title && controller.activeRun?.id === runId && controller.isCurrent(controller.activeRun)) {
          controller.options?.setDocumentTitle(title);
        }
      },
    };
  }

  private isCurrent(run: ActiveRun): boolean {
    return (
      !this.disposed &&
      this.activeRun?.id === run.id &&
      this.hostElement === run.host &&
      Boolean(this.options?.isActive())
    );
  }

  private updateState(state: JSPageRuntimeState): void {
    this.currentState = state;
    this.options?.onStateChange?.({ ...state });
  }
}
