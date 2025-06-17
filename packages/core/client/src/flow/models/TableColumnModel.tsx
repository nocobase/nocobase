/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/reactive-react';
import { AddActionModel, CollectionField, FlowModelRenderer, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { Space, TableColumnProps, Tooltip } from 'antd';
import React from 'react';
import { ActionModel } from './ActionModel';
import { FieldFlowModel } from './FieldFlowModel';
import { QuickEditForm } from './QuickEditForm';

export class TableColumnModel extends FieldFlowModel {
  static readonly supportedFieldInterfaces = '*';

  getColumnProps(): TableColumnProps {
    return {
      ...this.props,
      title: (
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
        >
          {this.props.title}
        </FlowsFloatContextMenu>
      ),
      ellipsis: true,
      onCell: (record) => ({
        className: css`
          .edit-icon {
            position: absolute;
            display: none;
            color: #1890ff;
            margin-left: 8px;
            cursor: pointer;
            top: 50%;
            right: 8px;
            transform: translateY(-50%);
          }
          &:hover {
            background: rgba(24, 144, 255, 0.1) !important;
          }
          &:hover .edit-icon {
            display: inline-flex;
          }
        `,
      }),
      render: this.render(),
    };
  }

  renderQuickEditButton(record) {
    return (
      <Tooltip title="快速编辑">
        <EditOutlined
          className="edit-icon"
          onClick={async (e) => {
            e.stopPropagation();
            await QuickEditForm.open({
              flowEngine: this.flowEngine,
              collectionField: this.field as CollectionField,
              filterByTk: record.id,
            });
            await this.parent.resource.refresh();
          }}
        />
      </Tooltip>
    );
  }

  render() {
    return (value, record, index) => (
      <>
        {value}
        {this.renderQuickEditButton(record)}
      </>
    );
  }
}

TableColumnModel.define({
  title: 'Table Column',
  icon: 'TableColumn',
  defaultOptions: {
    use: 'TableColumnModel',
  },
  sort: 0,
});

const Columns = observer<any>(({ record, model }) => {
  return (
    <Space>
      {model.mapSubModels('actions', (action: ActionModel) => {
        const fork = action.createFork({}, `${record.id}`);
        return <FlowModelRenderer showFlowSettings key={fork.uid} model={fork} extraContext={{ record }} />;
      })}
    </Space>
  );
});

export class TableActionsColumnModel extends TableColumnModel {
  getColumnProps() {
    return {
      // title: 'Actions',
      ...this.props,
      title: (
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
        >
          <Space>
            {this.props.title || 'Actions'}
            <AddActionModel
              model={this}
              subModelKey={'actions'}
              items={() => [
                {
                  key: 'action1',
                  label: 'Action 1',
                  createModelOptions: {
                    use: 'ActionModel',
                  },
                },
                {
                  key: 'action2',
                  label: 'View',
                  createModelOptions: {
                    use: 'ViewActionModel',
                  },
                },
              ]}
            >
              <SettingOutlined />
            </AddActionModel>
          </Space>
        </FlowsFloatContextMenu>
      ),
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => <Columns record={record} model={this} />;
  }
}

TableColumnModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        if (!params.fieldPath) {
          return;
        }
        if (ctx.model.field) {
          return;
        }
        const field = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath);
        ctx.model.field = field;
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
      },
    },
  },
});
