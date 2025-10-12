/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import {
  DisplayItemModel,
  DragHandler,
  Droppable,
  EditableItemModel,
  escapeT,
  FieldModelRenderer,
  FlowModelContext,
  FlowModelRenderer,
  FlowsFloatContextMenu,
  FormItem,
  ModelRenderMode,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { TableColumnProps, Tooltip } from 'antd';
import React, { useRef } from 'react';
import { SubTableFieldModel } from '.';
import { FieldModel } from '../../../base';
import { FormComponent, FormItemModel } from '../../../blocks';
import { EditFormModel } from '../../../blocks/form/EditFormModel';

const LargeFieldEdit = observer(({ model, params: { fieldPath, index }, defaultValue, ...others }: any) => {
  const flowEngine = useFlowEngine();
  const ref = useRef(null);
  const field = model.subModels.readPrettyField as FieldModel;
  const fieldModel = field?.createFork({}, `${index}`);
  fieldModel?.setProps({
    value: defaultValue,
  });

  const FieldModelRendererCom = (props) => {
    const { model, onChange, ...rest } = props;
    const handelChange = (val) => {
      others.onChange(val);
      onChange(val);
    };

    return <FieldModelRenderer model={model} {...rest} onChange={handelChange} />;
  };
  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await flowEngine.context.viewer.open({
        type: 'popover',
        target: e.target,
        placement: 'rightTop',
        styles: {
          body: {
            minWidth: 400,
          },
        },
        content: (popover) => {
          return (
            <FormComponent model={model}>
              <FormItem name={fieldPath} showLabel={false} initialValue={defaultValue}>
                <FieldModelRendererCom model={model} {...others} />
              </FormItem>
            </FormComponent>
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
      <span>{<FlowModelRenderer model={fieldModel} uid={fieldModel?.uid} />}</span>
    </div>
  );
});

export interface SubTableColumnModelStructor {
  parent: SubTableFieldModel;
  subModels: {
    field: FieldModel;
  };
}

export class SubTableColumnModel<
  T extends SubTableColumnModelStructor = SubTableColumnModelStructor,
> extends EditableItemModel<T> {
  static renderMode = ModelRenderMode.RenderFunction;

  renderHiddenInConfig() {
    return (
      <Tooltip title={this.context.t('该字段已被隐藏，你无法查看（该内容仅在激活 UI Editor 时显示）。')}>
        <LockOutlined style={{ opacity: '0.45' }} />
      </Tooltip>
    );
  }

  static defineChildren(ctx: FlowModelContext) {
    const collection = (ctx.model as any).collection || ctx.collection;
    return collection
      .getFields()
      .map((field) => {
        if (!field.interface) {
          return null;
        }
        const binding = this.getDefaultBindingByField(ctx, field, { fallbackToTargetTitleField: true });
        if (!binding) return null;
        const fieldModel = binding.modelName;
        const fullName = ctx.fieldPath ? `${ctx.fieldPath}.${field.name}` : field.name;

        return {
          key: fullName,
          label: field.title,
          refreshTargets: ['SubTableColumnModel/TableJSFieldItemModel'],
          toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === fullName,
          useModel: this.name,
          createModelOptions: () => ({
            use: this.name,
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: collection.dataSourceKey,
                  collectionName: ctx.model.context.blockModel.collection.name,
                  fieldPath: fullName,
                },
              },
            },
            subModels: {
              field: {
                use: fieldModel,
                props:
                  typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps,
              },
            },
          }),
        };
      })
      .filter(Boolean);
  }
  // 让子表列使用父级关联模型的目标集合
  get collection() {
    return this.parent.collection;
  }

  onInit(options: any): void {
    super.onInit(options);
    this.context.defineProperty('resourceName', {
      get: () => {
        return this.context.collectionField.collection.name;
      },
      cache: false,
    });
  }

  async afterAddAsSubModel() {
    await super.afterAddAsSubModel();
    await this.applyAutoFlows();
  }

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
            {this.props.required && (
              <span style={{ color: '#ff4d4f', marginRight: 4, userSelect: 'none', fontFamily: 'SimSun, sans-serif' }}>
                *
              </span>
            )}
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
        key: recordIndex,
        width: this.props.width,
        editable: this.props.editable,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
        model: this,
      }),
      render: this.render(),
      hidden: this.hidden && !this.flowEngine.flowSettings?.enabled,
    };
  }
  render(): any {
    return (props) => {
      const { value, id, rowIdx } = props;
      return (
        <div
          style={{
            width: this.props.width,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={value}
        >
          {this.mapSubModels('field', (action: FieldModel) => {
            const namePath = action.context.fieldPath.split('.').pop();

            const fork: any = action.createFork({}, `${id}`);
            if (this.props.readPretty) {
              fork.setProps({
                value: value,
              });
              return <React.Fragment key={id}>{fork.render()}</React.Fragment>;
            } else {
              return (
                <FormItem
                  {...this.props}
                  key={id}
                  name={[(this.parent as FieldModel).context.fieldPath, rowIdx, namePath]}
                  style={{ marginBottom: 0 }}
                  showLabel={false}
                >
                  {fork.constructor.isLargeField ? (
                    <LargeFieldEdit
                      model={fork}
                      params={{
                        fieldPath: [(this.parent as FieldModel).context.fieldPath, rowIdx, namePath],
                        index: id,
                      }}
                      defaultValue={value}
                    />
                  ) : (
                    <FieldModelRenderer model={fork} id={[(this.parent as FieldModel).context.fieldPath, rowIdx]} />
                  )}
                </FormItem>
              );
            }
          })}
        </div>
      );
    };
  }
}

SubTableColumnModel.define({
  label: escapeT('Table column'),
  icon: 'TableColumn',
  createModelOptions: {
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
        const collectionField = ctx.model.context.collectionField;
        if (!collectionField) {
          return;
        }
        ctx.model.setProps(collectionField.getComponentProps());
        ctx.model.setProps('title', collectionField.title);
        ctx.model.setProps('dataIndex', collectionField.name);
        const currentBlockModel = ctx.model.context.blockModel;
        if (currentBlockModel instanceof EditFormModel) {
          currentBlockModel.addAppends(ctx.model.fieldPath);
        }
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    subModel: {
      title: escapeT('Preview field component'),
      uiSchema: (ctx) => {
        if (!(ctx.model.subModels.field.constructor as any).isLargeField) {
          return null;
        }
        const classes = DisplayItemModel.getBindingsByField(ctx, ctx.model.collectionField);
        if (classes.length === 1) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => {
              const m = ctx.engine.getModelClass(model.modelName);
              return {
                label: m.meta?.label || model.modelName,
                value: model.modelName,
                defaultProps: model.defaultProps,
              };
            }),
          },
        };
      },
      defaultParams: (ctx) => {
        const model = DisplayItemModel.getDefaultBindingByField(ctx, ctx.model.collectionField);
        return {
          use: model?.modelName,
        };
      },
      async handler(ctx, params) {
        if (!(ctx.model.subModels.field.constructor as any).isLargeField) {
          return null;
        }
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
    initialValue: {
      title: escapeT('Default value'),
      // 子表格子表单内不提供“默认值”配置：返回空对象，避免渲染任何字段
      uiSchema: {},
      // 不提供默认参数
      defaultParams: () => ({}),
      // 禁止写入初始值
      handler() {},
    },
    required: {
      title: escapeT('Required'),
      use: 'required',
    },
    model: {
      use: 'fieldComponent',
      title: escapeT('Field component'),
    },
    pattern: {
      title: escapeT('Display mode'),
      use: 'pattern',
    },
    fixed: {
      title: escapeT('Fixed'),
      use: 'fixed',
    },
  },
});

SubTableColumnModel.define({
  hide: true,
  label: escapeT('Table column'),
});
