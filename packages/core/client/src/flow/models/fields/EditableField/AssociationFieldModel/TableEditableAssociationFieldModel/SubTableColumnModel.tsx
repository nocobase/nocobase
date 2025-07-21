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
import {
  DragHandler,
  Droppable,
  escapeT,
  FlowModel,
  FlowsFloatContextMenu,
  useFlowSettingsContext,
  FlowModelRenderer,
} from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip } from 'antd';
import React from 'react';
import { FieldModel } from '../../../../base/FieldModel';
import { EditableFieldModel } from '../../EditableFieldModel';
import { TableColumnModel } from '../../../../data-blocks/table/TableColumnModel';

export class SubTableColumnModel extends TableColumnModel {
  getColumnProps(): TableColumnProps {
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 7px', margin: '-11px -7px' }}
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
            {this.props.title || this.collectionField.title}
          </div>
        </FlowsFloatContextMenu>
      </Droppable>
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
        model: this,
        // handleSave,
      }),
      render: this.render(),
    };
  }

  render() {
    return (value, record, index) => (
      <>
        {this.mapSubModels('field', (action: EditableFieldModel) => {
          const fork = action.createFork({}, `${index}`);
          fork.context.defineProperty('record', {
            get: () => record,
          });
          fork.context.defineProperty('fieldValue', {
            get: () => value,
          });
          fork.context.defineProperty('recordIndex', {
            get: () => index,
          });
          fork.context.defineProperty('basePath', {
            get: () => {
              const basePath = (this.parent as FieldModel).fieldPath;
              return `${basePath}.${index}`;
            },
            cache: false,
          });
          return <FlowModelRenderer model={fork} />;
        })}
      </>
    );
  }
}

SubTableColumnModel.define({
  title: escapeT('Table column'),
  icon: 'TableColumn',
  defaultOptions: {
    use: 'SubTableColumnModel',
  },
  sort: 0,
});

SubTableColumnModel.registerFlow({
  key: 'tableColumnSettings',
  auto: true,
  sort: 600,
  title: escapeT('Table column settings'),
  steps: {
    init: {
      async handler(ctx, params) {
        const field = ctx.model.collectionField;
        if (!field) {
          return;
        }
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
    title: {
      title: escapeT('Column title'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: escapeT('Column title'),
          },
          'x-reactions': (field) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model } = useFlowSettingsContext<FieldModel>();
            const originTitle = model.collectionField?.title;
            field.decoratorProps = {
              ...field.decoratorProps,
              extra: model.context.t('Original field title: ') + (model.context.t(originTitle) ?? ''),
            };
          },
        },
      },
      defaultParams: (ctx) => {
        return {
          title: ctx.model.collectionField?.title,
        };
      },
      handler(ctx, params) {
        const title = ctx.t(params.title || ctx.model.collectionField?.title);
        ctx.model.setProps('title', title);
      },
    },
    tooltip: {
      title: escapeT('Tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('tooltip', params.tooltip);
      },
    },
    width: {
      title: escapeT('Column width'),
      uiSchema: {
        width: {
          'x-component': 'NumberPicker',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: {
        width: 200,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
  },
});

SubTableColumnModel.define({
  hide: true,
});
