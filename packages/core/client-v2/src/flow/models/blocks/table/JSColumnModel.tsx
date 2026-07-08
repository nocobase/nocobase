/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  Droppable,
  tExpr,
  FlowsFloatContextMenu,
  DragHandler,
  MemoFlowModelRenderer,
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  ElementProxy,
  observer,
  type StepDefinition,
} from '@nocobase/flow-engine';
import { Tooltip } from 'antd';
import React from 'react';
import { TableCustomColumnModel } from './TableCustomColumnModel';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';
import {
  beginJSFieldRuntimeRun,
  createJSFieldRunJsUISchema,
  createJSFieldSourceBindingStep,
  createJSFieldSourceModeStep,
  getJSFieldRunJsEditorTitle,
  getJSFieldRuntimeFlowSettingSteps,
  INLINE_SOURCE_MODE,
  isCurrentJSFieldRuntimeRun,
  resetJSFieldRuntimeElement,
  renderJSFieldRuntimeError,
  reportJSFieldRuntimeErrorBestEffort,
  resolveJSFieldRuntimeRunJS,
  runResolvedJSFieldCode,
} from '../../fields/jsFieldLightExtensionRuntime';

function getRecordRenderSignature(record: any) {
  if (!record || typeof record !== 'object') {
    return String(record);
  }

  try {
    const seen = new WeakSet();
    return JSON.stringify(record, (_key, value) => {
      if (value && typeof value === 'object') {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    });
  } catch (error) {
    return String(record);
  }
}

export class JSColumnModel extends TableCustomColumnModel {
  // Stable per‑instance render component to avoid remounts across re-renders
  private _RenderComponent?: React.ComponentType;

  public async getRuntimeFlowSettingSteps(flowKey: string): Promise<Record<string, StepDefinition> | undefined> {
    if (flowKey !== 'jsSettings') {
      return undefined;
    }

    return getJSFieldRuntimeFlowSettingSteps(this);
  }

  renderHiddenInConfig() {
    return (
      <Tooltip
        title={this.context.t(
          'This field has been hidden and you cannot view it (this content is only visible when the UI Editor is activated).',
        )}
      >
        <LockOutlined style={{ opacity: '0.45' }} />
      </Tooltip>
    );
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

  getColumnProps() {
    const self = this;
    const TitleText = observer(() => <>{self.props.title}</>);
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
          showBorder={false}
          extraToolbarItems={[
            {
              key: 'drag-handler',
              component: DragHandler,
              sort: 1,
            },
          ]}
        >
          <div
            className={css`
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: calc(${this.props.width}px - 16px);
            `}
          >
            <TitleText />
          </div>
        </FlowsFloatContextMenu>
      </Droppable>
    );

    if (this.hidden && !this.context.flowSettingsEnabled) {
      return null;
    }

    return {
      ...this.props,
      title: this.props.tooltip ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {titleContent}
          <Tooltip title={this.props.tooltip}>
            <QuestionCircleOutlined style={{ cursor: 'pointer' }} />
          </Tooltip>
        </span>
      ) : (
        titleContent
      ),
      render: (value, record, index) => {
        // 使用记录主键作为 fork key，避免分页后 index 复用导致 fork 复用
        const tk = this.context.collection?.getFilterByTK?.(record);
        const forkKey = tk ?? record?.id ?? index;
        const recordSignature = getRecordRenderSignature(record);
        const fork = this.createFork({}, String(forkKey));
        const previousRecordSignature = (fork as any).__recordRenderSignature;
        if (previousRecordSignature !== recordSignature) {
          (fork as any).__recordRenderSignature = recordSignature;
          fork.invalidateFlowCache('beforeRender');
        }
        const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
          () => fork.context.collection,
          fork.context.t('Current record'),
          (ctx) => {
            const name = ctx.collection?.name;
            const dataSourceKey = ctx.collection?.dataSourceKey;
            const filterByTk = ctx.collection?.getFilterByTK?.(ctx.record);
            if (!name || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
            return { collection: name, dataSourceKey, filterByTk };
          },
        );
        fork.context.defineProperty('record', {
          get: () => record,
          cache: false,
          resolveOnServer: createRecordResolveOnServerWithLocal(
            () => fork.context.collection,
            () => record,
          ),
          meta: recordMeta,
        });
        fork.context.defineProperty('recordIndex', {
          get: () => index,
        });
        fork.context.defineProperty('value', {
          get: () => value,
          cache: false,
        });
        return <MemoFlowModelRenderer key={`${fork.uid}:${recordSignature}`} model={fork} />;
      },
    };
  }

  render() {
    if (!this._RenderComponent) {
      const self = this;
      const StableComponent: React.FC = () => {
        const ref = self.context.ref;
        React.useEffect(() => {
          const s: any = self as any;
          if (!ref?.current) return;
          if (s.__mountedOnce) {
            self.rerender();
          } else {
            s.__mountedOnce = true;
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [ref?.current]);
        return (
          <div
            style={{ width: this.props.width - 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            <span ref={ref} style={{ maxWidth: '100%' }} />
          </div>
        );
      };
      StableComponent.displayName = 'JSColumnModelStableRenderer';
      this._RenderComponent = StableComponent;
    }
    return this._RenderComponent;
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    // Apply basic column settings right after adding (title/width), JS-specific only
    await this.applyFlow('tableColumnSettings');
  }

  // No onMount logic; StableComponent handles first-run and remount reruns
}

JSColumnModel.define({
  label: tExpr('JS column'),
  createModelOptions: {
    stepParams: {
      tableColumnSettings: {
        title: {
          title: tExpr('JS column'),
        },
      },
    },
  },
});

JSColumnModel.registerFlow({
  key: 'jsSettings',
  title: tExpr('JavaScript settings'),
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
      defaultParams() {
        return {
          version: 'v2',
          sourceMode: INLINE_SOURCE_MODE,
          code: `ctx.render('<span class="nb-js-column">JS column</span>');`,
        };
      },
      async handler(ctx, params) {
        const inlineRunJs = resolveRunJsParams(ctx, params);

        const preview = ctx.inputArgs?.preview;
        const isPreview = !!preview;
        const isFork = (ctx.model as any)?.isFork === true;

        // 预览模式：在 master 上分发到当前已挂载（可见）的行内 fork，确保点击 Run 可即时看到单元格渲染结果
        if (isPreview && !isFork) {
          const masterModel = ctx.model as any;
          const mountedForks = Array.from(masterModel?.forks || []).filter((fork: any) => {
            return !!fork?.context?.ref?.current;
          });

          if (mountedForks.length > 0) {
            await Promise.allSettled(
              mountedForks.map((fork: any) => {
                return fork.applyFlow('jsSettings', { preview: inlineRunJs });
              }),
            );
            return;
          }
        }

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
              get: () => ctx.model.context.value,
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
            renderJSFieldRuntimeError(element, error, 'js-column-runtime-error');
            await reportJSFieldRuntimeErrorBestEffort({ ctx, error, resolved, params });
          }
        });
      },
    },
  },
});
