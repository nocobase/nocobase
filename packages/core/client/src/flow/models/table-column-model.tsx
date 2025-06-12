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
import { Field, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { ActionModel } from './action-model';
import { FormModel } from './form-model';
import { FieldFlowModel } from './FieldFlowModel';

export class TableColumnModel extends FieldFlowModel {
  // field: Field;
  // fieldPath: string;

  getColumnProps() {
    return { ...this.props, render: this.render() };
  }

  render() {
    return (value, record, index) => (
      <span
        className={css`
          .anticon {
            display: none;
          }
          &:hover {
            .anticon {
              display: inline-flex;
            }
          }
        `}
      >
        {value}
        <EditOutlined
          onClick={async () => {
            const model = this.createRootModel({
              use: 'FormModel',
              stepParams: {
                default: {
                  step1: {
                    dataSourceKey: this.field.collection.dataSource.name,
                    collectionName: this.field.collection.name,
                  },
                },
              },
              subModels: {
                fields: [
                  {
                    use: 'FormItemModel',
                    stepParams: {
                      default: {
                        step1: {
                          fieldPath: this.fieldPath,
                        },
                      },
                    },
                  },
                ],
              },
            }) as FormModel;
            await model.openDialog({ filterByTk: record.id });
            await this.parent.resource.refresh();
            this.flowEngine.removeModel(model.uid);
          }}
        />
      </span>
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
