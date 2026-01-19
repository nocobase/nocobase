/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, tExpr, createSafeWindow, createSafeDocument, createSafeNavigator } from '@nocobase/flow-engine';
import React, { useEffect, useRef } from 'react';
import { FieldModel } from '../base/FieldModel';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';
import { CodeEditor } from '../../components/code-editor';

const DEFAULT_CODE = `
function JsReadonlyField() {
  const React = ctx.React;
  const { prefix, suffix, overflowMode } = ctx.model?.props || {};
  const text = String(ctx.value ?? '');
  const whiteSpace = overflowMode === 'wrap' ? 'pre-line' : 'nowrap';

  return (
    <span style={{ whiteSpace }}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

ctx.render(<JsReadonlyField />);
`.trim();

/**
 * JS 字段（只读形态）：
 * - 通过 jsSettings.runJs 配置并执行 JS 代码；
 * - 支持在表格列/详情项中作为字段子模型使用；
 * - 在只读场景下可通过 ctx.value 读取当前值，ctx.record 读取当前行记录；
 * - 通过 ctx.element 直接操作渲染容器（经过 ElementProxy 包裹，带 XSS 保护）。
 */
export class JSFieldModel extends FieldModel {
  private _mountedOnce = false; // prevent first-mount double-run
  getInputArgs() {
    const field = this.context.collectionField;
    if (field?.isAssociationField?.()) {
      const targetCollection = field.targetCollection;
      const sourceCollection = this.context.blockModel?.collection;
      const sourceKey = field.sourceKey || sourceCollection?.filterTargetKey;
      const targetKey = field?.targetKey;
      const currentRecord = this.props?.value;

      return {
        collectionName: targetCollection?.name,
        associationName: sourceCollection?.name && field?.name ? `${sourceCollection.name}.${field.name}` : undefined,
        sourceId: this.context.record?.[sourceKey],
        filterByTk:
          currentRecord && typeof currentRecord === 'object' && !Array.isArray(currentRecord)
            ? currentRecord?.[targetKey]
            : undefined,
      };
    }

    return {
      sourceId: this.context.resource?.getSourceId?.(),
      filterByTk:
        this.context.collection && this.context.record
          ? this.context.collection.getFilterByTK(this.context.record)
          : undefined,
    };
  }

  /**
   * 在渲染前注入副作用：当 props.value 变化时，重新执行 jsSettings
   * 说明：fork 实例在表格逐行渲染时会复用该逻辑，确保按值更新。
   */
  useHooksBeforeRender() {
    // 单一副作用：当 code 或 value 变化，且二者都已就绪时执行一次
    // 通过记忆上次运行的输入，避免相同输入导致的重复执行
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const lastRunRef = useRef<{ code: string; value: any } | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const valueNow = this.props.value;
      const codeNow = (typeof codeParam === 'string' && codeParam.trim().length ? codeParam : DEFAULT_CODE).trim();
      const last = lastRunRef.current;
      if (last && last.code === codeNow && last.value === valueNow) return;
      lastRunRef.current = { code: codeNow, value: valueNow };
      this.applyFlow('jsSettings');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codeParam, this.props.value]);
  }

  /**
   * 渲染一个占位容器，供 JS 脚本写入内容
   */
  render() {
    return <span ref={this.context.ref} style={{ display: 'inline-block', maxWidth: '100%' }} />;
  }

  /**
   * 组件挂载后，如果容器引用已就绪，强制重跑一次 beforeRender flows 以把 HTML 写入当前 DOM。
   * 解决新增后因命中缓存或执行时机导致内容未写入的问题（与 JSBlock/JSItem 一致处理）。
   */
  protected onMount() {
    if (this._mountedOnce) {
      if (this.context.ref?.current) {
        this.rerender();
      }
    }
    this._mountedOnce = true;
  }
}

JSFieldModel.define({
  label: tExpr('JS field'),
  createModelOptions: {
    use: 'JSFieldModel',
  },
});

JSFieldModel.registerFlow({
  key: 'jsSettings',
  title: tExpr('JavaScript settings'),
  manual: true,
  steps: {
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
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
          code: DEFAULT_CODE,
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        // 暴露 element 与 value 到运行上下文
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          ctx.defineProperty('value', {
            get: () => ctx.model.props?.value,
            cache: false,
          });
          const navigator = createSafeNavigator();
          await ctx.runjs(
            code,
            { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
            { version },
          );
        });
      },
    },
  },
});
