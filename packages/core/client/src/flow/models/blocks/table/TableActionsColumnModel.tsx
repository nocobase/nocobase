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
import {
  AddSubModelButton,
  DragHandler,
  Droppable,
  FlowModelRenderer,
  FlowsFloatContextMenu,
} from '@nocobase/flow-engine';
import type { PropertyMetaFactory } from '@nocobase/flow-engine';
import { createRecordMetaFactory } from '@nocobase/flow-engine';
import { Skeleton, Space, Tooltip } from 'antd';
import React from 'react';
import { ActionModel, RecordActionModel } from '../../base/ActionModel';
import { TableCustomColumnModel } from './TableCustomColumnModel';

const Columns = observer<any>(({ record, model, index }) => {
  return (
    <Space
      size={'middle'}
      className={css`
        button {
          padding: 0;
        }
      `}
    >
      {model.mapSubModels('actions', (action: ActionModel) => {
        const fork = action.createFork({}, `${index}`);
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
          resolveOnServer: true,
          meta: recordMeta,
        });
        fork.context.defineProperty('recordIndex', {
          get: () => index
        });
        return (
          <FlowModelRenderer
            showFlowSettings={{ showBorder: false }}
            key={fork.uid}
            model={fork}
            fallback={<Skeleton.Button size="small" />}
          />
        );
      })}
    </Space>
  );
});

const AddActionToolbarComponent = ({ model }) => {
  return (
    <AddSubModelButton
      key="table-row-actions-add"
      model={model}
      subModelBaseClass={RecordActionModel}
      subModelKey="actions"
      afterSubModelInit={async (actionModel) => {
        actionModel.setStepParams('buttonSettings', 'general', { type: 'link' });
      }}
    >
      <PlusOutlined />
    </AddSubModelButton>
  );
};

export class TableActionsColumnModel extends TableCustomColumnModel {
  async afterAddAsSubModel() {
    await this.applyAutoFlows();
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
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => <Columns record={record} model={this} index={index} />;
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
});
