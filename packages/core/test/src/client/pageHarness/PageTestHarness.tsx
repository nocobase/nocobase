/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * PageTestHarness implementation
 */

import React from 'react';
import type { RenderResult } from '@testing-library/react';
import type { Application } from '@nocobase/client';
import type { FlowModel } from '@nocobase/flow-engine';
import type { IPageTestHarness, RenderHooks, NormalizedPageSpec } from './types';

/**
 * Page test harness class
 * Provides utilities for testing page models
 */
export class PageTestHarness implements IPageTestHarness {
  private app: Application;
  private spec: NormalizedPageSpec;
  private rootPageModel: any;
  private renderResult?: RenderResult;
  private isRendered = false;

  constructor(app: Application, spec: NormalizedPageSpec) {
    this.app = app;
    this.spec = spec;
  }

  /**
   * Set the root page model after it's created
   */
  setRootPageModel(model: any): void {
    this.rootPageModel = model;
  }

  /**
   * Render the application
   */
  async render(hooks?: RenderHooks): Promise<RenderResult> {
    if (hooks?.beforeRender) {
      await hooks.beforeRender();
    }

    // Import render function dynamically to avoid circular dependencies
    const { render } = await import('@nocobase/test/client');
    const { AppComponent } = await import('@nocobase/client');
    const { FlowModelRenderer } = await import('@nocobase/flow-engine');

    this.renderResult = render(
      <AppComponent app={this.app}>
        <FlowModelRenderer model={this.rootPageModel} />
      </AppComponent>,
    );
    this.isRendered = true;

    if (hooks?.afterRender) {
      await hooks.afterRender();
    }

    return this.renderResult;
  }

  /**
   * Get the Application instance
   */
  getApp(): Application {
    return this.app;
  }

  /**
   * Get the root page model
   */
  getRootPageModel(): any {
    if (!this.rootPageModel) {
      throw new Error('Root page model not available. Make sure harness is properly initialized.');
    }
    return this.rootPageModel;
  }

  /**
   * Get a tab model by key or title
   */
  getTabModel(keyOrTitle: string): any {
    const rootPage = this.getRootPageModel();

    // 获取 tabs
    const tabs = rootPage.subModels?.tabs || [];

    // Try to find by key first
    let tab = tabs.find((t: any) => t.key === keyOrTitle || t.uid === keyOrTitle);

    // Fall back to title
    if (!tab) {
      // title 可能在 stepParams 中
      tab = tabs.find((t: any) => {
        const title = t.stepParams?.default?.step1?.title || t.props?.title || t.title;
        return title === keyOrTitle;
      });
    }

    if (!tab) {
      throw new Error(`Tab not found: ${keyOrTitle}`);
    }

    return tab;
  }

  /**
   * Find a block model by predicate or key
   */
  findBlock(predicate: ((model: FlowModel) => boolean) | string): FlowModel | undefined {
    const rootPage = this.getRootPageModel();

    if (typeof predicate === 'string') {
      const key = predicate;
      return this.findBlockByKey(rootPage, key);
    }

    return this.findBlockByPredicate(rootPage, predicate);
  }

  /**
   * Find block by key recursively
   */
  private findBlockByKey(model: any, key: string): FlowModel | undefined {
    if (model.id === key || model.key === key || model.uid === key) {
      return model;
    }

    if (model.subModels) {
      // subModels 是对象，需要遍历其值
      const subModelKeys = Object.keys(model.subModels);
      for (const subKey of subModelKeys) {
        const subModel = model.subModels[subKey];
        // subModel 可能是数组或单个对象
        if (Array.isArray(subModel)) {
          for (const item of subModel) {
            const found = this.findBlockByKey(item, key);
            if (found) return found;
          }
        } else if (subModel) {
          const found = this.findBlockByKey(subModel, key);
          if (found) return found;
        }
      }
    }

    return undefined;
  }

  /**
   * Find block by predicate recursively
   */
  private findBlockByPredicate(model: any, predicate: (model: FlowModel) => boolean): FlowModel | undefined {
    if (predicate(model)) {
      return model;
    }

    if (model.subModels) {
      // subModels 是对象，需要遍历其值
      const subModelKeys = Object.keys(model.subModels);
      for (const subKey of subModelKeys) {
        const subModel = model.subModels[subKey];
        // subModel 可能是数组或单个对象
        if (Array.isArray(subModel)) {
          for (const item of subModel) {
            const found = this.findBlockByPredicate(item, predicate);
            if (found) return found;
          }
        } else if (subModel) {
          const found = this.findBlockByPredicate(subModel, predicate);
          if (found) return found;
        }
      }
    }

    return undefined;
  }

  /**
   * Open a tab by key
   */
  async openTab(key: string): Promise<void> {
    const tab = this.getTabModel(key);
    const rootPage = this.getRootPageModel();

    if (rootPage.setActiveTab) {
      await rootPage.setActiveTab(tab.key);
    } else {
      throw new Error('Root page model does not support tab switching');
    }
  }

  /**
   * Wait for a tab to be available
   */
  async waitForTab(key: string): Promise<void> {
    // Simple implementation - can be enhanced with actual waiting logic
    return new Promise((resolve) => {
      setTimeout(() => {
        this.getTabModel(key);
        resolve();
      }, 0);
    });
  }

  /**
   * Dispatch a flow on a model
   */
  async dispatchFlow(modelUid: string, flowKey: string, params?: Record<string, any>): Promise<any> {
    const model = this.findBlock((m) => m.uid === modelUid || (m as any).uid === modelUid);

    if (!model) {
      throw new Error(`Model not found: ${modelUid}`);
    }

    if (typeof (model as any).dispatchFlow === 'function') {
      return await (model as any).dispatchFlow(flowKey, params);
    } else {
      throw new TypeError(`Model ${modelUid} does not support flow dispatching`);
    }
  }

  /**
   * Press an action on a block
   */
  async press(action: { blockKey: string; action: string }): Promise<void> {
    const block = this.findBlock(action.blockKey);

    if (!block) {
      throw new Error(`Block not found: ${action.blockKey}`);
    }

    // Try to find and trigger the action
    if (typeof (block as any).triggerAction === 'function') {
      await (block as any).triggerAction(action.action);
    } else {
      throw new TypeError(`Block ${action.blockKey} does not support action triggering`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.renderResult?.unmount) {
      this.renderResult.unmount();
    }

    // Cleanup app resources
    if (this.app && typeof (this.app as any).destroy === 'function') {
      await (this.app as any).destroy();
    }

    this.isRendered = false;
  }

  /**
   * Debug helper - returns internal state
   */
  debug(): any {
    return {
      spec: this.spec,
      rootPageModel: this.rootPageModel,
      isRendered: this.isRendered,
      app: this.app,
    };
  }
}
