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
  escapeT,
  FlowsFloatContextMenu,
  DragHandler,
  MemoFlowModelRenderer,
  createRecordMetaFactory,
  ElementProxy,
  createSafeDocument,
  createSafeWindow,
} from '@nocobase/flow-engine';
import { Tooltip } from 'antd';
import React from 'react';
import { TableCustomColumnModel } from './TableCustomColumnModel';
import { CodeEditor } from '../../../components/code-editor';

export class JSColumnModel extends TableCustomColumnModel {
  renderHiddenInConfig() {
    return (
      <Tooltip title={this.context.t('该字段已被隐藏，你无法查看（该内容仅在激活 UI Editor 时显示）。')}>
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
            {this.props.title}
          </div>
        </FlowsFloatContextMenu>
      </Droppable>
    );

    if (this.hidden && !this.flowEngine.flowSettings.enabled) {
      return null;
    }

    return {
      ...this.props,
      width: 100,
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
          resolveOnServer: true,
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
    const Component = () => {
      const ref = this.context.ref;
      React.useEffect(() => {
        if (ref?.current) {
          this.applyFlow('jsSettings');
        }
      }, [ref?.current]);
      return <span ref={ref} style={{ display: 'inline-block', maxWidth: '100%' }} />;
    };
    return Component;
  }

  protected onMount() {
    if (this.context.ref?.current) {
      this.rerender();
    }
  }
}

JSColumnModel.define({
  label: escapeT('JS column'),
  createModelOptions: {
    stepParams: {
      tableColumnSettings: {
        title: {
          title: escapeT('JS column'),
        },
      },
    },
  },
});

JSColumnModel.registerFlow({
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
      uiMode: 'embed',
      defaultParams() {
        return {
          code: `ctx.element.innerHTML = \`<span class="nb-js-column">JS column</span>\`;`,
        };
      },
      async handler(ctx, params) {
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
