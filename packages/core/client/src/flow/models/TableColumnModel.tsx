/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { CollectionField, FlowModelRenderer, FlowsFloatContextMenu } from '@nocobase/flow-engine';
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

export class TableColumnActionsModel extends TableColumnModel {
  getColumnProps() {
    return { title: 'Actions', ...this.props, render: this.render() };
  }

  render() {
    return (value, record, index) => (
      <Space>
        {this.mapSubModels('actions', (action: ActionModel) => (
          <FlowModelRenderer key={action.uid} model={action} extraContext={{ record }} />
        ))}
      </Space>
    );
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
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
        ctx.model.field = field;
      },
    },
  },
});
