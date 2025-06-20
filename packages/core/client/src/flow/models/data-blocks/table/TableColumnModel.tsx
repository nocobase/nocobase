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
import { observer } from '@formily/react';
import { observable } from '@formily/reactive';
import { uid } from '@formily/shared';
import { CollectionField, FlowModelRenderer, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip } from 'antd';
import React from 'react';
import { FieldModel, SupportedFieldInterfaces } from '../../base/FieldModel';
import { QuickEditForm } from '../form/QuickEditForm';
import { TableFieldModel } from './fields/TableFieldModel';

const TableField = observer<any>(({ record, value, model, index }) => {
  return (
    <>
      {model.mapSubModels('field', (action: TableFieldModel) => {
        const fork = action.createFork({}, `${index}`);
        return (
          <FlowModelRenderer
            key={fork.uid}
            model={fork}
            showFlowSettings
            hideRemoveInSettings
            sharedContext={{ index, value, record }}
            extraContext={{ index, value, record }}
          />
        );
      })}
    </>
  );
});

export class TableColumnModel extends FieldModel {
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
              collectionField: this.collectionField as CollectionField,
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
        <TableField record={record} model={this} value={value} index={index} />
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

TableColumnModel.registerFlow({
  key: 'default',
  auto: true,
  steps: {
    step1: {
      handler(ctx, params) {
        if (!params.fieldPath) {
          return;
        }
        if (ctx.model.collectionField) {
          return;
        }
        const field = ctx.globals.dataSourceManager.getCollectionField(params.fieldPath);
        ctx.model.collectionField = field;
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
      },
    },
  },
});
