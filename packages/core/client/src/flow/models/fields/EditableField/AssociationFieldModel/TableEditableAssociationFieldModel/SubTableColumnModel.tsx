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
  FlowsFloatContextMenu,
  FlowModelRenderer,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { observer } from '@formily/react';
import { TableColumnProps, Tooltip } from 'antd';
import React, { useRef } from 'react';
import { EditFormModel } from '../../../../data-blocks/form/EditFormModel';
import { FieldModel } from '../../../../base/FieldModel';
import { EditableFieldModel } from '../../EditableFieldModel';
import { uid } from '@formily/shared';

const LargeFieldEdit = observer(({ model, params: { fieldPath, index }, defaultValue }: any) => {
  const flowEngine = useFlowEngine();
  const ref = useRef(null);
  const field = model.subModels.readPrettyField as FieldModel;
  const fieldModel = field?.createFork({}, `${index}`);
  const currentValue = model?.field?.value;
  fieldModel.context.defineProperty('fieldValue', {
    get: () => {
      return model?.field?.value || currentValue;
    },
    cache: false,
  });
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await flowEngine.context.viewOpener.open({
        mode: 'popover',
        target: e.target,
        placement: 'rightTop',
        styles: {
          body: {
            minWidth: 200,
          },
        },
        content: (popover) => {
          return (
            <>
              <FlowModelRenderer model={model} uid={model.uid} />
            </>
          );
        },
      });
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', minHeight: 25, width: '100%' }}
      onClick={handleClick}
    >
      <span>{<FlowModelRenderer model={fieldModel} uid={fieldModel.uid} />}</span>
    </div>
  );
});

export class SubTableColumnModel extends FieldModel {
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
      <div
        className={css`
          .ant-formily-item {
            margin-bottom: 0;
          }
        `}
      >
        {this.mapSubModels('field', (action: EditableFieldModel) => {
          record.__key = record.__key || uid();
          action.enableFormItem = false;
          const fork: any = action.createFork({}, `${record.__key}`);
          fork.context.defineProperty('basePath', {
            get: () => {
              const basePath = (this.parent as FieldModel).fieldPath;
              return `${basePath}.${index}`;
            },
            cache: false,
          });
          if (fork.constructor.isLargeField) {
            fork.applyAutoFlows();
            return (
              <LargeFieldEdit
                model={fork}
                params={{
                  fieldPath: action.fieldPath,
                  index: record.__key,
                }}
                defaultValue={value}
              />
            );
          } else {
            return <FlowModelRenderer model={fork} key={record.__key} />;
          }
        })}
      </div>
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
  key: 'subTableColumnSettings',
  sort: 500,
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

        const currentBlockModel = ctx.model.context.blockModel;
        if (currentBlockModel instanceof EditFormModel) {
          currentBlockModel.addAppends(`${(ctx.model.parent as FieldModel).fieldPath}.${ctx.model.fieldPath}`);
        }
      },
    },
    subModel: {
      title: escapeT('Field component'),
      uiSchema: (ctx) => {
        const classes = [...ctx.model.collectionField.getSubclassesOf('ReadPrettyFieldModel').keys()];
        if (classes.length === 1) {
          return null;
        }
        if (!(ctx.model.subModels.field.constructor as any).isLargeField) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => ({
              label: model,
              value: model,
            })),
          },
        };
      },
      defaultParams: (ctx) => {
        return {
          use: ctx.model.collectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel',
        };
      },
      async handler(ctx, params) {
        const field = ctx.model.collectionField;
        const use = params.use;
        const model = (ctx.model.subModels.field as FieldModel).setSubModel('readPrettyField', {
          use,
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: ctx.model.collectionField.dataSourceKey,
                collectionName: field.collection.name,
                fieldPath: ctx.model.fieldPath,
              },
            },
          },
        });
        await model.applyAutoFlows();
      },
    },
    title: {
      title: escapeT('Column title'),
      uiSchema: (ctx) => {
        return {
          title: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-component-props': {
              placeholder: escapeT('Column title'),
            },
            'x-reactions': (field) => {
              const { model } = ctx;
              const originTitle = model.collectionField?.title;
              field.decoratorProps = {
                ...field.decoratorProps,
                extra: model.context.t('Original field title: ') + (model.context.t(originTitle) ?? ''),
              };
            },
          },
        };
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
