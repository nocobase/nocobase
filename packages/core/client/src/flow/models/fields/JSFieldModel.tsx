/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, escapeT, createSafeWindow, createSafeDocument } from '@nocobase/flow-engine';
import React, { useEffect, useRef } from 'react';
import { FieldModel } from '../base/FieldModel';
import { CodeEditor } from '../../components/code-editor';

/**
 * JS 字段（只读形态）：
 * - 通过 jsSettings.runJs 配置并执行 JS 代码；
 * - 支持在表格列/详情项中作为字段子模型使用；
 * - 在只读场景下可通过 ctx.value 读取当前值，ctx.record 读取当前行记录；
 * - 通过 ctx.element 直接操作渲染容器（经过 ElementProxy 包裹，带 XSS 保护）。
 */
export class JSFieldModel extends FieldModel {
  /**
   * 在渲染前注入副作用：当 props.value 变化时，重新执行 jsSettings
   * 说明：fork 实例在表格逐行渲染时会复用该逻辑，确保按值更新。
   */
  useHooksBeforeRender() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const valueRef = useRef(this.props.value);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (valueRef.current !== this.props.value) {
        valueRef.current = this.props.value;
        // 仅重新执行本模型的 JS 配置步骤
        this.applyFlow('jsSettings');
      }
      // 当代码在设置态被修改时，FlowEngine 会因 stepParams 变化自动触发一次自动流程，无需重复监听
      // 这里仅监听值变化
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [this.props.value]);
  }

  /**
   * 渲染一个占位容器，供 JS 脚本写入内容
   */
  render() {
    return <span ref={this.context.ref} style={{ display: 'inline-block', maxWidth: '100%' }} />;
  }
}

JSFieldModel.define({
  label: escapeT('JS field'),
});

JSFieldModel.registerFlow({
  key: 'jsSettings',
  title: escapeT('JavaScript settings'),
  steps: {
    runJs: {
      title: escapeT('Write JavaScript'),
      uiSchema: {
        code: {
          type: 'string',
          title: escapeT('Write JavaScript'),
          'x-decorator': 'FormItem',
          'x-component': CodeEditor,
          'x-component-props': {
            minHeight: '320px',
            theme: 'light',
            enableLinter: true,
          },
        },
      },
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
      defaultParams(ctx) {
        const fieldTitle = ctx.collectionField?.title || 'field';
        return {
          code: `const value = ctx.value;\nctx.element.innerHTML = \`<span style="color:#1890ff;">${'${'}String(value ?? '')}</span>\`;\n\n// 你也可以使用异步逻辑：\n// await ctx.runjs('return 1+1');\n`,
        };
      },
      async handler(ctx, params) {
        const { code = '' } = params || {};
        // 暴露 element 与 value 到运行上下文
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          ctx.defineProperty('value', {
            get: () => ctx.model.props?.value,
            cache: false,
          });
          await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
        });
      },
    },
  },
});
