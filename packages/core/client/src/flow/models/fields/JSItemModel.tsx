/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, FormItem, createSafeDocument, createSafeWindow, escapeT } from '@nocobase/flow-engine';
import React from 'react';
import { CodeEditor } from '../../components/code-editor';
import { CommonItemModel } from '../base/CommonItemModel';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';

/**
 * JSItemModel：表单里的自定义项（非字段绑定），可执行 JS 并渲染到容器中
 * - 行为与 JSBlockModel 类似，但用于表单网格中的“其他”项
 * - 默认提供 jsSettings.runJs 自动执行的步骤
 */
export class JSItemModel extends CommonItemModel {
  private _offResourceRefresh?: () => void;
  private _lastPage?: number;
  private _mountedOnce = false; // prevent first-mount double-run

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
   * 组件挂载后，如果容器引用已就绪，强制重跑一次自动流程以把 HTML 写入当前 DOM。
   * 解决某些情况下命中旧缓存导致新节点未写入而显示空白的问题。
   */
  protected onMount() {
    const resource = this.context.resource;
    if (resource) {
      // 订阅 refresh：仅在分页页码改变后触发 jsSettings
      this._lastPage = resource.getPage?.();
      const handler = () => {
        const current = resource?.getPage?.();
        if (current !== this._lastPage) {
          this.applyFlow('jsSettings');
        }
        this._lastPage = current;
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
    this._offResourceRefresh?.();
    this._offResourceRefresh = undefined;
  }
}

JSItemModel.define({
  label: escapeT('JS item'),
  // 明确指定 createModelOptions，避免在构建压缩后通过类名推断失败
  createModelOptions: {
    use: 'JSItemModel',
  },
  sort: 120,
});

JSItemModel.registerFlow({
  key: 'jsSettings',
  title: escapeT('JavaScript settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
            wrapperStyle: {
              position: 'fixed',
              inset: 8,
            },
          },
        },
      },
      uiMode: {
        type: 'embed',
        props: {
          styles: {
            body: {
              transform: 'translateX(0)',
            },
          },
        },
      },
      defaultParams(ctx) {
        return {
          version: 'v1',
          code: `
ctx.element.innerHTML = \`
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6;">
    <h3 style="color: #1890ff; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">JS Item</h3>
    <div style="color:#555">This area is rendered by your JavaScript code.</div>
  </div>
\`;`.trim(),
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() }, { version });
        });
      },
    },
  },
});
