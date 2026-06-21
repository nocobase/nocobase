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
import { observer } from '@formily/reactive-react';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import {
  AddSubModelButton,
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  DndProvider,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowsFloatContextMenu,
} from '@nocobase/flow-engine';
import { Skeleton, Space, Tooltip } from 'antd';
import React from 'react';
import { ActionModel } from '../../../base/ActionModel';
import { TableCustomColumnModel } from '../../../blocks/table/TableCustomColumnModel';
import { TableBlockModel } from '../../../blocks/table/TableBlockModel';

const Columns = observer<any>(({ record, model, index, _subTableModel }) => {
  return (
    <DndProvider>
      <Space
        wrap
        size={'middle'}
        className={css`
          > div:empty {
            display: none;
          }
          button {
            padding: 0;
          }
        `}
      >
        {model.mapSubModels('actions', (action: ActionModel) => {
          const fork = action.createFork({});
          // TODO: reset fork 的状态, fork 复用存在旧状态污染问题
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
            get: () => {
              return record;
            },
            cache: false,
            resolveOnServer: createRecordResolveOnServerWithLocal(
              () => (fork.context as any).collection,
              () => record,
            ),
            meta: recordMeta,
          });
          fork.context.defineProperty('recordIndex', {
            get: () => record.__index__ || index,
          });
          fork.context.defineProperty('associationModel', {
            value: _subTableModel,
          });
          return (
            <Droppable model={action} key={action.uid}>
              <FlowModelRenderer
                showFlowSettings={{ showBorder: false, toolbarPosition: 'above' }}
                key={fork.uid}
                model={fork}
                inputArgs={{ record, allowDisassociation: _subTableModel?.props?.allowDisassociation }}
                fallback={<Skeleton.Button size="small" />}
                extraToolbarItems={[
                  {
                    key: 'drag-handler',
                    component: DragHandler,
                    sort: 1,
                  },
                ]}
              />
            </Droppable>
          );
        })}
      </Space>
    </DndProvider>
  );
});

const AddActionToolbarComponent = ({ model }) => {
  return (
    <AddSubModelButton
      key="table-row-actions-add"
      model={model}
      subModelBaseClass={model.context.getModelClassName('PopupSubTableActionGroupModel')}
      subModelKey="actions"
      afterSubModelInit={async (actionModel) => {
        actionModel.setStepParams('buttonSettings', 'general', { type: 'link' });
      }}
    >
      <PlusOutlined />
    </AddSubModelButton>
  );
};

export class PopupSubTableActionsColumnModel extends TableCustomColumnModel {
  _subTableModel;
  async afterAddAsSubModel() {
    await this.dispatchEvent('beforeRender');
  }

  getColumnProps(model) {
    this._subTableModel = model;
    // 非配置态且列被标记为隐藏时，直接返回 null，从表格列中移除整列
    if (this.hidden && !this.flowEngine.flowSettings?.enabled) {
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
            overflow: ${this.flowEngine.flowSettings?.enabled ? 'visible' : 'hidden'}; /* 鼠标悬停时，内容可见 */
          }
        `}
      >
        <Columns record={record} model={this} index={index} _subTableModel={this._subTableModel} />
      </div>
    );
  }
}

PopupSubTableActionsColumnModel.define({
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
    return !ctx.disableFieldClickToOpen;
  },
});
