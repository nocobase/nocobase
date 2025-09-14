/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, escapeT, createSafeDocument, createSafeWindow } from '@nocobase/flow-engine';
import React, { useEffect, useMemo, useRef } from 'react';
import { Input } from 'antd';
import { FormFieldModel } from './FormFieldModel';
import { CodeEditor } from '../../components/code-editor';

const JSFormRuntime: React.FC<{
  model: JSEditableFieldModel;
  value?: any;
  onChange?: (v: any) => void;
  disabled?: boolean;
  readOnly?: boolean;
}> = ({ model, value, onChange, disabled, readOnly }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  // 统一获取&裁剪脚本代码，避免重复 trim 判定
  const scriptCode = useMemo(() => {
    const raw = model.getStepParams('jsSettings', 'runJs')?.code;
    return typeof raw === 'string' ? raw.trim() : '';
  }, [model.stepParams]);

  // 1) 每次渲染仅更新 ctx 能力（元素/读写/状态），不执行脚本
  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const ctx = model.context;

    // 暴露 element / value 读写能力（getValue 始终返回最新值）
    ctx.defineProperty('element', { get: () => new ElementProxy(element) });
    ctx.defineProperty('getValue', {
      value: () => value,
    });
    ctx.defineProperty('setValue', {
      value: (v) => {
        try {
          onChange?.(v);
          // 同步表单上下文（双保险）
          const name = model.props?.name;
          if (name && Array.isArray(name)) {
            model.context.form?.setFieldValue?.(name, v);
          }
        } catch (e) {
          // ignore
        }
      },
    });
    ctx.defineProperty('namePath', { get: () => model.props?.name });
    ctx.defineProperty('disabled', { get: () => !!disabled });
    ctx.defineProperty('readOnly', { get: () => !!readOnly });
  }, [value, disabled, readOnly, model, onChange]);

  // 2) 仅在代码变化时执行脚本，避免输入引发的 DOM 重建导致失焦
  useEffect(() => {
    if (!containerRef.current || !scriptCode) return;
    const ctx = model.context;
    (async () => {
      try {
        await ctx.runjs(scriptCode, { window: createSafeWindow(), document: createSafeDocument() });
      } catch (e) {
        // 控制台输出，避免影响表单渲染
        console.error('JSEditableFieldModel runjs error:', e);
      }
    })();
  }, [scriptCode]);

  // 3) 值变化时派发事件，供脚本按需增量更新 UI
  useEffect(() => {
    if (!containerRef.current || !scriptCode) return;
    const event = new CustomEvent('js-field:value-change', { detail: value });
    containerRef.current.dispatchEvent(event);
  }, [value, scriptCode]);

  // 无自定义 JS 时默认渲染 Input，保持可用性
  if (!scriptCode) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        style={{ width: '100%' }}
      />
    );
  }

  return <span ref={containerRef} style={{ display: 'inline-block', width: '100%' }} />;
};

/**
 * JS 可编辑字段（表单项）：
 * - 通过 jsSettings.runJs 运行 JS 代码；
 * - 在运行时提供 ctx.getValue/ctx.setValue，实现与表单的双向交互；
 * - 子节点由脚本渲染（DOM 操作），用于完全自定义输入体验。
 */
export class JSEditableFieldModel extends FormFieldModel {
  render() {
    return (
      <JSFormRuntime
        model={this as JSEditableFieldModel}
        value={(this as any).props?.value}
        onChange={(this as any).props?.onChange}
        disabled={(this as any).props?.disabled}
        readOnly={(this as any).props?.readOnly}
      />
    );
  }
}

JSEditableFieldModel.define({
  label: escapeT('JS field'),
});

JSEditableFieldModel.registerFlow({
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
          code: `// 可编辑的 JavaScript 字段示例\n// 通过 ctx.getValue()/ctx.setValue() 与表单交互\n\nconst v = ctx.getValue();\nctx.element.innerHTML = \`<input id="js-input" style="width:100%;padding:4px 8px" value="${'${'}v ?? ''}" />\`;\nconst el = document.getElementById('js-input');\nel?.addEventListener('input', (e) => ctx.setValue(e.target.value));\n`,
        };
      },
      async handler(ctx, params) {
        // 运行期逻辑在 runtime 组件中处理；此处保持空实现，以兼容设置态预览
        const { code = '' } = params || {};
        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
          });
          await ctx.runjs(code, { window: createSafeWindow(), document: createSafeDocument() });
        });
      },
    },
  },
});
