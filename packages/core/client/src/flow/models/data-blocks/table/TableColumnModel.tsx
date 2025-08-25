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
  buildWrapperFieldChildren,
  Collection,
  DragHandler,
  Droppable,
  escapeT,
  FlowModel,
  FlowModelContext,
  FlowsFloatContextMenu,
  useFlowSettingsContext,
} from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip } from 'antd';
import React from 'react';
import { FieldModelRenderer } from '../../../common/FieldModelRenderer';
import { FieldModel } from '../../base/FieldModel';
import { ReadPrettyFieldModel } from '../../fields/ReadPrettyField/ReadPrettyFieldModel';
import { FormItem } from '../form/FormItem/FormItem';

export class TableColumnModel extends FieldModel {
  static defineChildren(ctx: FlowModelContext) {
    return buildWrapperFieldChildren(ctx, {
      useModel: 'TableColumnModel',
      fieldUseModel: (f) => f.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel',
    });
  }
  getColumnProps(): TableColumnProps {
    const titleContent = (
      <Droppable model={this}>
        <FlowsFloatContextMenu
          model={this}
          containerStyle={{ display: 'block', padding: '11px 7px', margin: '-11px -7px' }}
          showBorder={false}
          settingsMenuLevel={3}
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
      hidden: this.hidden,
    };
  }
  onInit(options: any): void {
    super.onInit(options);
  }

  render() {
    return (value, record, index) => (
      <>
        {this.mapSubModels('field', (field: ReadPrettyFieldModel) => {
          const fork = field.createFork({}, `${index}`);
          fork.context.defineProperty('record', {
            get: () => record,
          });
          fork.context.defineProperty('recordIndex', {
            get: () => index,
          });
          return (
            <FormItem key={field.uid} {...this.props} value={value} noStyle={true}>
              <FieldModelRenderer model={fork} />
            </FormItem>
          );
        })}
      </>
    );
  }
}

TableColumnModel.define({
  label: escapeT('Table column'),
  icon: 'TableColumn',
  createModelOptions: {
    use: 'TableColumnModel',
  },
  sort: 0,
});

TableColumnModel.registerFlow({
  key: 'tableColumnSettings',
  sort: 500,
  title: escapeT('Table column settings'),
  steps: {
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      async handler(ctx, params) {
        const collectionField = ctx.model.collectionField;
        if (!collectionField) {
          return;
        }
        ctx.model.setProps('title', collectionField.title);
        ctx.model.setProps('dataIndex', collectionField.name);
        await ctx.model.applySubModelsAutoFlows('field');
        ctx.model.setProps({
          ...collectionField.getComponentProps(),
        });
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
      defaultParams: (ctx) => ({
        title: ctx.model.collectionField?.title,
      }),
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
        width: 100,
      },
      handler(ctx, params) {
        ctx.model.setProps('width', params.width);
      },
    },
    quickEdit: {
      title: escapeT('Enable quick edit'),
      uiSchema: (ctx) => ({
        editable: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-disabled': ctx.model.collectionField.readonly,
        },
      }),
      defaultParams(ctx) {
        if (ctx.model.collectionField.readonly) {
          return {
            editable: false,
          };
        }
        return {
          editable: ctx.model.parent.props.editable || false,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('editable', params.editable);
      },
    },
    model: {
      title: escapeT('Field component'),
      use: 'fieldComponent',
    },
  },
});

export class TableCustomColumnModel extends FlowModel {}

TableCustomColumnModel.registerFlow({
  key: 'tableColumnSettings',
  title: escapeT('Table column settings'),
  steps: {
    title: {
      title: escapeT('Column title'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          'x-component-props': {
            placeholder: escapeT('Column title'),
          },
        },
      },
      defaultParams: (ctx) => {
        return {
          title:
            ctx.model.title ||
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
  label: escapeT('Other columns'),
});
