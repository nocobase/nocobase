/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, tExpr, createSafeDocument, createSafeWindow, createSafeNavigator } from '@nocobase/flow-engine';
import React, { useEffect, useMemo, useRef } from 'react';
import { Input } from 'antd';
import { FieldModel } from '../base/FieldModel';
import { CodeEditor } from '../../components/code-editor';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';

const DEFAULT_CODE = `
// Render an editable antd Input via JSX and keep it in sync with form value.
// - Uses ctx.getValue/ctx.setValue for two-way binding
// - Listens to external value changes via 'js-field:value-change'
function JsEditableField() {
  const React = ctx.React;
  const { Input } = ctx.antd;
  const [value, setValue] = React.useState(ctx.getValue?.() ?? '');

  React.useEffect(() => {
    const handler = (ev) => setValue(ev?.detail ?? '');
    ctx.element?.addEventListener('js-field:value-change', handler);
    return () => ctx.element?.removeEventListener('js-field:value-change', handler);
  }, []);

  const onChange = (e) => {
    const v = e?.target?.value ?? '';
    setValue(v);
    ctx.setValue?.(v);
  };

  if (ctx.readOnly) {
    return <span>{String(value ?? '')}</span>;
  }

  return (
    <Input
      {...ctx.model.props}
      value={value}
      onChange={onChange}
    />
  );
}

// Mount to the field container
ctx.render(<JsEditableField />);
`;

function getEffectivePattern(model?: JSEditableFieldModel) {
  return (
    model?.props?.pattern ??
    (model?.context as { pattern?: string } | undefined)?.pattern ??
    (model?.parent as { props?: { pattern?: string } } | undefined)?.props?.pattern
  );
}

function isReadOnlyMode(model?: JSEditableFieldModel) {
  return !!model?.props?.readOnly || getEffectivePattern(model) === 'readPretty';
}

function resolveScriptCode(codeParam?: string) {
  const raw = codeParam ?? DEFAULT_CODE;
  return typeof raw === 'string' ? raw.trim() : '';
}

const JSFormRuntime: React.FC<{
  model: JSEditableFieldModel;
  value?: any;
  onChange?: (v: any) => void;
  disabled?: boolean;
  readOnly?: boolean;
}> = ({ model, value, onChange, disabled, readOnly }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const externalRef = model.context?.ref as React.RefObject<HTMLSpanElement>;
  const assignRefs = (el: HTMLSpanElement | null) => {
    (containerRef as any).current = el as any;
    if (externalRef && typeof externalRef === 'object') {
      (externalRef as any).current = el as any;
    }
  };
  // 统一获取&裁剪脚本代码，直接依赖具体 code 字符串，避免顶层 stepParams 引用未变化导致不更新
  const codeParam = model.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
  const scriptCode = useMemo(() => {
    return resolveScriptCode(codeParam);
  }, [codeParam]);

  useEffect(() => {
    if (!containerRef.current || !scriptCode) return;
    model.scheduleApplyJsSettings();
  }, [model, scriptCode]);

  useEffect(() => {
    if (!containerRef.current || !scriptCode) return;
    const event = new CustomEvent('js-field:value-change', { detail: value });
    containerRef.current.dispatchEvent(event);
  }, [value, scriptCode]);

  if (readOnly && !scriptCode) {
    return <span>{String(value ?? '')}</span>;
  }

  if (!scriptCode) {
    return (
      <Input value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled} style={{ width: '100%' }} />
    );
  }

  return <span ref={assignRefs} style={{ display: 'inline-block', width: '100%' }} />;
};

/**
 * JS 可编辑字段（表单项）：
 * - 通过 jsSettings.runJs 运行 JS 代码；
 * - 在运行时提供 ctx.getValue/ctx.setValue，实现与表单的双向交互；
 * - 子节点由脚本渲染（DOM 操作），用于完全自定义输入体验。
 */
export class JSEditableFieldModel extends FieldModel {
  private _mountedOnce = false;
  private _pendingJsSettingsApply = false;
  private _lastAppliedJsSettings?: {
    code: string;
    disabled: boolean;
    readOnly: boolean;
    element: HTMLSpanElement | null;
  };

  scheduleApplyJsSettings() {
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    if (!resolveScriptCode(codeParam)) return;

    if (this._pendingJsSettingsApply) {
      return;
    }

    this._pendingJsSettingsApply = true;
    queueMicrotask(() => {
      this._pendingJsSettingsApply = false;

      const nextCodeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
      const nextCode = resolveScriptCode(nextCodeParam);
      const nextElement = this.context.ref?.current as HTMLSpanElement | null;
      if (!nextCode || !nextElement) {
        return;
      }

      const nextRun = {
        code: nextCode,
        disabled: !!this.props?.disabled,
        readOnly: isReadOnlyMode(this),
        element: nextElement,
      };
      const lastRun = this._lastAppliedJsSettings;
      if (
        lastRun &&
        lastRun.code === nextRun.code &&
        lastRun.disabled === nextRun.disabled &&
        lastRun.readOnly === nextRun.readOnly &&
        lastRun.element === nextRun.element
      ) {
        return;
      }

      this._lastAppliedJsSettings = nextRun;
      void this.applyFlow('jsSettings');
    });
  }

  useHooksBeforeRender() {
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    const scriptCode = resolveScriptCode(codeParam);
    const disabled = this.props?.disabled;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (!scriptCode) return;
      this.scheduleApplyJsSettings();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptCode, disabled]);
  }

  render() {
    const readOnly = isReadOnlyMode(this);
    return (
      <JSFormRuntime
        model={this as JSEditableFieldModel}
        value={this.props?.value}
        onChange={this.props?.onChange}
        disabled={this.props?.disabled}
        readOnly={readOnly}
      />
    );
  }

  /**
   * 在 CreateForm / 提交后重置等场景下，字段可能被卸载并重新挂载。
   * 由于 beforeRender 命中缓存，新挂载的容器不会自动写入 JS 渲染内容。
   * 这里在二次挂载时检测容器已就绪，主动触发 rerender 来刷新 beforeRender（禁用缓存），
   * 保证输入框不会因为容器变更而空白。
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

const jsEditableFieldModelMeta = {
  label: tExpr('JS field'),
  preserveOnPatternChange: true,
};

JSEditableFieldModel.define(jsEditableFieldModelMeta);

JSEditableFieldModel.registerFlow({
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
        const fieldTitle = ctx.collectionField?.title || 'field';
        return {
          version: 'v2',
          code: DEFAULT_CODE,
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);
        if (!code?.trim()) {
          return;
        }

        ctx.onRefReady(ctx.ref, async (element) => {
          // 暴露容器与读写能力（使用动态 getter 绑定 ref.current，避免容器变更失效）
          ctx.defineProperty('element', {
            get: () => new ElementProxy((ctx.ref?.current as HTMLSpanElement | null) || element),
            cache: false,
          });
          ctx.defineMethod('getValue', () => {
            const name = ctx.model.props?.name;
            if (name !== undefined && name !== null) {
              const fv = ctx.form?.getFieldValue?.(name);
              return fv !== undefined ? fv : ctx.model.props?.value;
            }
            return ctx.model.props?.value;
          });
          ctx.defineMethod('setValue', (v) => {
            try {
              ctx.model.setProps('value', v);
              const name = ctx.model.props?.name;
              if (name !== undefined && name !== null) {
                ctx.form?.setFieldValue?.(name, v);
              }
            } catch (_) {
              // ignore
            }
          });
          ctx.defineProperty('namePath', { get: () => ctx.model.props?.name, cache: false });
          ctx.defineProperty('disabled', { get: () => !!ctx.model.props?.disabled, cache: false });
          ctx.defineProperty('readOnly', {
            get: () => isReadOnlyMode(ctx.model),
            cache: false,
          });
          const navigator = createSafeNavigator();
          await ctx.runjs(
            code,
            {
              window: createSafeWindow({ navigator }),
              document: createSafeDocument(),
              navigator,
            },
            { version },
          );
        });
      },
    },
  },
});
