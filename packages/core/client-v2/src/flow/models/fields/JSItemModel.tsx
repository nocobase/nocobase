/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, tExpr, type StepDefinition } from '@nocobase/flow-engine';
import React from 'react';
import { CommonItemModel } from '../base/CommonItemModel';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';
import {
  createJSItemRunJsUISchema,
  createJSItemEmbeddedEditorUIMode,
  createJSItemSourceBindingStep,
  createJSItemSourceModeStep,
  getJSItemRuntimeFlowSettingSteps,
  INLINE_SOURCE_MODE,
  resetJSItemRuntimeElement,
  runJSItemRuntime,
} from './jsItemLightExtensionRuntime';

/**
 * JSItemModel：表单里的自定义项（非字段绑定），可执行 JS 并渲染到容器中
 * - 行为与 JSBlockModel 类似，但用于表单网格中的“其他”项
 * - 默认提供 jsSettings.runJs 自动执行的步骤
 */
export class JSItemModel extends CommonItemModel {
  private _offResourceRefresh?: () => void;
  private _mountedOnce = false; // prevent first-mount double-run

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'jsSettings') {
      return undefined;
    }

    return getJSItemRuntimeFlowSettingSteps(this);
  }

  getInputArgs() {
    const inputArgs = {};
    if (this.context.resource) {
      const sourceId = this.context.resource.getSourceId();
      if (sourceId) {
        inputArgs['sourceId'] = sourceId;
      }
    }
    if (this.context.collection && this.context.record) {
      const filterByTk = this.context.collection.getFilterByTK(this.context.record);
      if (filterByTk) {
        inputArgs['filterByTk'] = filterByTk;
      }
    }
    return inputArgs;
  }

  render() {
    return (
      <FormItem shouldUpdate showLabel={false}>
        <div ref={this.context.ref} />
      </FormItem>
    );
  }

  /**
   * 组件挂载后，如果容器引用已就绪，强制重跑一次 beforeRender 以把 HTML 写入当前 DOM。
   * 解决某些情况下命中旧缓存导致新节点未写入而显示空白的问题。
   */
  protected onMount() {
    const resource = this.context.resource;
    if (resource) {
      // 订阅 refresh：详情记录被编辑后通常会触发 refresh，需要重跑 jsSettings
      const handler = () => {
        this.applyFlow('jsSettings');
      };
      resource.on('refresh', handler);
      this._offResourceRefresh = () => {
        resource.off('refresh', handler);
      };
    }

    if (this._mountedOnce) {
      if (this.context.ref?.current) {
        this.rerender();
      }
    }
    this._mountedOnce = true;
  }

  protected onUnmount(): void {
    if (this.context.ref?.current) {
      resetJSItemRuntimeElement(this.context.ref.current);
    }
    this._offResourceRefresh?.();
    this._offResourceRefresh = undefined;
  }
}

JSItemModel.define({
  label: tExpr('JS item'),
  // 明确指定 createModelOptions，避免在构建压缩后通过类名推断失败
  createModelOptions: {
    use: 'JSItemModel',
  },
  sort: 120,
});

JSItemModel.registerFlow({
  key: 'jsSettings',
  title: tExpr('JavaScript settings'),
  steps: {
    sourceMode: createJSItemSourceModeStep(),
    sourceBinding: createJSItemSourceBindingStep(),
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: createJSItemRunJsUISchema({ scene: 'block' }),
      uiMode: createJSItemEmbeddedEditorUIMode,
      defaultParams(ctx) {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code: `
function JsItem() {
  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", lineHeight: 1.6 }}>
      <h3 style={{ color: '#1890ff', margin: '0 0 12px 0', fontSize: 18, fontWeight: 600 }}>JS Item</h3>
      <div style={{ color: '#555' }}>This area is rendered by your JavaScript code.</div>
    </div>
  );
}

ctx.render(<JsItem />);
`.trim(),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.onRefReady(ctx.ref, async (element) => {
          await runJSItemRuntime({
            ctx,
            params: params || {},
            runJs: {
              code,
              version,
            },
            element,
          });
        });
      },
    },
  },
});
