/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngineProvider, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { TableColumnProps } from 'antd';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { TableFieldModel } from './fields/TableFieldModel';

export class TableColumnModel extends FieldModel {
  getColumnProps(): TableColumnProps & {
    editable?: boolean;
  } {
    return {
      width: 100,
      editable: true,
      ...this.props,
      ellipsis: true,
      title: (
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
          showBorder={false}
        >
          {this.props.title}
        </FlowsFloatContextMenu>
      ),
      onCell: (record) => ({
        record,
        width: this.props.width,
        editable: this.props.editable || true,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
        // handleSave,
      }),
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => (
      <>
        {this.mapSubModels('field', (action: TableFieldModel) => {
          const fork = action.createFork({}, `index`);
          fork.setSharedContext({ index, value, record });
          return <FlowEngineProvider engine={this.flowEngine}>{fork.render()}</FlowEngineProvider>;
        })}
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
    setWidth: {
      defaultParams: {
        width: 100,
      },
      title: 'Column width',
      uiSchema: {
        width: {
          type: 'number',
          title: 'Width',
          'x-decorator': 'FormItem',
          'x-component': 'NumberPicker',
          'x-component-props': {
            placeholder: 'Enter width',
            style: { width: '100%' },
          },
        },
      },
      handler(ctx, params) {
        if (params.width) {
          ctx.model.setProps('width', params.width);
        }
      },
    },
  },
});
