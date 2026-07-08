/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ElementProxy, tExpr, type StepDefinition } from '@nocobase/flow-engine';
import React, { useEffect } from 'react';
import { FieldModel } from '../base/FieldModel';
import { resolveRunJsParams } from '../utils/resolveRunJsParams';
import {
  beginJSFieldRuntimeRun,
  createJSFieldRunJsUISchema,
  createJSFieldSourceBindingStep,
  createJSFieldSourceModeStep,
  getJSFieldContextSignature,
  getJSFieldRunJsEditorTitle,
  getJSFieldRuntimeFlowSettingSteps,
  getJSFieldSourceSignature,
  INLINE_SOURCE_MODE,
  isCurrentJSFieldRuntimeRun,
  resetJSFieldRuntimeElement,
  renderJSFieldRuntimeError,
  reportJSFieldRuntimeErrorBestEffort,
  resolveJSFieldRuntimeRunJS,
  runResolvedJSFieldCode,
} from './jsFieldLightExtensionRuntime';

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
  private _lastRenderedElement?: HTMLSpanElement | null;
  private _pendingRenderedElement?: HTMLSpanElement | null;
  private _lastRunJs?: { signature: string; contextSignature: string; value: unknown; element: HTMLSpanElement | null };

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'jsSettings') {
      return undefined;
    }

    return getJSFieldRuntimeFlowSettingSteps(this);
  }

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
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    const sourceSignature = getJSFieldSourceSignature(this, this.getRunJsCode());
    const contextSignature = getJSFieldContextSignature(this);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      this.refreshRenderedElement(this.context.ref?.current as HTMLSpanElement | null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codeParam, sourceSignature, contextSignature, this.props.value]);
  }

  /**
   * 渲染一个占位容器，供 JS 脚本写入内容
   */
  private getRunJsCode() {
    const codeParam = this.getStepParams('jsSettings', 'runJs')?.code as string | undefined;
    return (typeof codeParam === 'string' && codeParam.trim().length ? codeParam : DEFAULT_CODE).trim();
  }

  private refreshRenderedElement(element: HTMLSpanElement | null) {
    if (!element || this._pendingRenderedElement === element) {
      return;
    }

    this._pendingRenderedElement = element;
    const ref = this.context.ref as React.MutableRefObject<HTMLSpanElement | null>;

    queueMicrotask(() => {
      if (this._pendingRenderedElement === element) {
        this._pendingRenderedElement = null;
      }
      if (ref.current !== element) {
        return;
      }
      const code = this.getRunJsCode();
      const value = this.props.value;
      const signature = getJSFieldSourceSignature(this, code);
      const contextSignature = getJSFieldContextSignature(this);
      const last = this._lastRunJs;
      if (
        last &&
        last.element === element &&
        last.signature === signature &&
        last.contextSignature === contextSignature &&
        Object.is(last.value, value)
      ) {
        return;
      }
      this._lastRunJs = { signature, contextSignature, value, element };
      this.applyFlow('jsSettings').catch((error) => {
        if (ref.current === element) {
          renderJSFieldRuntimeError(element, error, 'js-field-runtime-error');
        }
      });
    });
  }

  render() {
    const ref = this.context.ref as React.MutableRefObject<HTMLSpanElement | null>;
    const assignRef = (element: HTMLSpanElement | null) => {
      ref.current = element;
      if (!element) {
        return;
      }

      const elementChanged = this._lastRenderedElement && this._lastRenderedElement !== element;
      this._lastRenderedElement = element;
      if (elementChanged || !this._mountedOnce) {
        this.refreshRenderedElement(element);
      }
    };
    return <span ref={assignRef} style={{ display: 'inline-block', maxWidth: '100%' }} />;
  }

  /**
   * 组件挂载后，如果容器引用已就绪，强制重跑一次 beforeRender flows 以把 HTML 写入当前 DOM。
   * 解决新增后因命中缓存或执行时机导致内容未写入的问题（与 JSBlock/JSItem 一致处理）。
   */
  protected onMount() {
    if (this._mountedOnce) {
      if (this.context.ref?.current) {
        this.refreshRenderedElement(this.context.ref.current as HTMLSpanElement);
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
    sourceMode: createJSFieldSourceModeStep(),
    sourceBinding: createJSFieldSourceBindingStep(),
    runJs: {
      title: tExpr('Write JavaScript'),
      useRawParams: true,
      uiSchema: createJSFieldRunJsUISchema({ scene: 'block' }),
      uiMode: async (ctx) => ({
        type: 'embed',
        props: {
          title: await getJSFieldRunJsEditorTitle(ctx),
          footer: null,
          maxWidth: '960px',
          minWidth: '720px',
          width: '45%',
          styles: {
            body: {
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              transform: 'translateX(0)',
            },
          },
        },
      }),
      defaultParams(ctx) {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code: DEFAULT_CODE,
        };
      },
      async handler(ctx, params) {
        const inlineRunJs = resolveRunJsParams(ctx, params);
        // 暴露 element 与 value 到运行上下文
        ctx.onRefReady(ctx.ref, async (element) => {
          const runId = beginJSFieldRuntimeRun(ctx.model);
          let resolved: Awaited<ReturnType<typeof resolveJSFieldRuntimeRunJS>> | undefined;
          try {
            resetJSFieldRuntimeElement(element);
            ctx.defineProperty('element', {
              get: () => new ElementProxy((ctx.ref?.current as HTMLElement | null) || element),
              cache: false,
            });
            ctx.defineProperty('value', {
              get: () => ctx.model.props?.value,
              cache: false,
            });
            ctx.defineProperty('record', {
              get: () => ctx.model.context.record,
              cache: false,
            });
            ctx.defineProperty('collectionField', {
              get: () => ctx.model.context.collectionField,
              cache: false,
            });
            resolved = await resolveJSFieldRuntimeRunJS({
              model: ctx.model,
              params: params || {},
              runJs: inlineRunJs,
            });
            if (!isCurrentJSFieldRuntimeRun(ctx.model, runId)) {
              return;
            }
            await runResolvedJSFieldCode({ ctx, resolved });
          } catch (error) {
            if (!isCurrentJSFieldRuntimeRun(ctx.model, runId)) {
              return;
            }
            renderJSFieldRuntimeError(element, error, 'js-field-runtime-error');
            await reportJSFieldRuntimeErrorBestEffort({ ctx, error, resolved, params });
          }
        });
      },
    },
  },
});
