/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { DragHandler, FlowsFloatContextMenu } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { TableColumnProps, Tooltip } from 'antd';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { ReadPrettyFieldModel } from '../../fields/ReadPrettyField/ReadPrettyFieldModel';

export class TableColumnModel extends FieldModel {
  getColumnProps(): TableColumnProps {
    const titleContent = (
      <FlowsFloatContextMenu
        model={this}
        containerStyle={{ display: 'block', padding: '11px 8px', margin: '-11px -8px' }}
        showBorder={false}
        settingsMenuLevel={2}
        extraToolbarItems={[
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
    );
    return {
      ...this.props,
      ellipsis: true,
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
      onCell: (record, recordIndex) => ({
        record,
        recordIndex,
        width: this.props.width,
        editable: this.props.editable,
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
        {this.mapSubModels('field', (action: ReadPrettyFieldModel) => {
          const fork = action.createFork({}, `${index}`);
          fork.setSharedContext({ index, value, currentRecord: record });
          return <React.Fragment key={index}>{fork.render()}</React.Fragment>;
        })}
      </>
    );
  }
}

TableColumnModel.define({
  title: tval('Table column'),
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
      async handler(ctx, params) {
        if (!params.dataSourceKey || !params.collectionName || !params.fieldPath) {
          throw new Error('dataSourceKey, collectionName and fieldPath are required parameters');
        }
        if (!ctx.shared.currentBlockModel) {
          throw new Error('Current block model is not set in shared context');
        }
        if (ctx.model.collectionField) {
          return;
        }
        const { dataSourceKey, collectionName, fieldPath } = params;
        const field = ctx.globals.dataSourceManager.getCollectionField(
          `${dataSourceKey}.${collectionName}.${fieldPath}`,
        );
        if (!field) {
          throw new Error(`Collection field not found: ${dataSourceKey}.${collectionName}.${fieldPath}`);
        }
        ctx.model.collectionField = field;
        ctx.model.fieldPath = params.fieldPath;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
    editColumTitle: {
      title: tval('Column title'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: tval('Column title'),
          },
        },
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
      handler(ctx, params) {
        console.log('editColumTitle params:', params);
        const title = ctx.globals.flowEngine.translate(params.title || ctx.model.collectionField?.title);
        ctx.model.setProps('title', title);
      },
    },
    editTooltip: {
      title: tval('Edit tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: tval('Edit tooltip'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('tooltip', params.tooltip);
      },
    },
    editColumnWidth: {
      title: tval('Column width'),
      uiSchema: {
        width: {
          'x-component': 'NumberPicker',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        width: 100,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    enableEditable: {
      title: tval('Editable'),
      uiSchema: {
        editable: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams(ctx) {
        return {
          editable: ctx.model.parent.props.editable || false,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('editable', params.editable);
      },
    },
  },
});
