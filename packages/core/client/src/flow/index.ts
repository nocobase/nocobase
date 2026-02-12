/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { Plugin } from '../application/Plugin';
import { IconPicker } from '../schema-component/antd/icon-picker';
import * as actions from './actions';
import { DefaultValue } from './components/DefaultValue';
import { FlowModelRepository } from './FlowModelRepository';
import { FlowRoute } from './FlowPage';
import * as models from './models';
import * as filterFormActions from './models/blocks/filter-manager/flow-actions';
import { DynamicFlowsIcon } from './components/DynamicFlowsIcon';
import { Markdown } from './common/Markdown/Markdown';
import { LiquidEngine } from './common/Liquid';
import type { PreviewRunJSResult } from './components/code-editor/runjsDiagnostics';

export class PluginFlowEngine extends Plugin {
  async load() {
    this.app.addComponents({ FlowRoute });
    this.app.flowEngine.setModelRepository(new FlowModelRepository(this.app));
    const filteredModels = Object.fromEntries(
      Object.entries(models).filter(
        ([, ModelClass]) => typeof ModelClass === 'function' && ModelClass.prototype instanceof FlowModel,
      ),
    ) as Record<string, typeof FlowModel>;
    this.flowEngine.registerModels(filteredModels);
    this.flowEngine.registerActions(actions);
    this.flowEngine.registerActions(filterFormActions);
    this.flowEngine.flowSettings.registerComponents({
      IconPicker,
      DefaultValue,
    });

    // 动态流编辑入口
    this.flowEngine.flowSettings.addToolbarItem({
      key: 'dynamic-flows-editor',
      component: DynamicFlowsIcon,
      visible(model) {
        return model.getEvents().size > 0;
      },
      sort: 0,
    });
    // 实例化一个全局 Markdown 解析器
    const markdownInstance = new Markdown();
    this.flowEngine.context.defineProperty('markdown', {
      get: () => markdownInstance,
    });

    // 创建全局实例
    const liquidInstance = new LiquidEngine({ ctx: this.flowEngine.context });

    // 注册到全局上下文
    this.flowEngine.context.defineProperty('liquid', {
      get: () => liquidInstance,
    });

    this.flowEngine.context.defineMethod(
      'previewRunJS',
      async function (this: any, code: string): Promise<PreviewRunJSResult> {
        const mod = await import('./components/code-editor/runjsDiagnostics');
        return await mod.previewRunJS(String(code ?? ''), this);
      },
      {
        description: 'Preview/diagnose a RunJS snippet (lint + sandbox execution).',
        detail: '(code: string) => Promise<{ success: boolean; message: string }>',
        params: [{ name: 'code', type: 'string', description: 'RunJS code to preview.' }],
        returns: { type: 'Promise<PreviewRunJSResult>', description: 'Preview result.' },
        completion: { insertText: "await ctx.previewRunJS('console.log(1)')" },
      },
    );
  }
}

// Export all models for external use
export * from './components/filter';
export * from './components/code-editor';
export * from './components/TextAreaWithContextSelector';
export * from './components/SkeletonFallback';
export * from './FlowModelRepository';
export * from './FlowPage';
export * from './models';
export * from './utils';
export * from './actions';
export { openViewFlow } from './flows/openViewFlow';
export { editMarkdownFlow } from './flows/editMarkdownFlow';

export { TextAreaWithContextSelector } from './components/TextAreaWithContextSelector';
