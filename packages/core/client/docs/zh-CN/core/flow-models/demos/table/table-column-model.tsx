import { EditOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { Field, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { FormModel } from '../form/form-model';
import { ActionModel } from './action-model';
import { dsm } from './data-source-manager';

export class TableColumnModel extends FlowModel {
  field: Field;
  fieldPath: string;

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
                    dataSourceKey: 'main',
                    collectionName: 'users',
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
        const field = dsm.getCollectionField(params.fieldPath);
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);

        ctx.model.field = field;
      },
    },
  },
});
