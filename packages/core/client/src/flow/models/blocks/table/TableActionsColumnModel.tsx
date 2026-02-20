/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import type { ForkFlowModel, PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  AddSubModelButton,
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowsFloatContextMenu,
  observer,
} from '@nocobase/flow-engine';
import { Skeleton, Tooltip } from 'antd';
import React from 'react';
import { ActionModel } from '../../base';
import { TableCustomColumnModel } from './TableCustomColumnModel';
import { getRowKey } from './utils';
import { FormBlockModel } from '../form/FormBlockModel';

const recordIdentityByFork = new WeakMap<ForkFlowModel<any>, string>();

const Columns = observer<any>(({ record, model, index }) => {
  const isConfigMode = !!model.context.flowSettingsEnabled;
  const slotKey = `${record.__index ?? index}`;
  const recordIdentity = getRowKey(record, model?.context?.collection?.filterTargetKey);
  return (
    <DndProvider>
      <div
        style={{ gap: model.context?.themeToken?.marginSM ?? 16 }}
        className={css`
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          > div:empty {
            display: none;
          }
          button {
            padding: 0;
          }
        `}
      >
        {model.mapSubModels('actions', (action: ActionModel) => {
          // Static hidden can be skipped safely; dynamic hidden is handled by fork.beforeRender + model.render wrapper.
          if (action.hidden && !isConfigMode) {
            return;
          }

          // Use a stable "slot" key to avoid unbounded fork growth (pageSize slots),
          // but reset the fork instance when the underlying row record changes (pagination/virtualization),
          // preventing linkage-rule state from leaking across rows.
          const cachedFork = action.getFork(slotKey);
          if (cachedFork && recordIdentityByFork.get(cachedFork) !== recordIdentity) {
            cachedFork.dispose();
          }

          const fork = action.createFork({}, slotKey);
          recordIdentityByFork.set(fork, recordIdentity);

          fork.invalidateFlowCache('beforeRender');
          const recordMeta: PropertyMetaFactory = createRecordMetaFactory(
            () => (fork.context as any).collection,
            fork.context.t('Current record'),
            (ctx) => {
              const coll = ctx.collection;
              const rec = ctx.record;
              const name = coll?.name;
              const dataSourceKey = coll?.dataSourceKey;
              const filterByTk = coll?.getFilterByTK?.(rec);
              if (!name || typeof filterByTk === 'undefined' || filterByTk === null) return undefined;
              return { collection: name, dataSourceKey, filterByTk };
            },
          );
          fork.context.defineProperty('record', {
            get: () => record,
            cache: false,
            resolveOnServer: createRecordResolveOnServerWithLocal(
              () => (fork.context as any).collection,
              () => record,
            ),
            meta: recordMeta,
          });
          fork.context.defineProperty('recordIndex', {
            get: () => index,
          });
          const renderer = (
            <FlowModelRenderer
              showFlowSettings={{ showBorder: false, toolbarPosition: 'above' }}
              key={fork.uid}
              model={fork}
              inputArgs={record}
              fallback={<Skeleton.Button size="small" />}
              extraToolbarItems={[
                {
                  key: 'drag-handler',
                  component: DragHandler,
                  sort: 1,
                },
              ]}
            />
          );
          if (!isConfigMode) {
            // 非配置模式不包裹 Droppable，避免隐藏动作留下空占位。
            return renderer;
          }
          return (
            <Droppable model={action} key={action.uid}>
              {renderer}
            </Droppable>
          );
        })}
      </div>
    </DndProvider>
  );
});

const AddActionToolbarComponent = observer(({ model }: any) => {
  const blockModel = model?.context?.blockModel as any;
  const propsTreeTable = blockModel?.props?.treeTable;

  return (
    <AddSubModelButton
      key={`table-row-actions-add-${propsTreeTable ? 'tree' : 'flat'}`}
      model={model}
      subModelBaseClass={model.context.getModelClassName('RecordActionGroupModel')}
      subModelKey="actions"
      afterSubModelInit={async (actionModel) => {
        actionModel.setStepParams('buttonSettings', 'general', { type: 'link', icon: null });
      }}
    >
      <PlusOutlined />
    </AddSubModelButton>
  );
});

export class TableActionsColumnModel extends TableCustomColumnModel {
  async afterAddAsSubModel() {
    await this.dispatchEvent('beforeRender');
  }

  getColumnProps() {
    // 非配置态且列被标记为隐藏时，直接返回 null，从表格列中移除整列
    if (this.hidden && !this.context.flowSettingsEnabled) {
      return null;
    }
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
          showBorder={false}
          extraToolbarItems={[
            {
              key: 'add-record-action',
              component: AddActionToolbarComponent,
            },
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
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => (
      <div
        className={css`
          max-width: ${this.props.width - 8}px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          transition: overflow 0.3s ease 0.8s; /* 加入延迟 */
          &:hover {
            overflow: ${this.context.flowSettingsEnabled ? 'visible' : 'hidden'}; /* 鼠标悬停时，内容可见 */
          }
        `}
      >
        <Columns record={record} model={this} index={index} />
      </div>
    );
  }
}

TableActionsColumnModel.define({
  label: '{{t("Actions")}}',
  createModelOptions: {
    stepParams: {
      tableColumnSettings: {
        title: {
          title: '{{t("Actions")}}',
        },
      },
    },
  },
  hide(ctx) {
    //子表格中隐藏这个Action
    return ctx.disableFieldClickToOpen;
  },
});
