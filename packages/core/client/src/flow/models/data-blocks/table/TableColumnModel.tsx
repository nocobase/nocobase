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
  useStepSettingContext,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { TableColumnProps, Tooltip } from 'antd';
import React from 'react';
import { FieldModel } from '../../base/FieldModel';
import { ReadPrettyFieldModel } from '../../fields/ReadPrettyField/ReadPrettyFieldModel';

export class TableColumnModel extends FieldModel {
  getColumnProps(): TableColumnProps {
    const titleContent = (
      <Droppable model={this}>
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
      </Droppable>
    );
    console.log(
      'TableColumnModel getColumnProps',
      this.props.dataIndex,
      this.props.editable,
      this.parent.props.editable,
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
  title: escapeT('Table column'),
  icon: 'TableColumn',
  defaultOptions: {
    use: 'TableColumnModel',
  },
  sort: 0,
});

TableColumnModel.registerFlow({
  key: 'tableColumnSettings',
  auto: true,
  sort: 500,
  title: escapeT('Table column settings'),
  steps: {
    init: {
      async handler(ctx, params) {
        const field = ctx.model.collectionField;
        ctx.model.setProps('title', field.title);
        ctx.model.setProps('dataIndex', field.name);
        await ctx.model.applySubModelsAutoFlows('field');
      },
    },
    editColumTitle: {
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
            const { model } = useStepSettingContext();
            const originTitle = model.collectionField?.uiSchema?.title;
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
        const title = ctx.engine.translate(params.title || ctx.model.collectionField?.title);
        ctx.model.setProps('title', title);
      },
    },
    editTooltip: {
      title: escapeT('Edit tooltip'),
      uiSchema: {
        tooltip: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: escapeT('Edit tooltip'),
          },
        },
      },
      handler(ctx, params) {
        ctx.model.setProps('tooltip', params.tooltip);
      },
    },
    editColumnWidth: {
      title: escapeT('Column width'),
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
        console.log('enableEditable11 params:', ctx.model.parent.props.editable || false);
        return {
          editable: ctx.model.parent.props.editable || false,
        };
      },
      handler(ctx, params) {
        console.log('enableEditable1 params:', params);
        ctx.model.setProps('editable', params.editable);
      },
    },
  },
});

export class TableCustomColumnModel extends FlowModel {}

TableCustomColumnModel.registerFlow({
  key: 'tableColumnSettings',
  auto: true,
  title: escapeT('Table column settings'),
  steps: {
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
          title:
            ctx.model.constructor['meta']?.title ||
            ctx.model.flowEngine.findModelClass((_, ModelClass) => {
              return ModelClass === ctx.model.constructor;
            })?.[0],
        };
      },
      handler(ctx, params) {
        const title = ctx.engine.translate(params.title);
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
  },
});

TableCustomColumnModel.define({
  hide: true,
});
