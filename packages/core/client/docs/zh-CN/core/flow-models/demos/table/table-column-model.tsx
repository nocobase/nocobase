import { EditOutlined } from '@ant-design/icons';
import { Field, FlowModel, FlowModelRenderer } from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { ActionModel } from './action-model';
import { dsm } from './data-source-manager';
import { FormModel } from './form-model';

export class TableColumnModel extends FlowModel {
  field: Field;

  getColumnProps() {
    return { ...this.props, render: this.render() };
  }

  render() {
    return (value, record, index) => (
      <span>
        {value}
        <EditOutlined
          onClick={() => {
            const model = this.createRootModel({
              use: 'FormModel',
            }) as FormModel;
            model.openEditDialog();
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

        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);

        ctx.model.field = field;
      },
    },
  },
});
