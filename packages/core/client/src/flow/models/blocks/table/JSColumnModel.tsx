/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  Droppable,
  escapeT,
  FlowsFloatContextMenu,
  DragHandler,
  FlowModelRenderer,
  createRecordMetaFactory,
  ElementProxy,
  createSafeDocument,
  createSafeWindow,
} from '@nocobase/flow-engine';
import { Skeleton, Tooltip } from 'antd';
import React from 'react';
import { TableCustomColumnModel } from './TableCustomColumnModel';
import { CodeEditor } from '../../../components/code-editor';

export class JSColumnModel extends TableCustomColumnModel {
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
        const fork = this.createFork({}, `${index}`);
        const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
          () => (fork.context as any).collection,
          fork.context.t('Current record'),
          (ctx) => {
            const coll = (ctx as any).collection;
            const rec = (ctx as any).record;
            const name = coll?.name;
            const dataSourceKey = coll?.dataSourceKey;
            const filterByTk = coll?.getFilterByTK?.(rec);
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
        return <FlowModelRenderer key={fork.uid} model={fork} fallback={<Skeleton.Button size="small" />} />;
      },
    };
  }

  render() {
    // 渲染一个占位容器，供 JS 代码写入内容
    return () => <span ref={this.context.ref} style={{ display: 'inline-block', maxWidth: '100%' }} />;
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
      uiMode: {
        type: 'dialog',
        props: {
          width: '70%',
        },
      },
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
