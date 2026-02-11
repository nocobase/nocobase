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
  createSafeDocument,
  createSafeWindow,
  createSafeNavigator,
  observer,
} from '@nocobase/flow-engine';
import { Tooltip } from 'antd';
import React from 'react';
import { TableCustomColumnModel } from './TableCustomColumnModel';
import { CodeEditor } from '../../../components/code-editor';
import { resolveRunJsParams } from '../../utils/resolveRunJsParams';

export class JSColumnModel extends TableCustomColumnModel {
  // Stable per‑instance render component to avoid remounts across re-renders
  private _RenderComponent?: React.ComponentType;
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
        const fork = this.createFork({}, String(forkKey));
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
        return <MemoFlowModelRenderer key={fork.uid} model={fork} />;
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
      defaultParams() {
        return {
          version: 'v1',
          code: `ctx.render('<span class="nb-js-column">JS column</span>');`,
        };
      },
      async handler(ctx, params) {
        const { code, version } = resolveRunJsParams(ctx, params);

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
            const settled = await Promise.allSettled(
              mountedForks.map((fork: any) => {
                return fork.applyFlow('jsSettings', { preview: { code, version } });
              }),
            );
            const firstRejected = settled.find(
              (result): result is PromiseRejectedResult => result.status === 'rejected',
            );
            if (firstRejected) {
              throw firstRejected.reason;
            }
            return;
          }
        }

        ctx.onRefReady(ctx.ref, async (element) => {
          ctx.defineProperty('element', {
            get: () => new ElementProxy(element),
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
