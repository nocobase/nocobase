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
import { observer } from '@formily/react';
import {
  DragHandler,
  Droppable,
  escapeT,
  FlowModelRenderer,
  FlowsFloatContextMenu,
  useFlowEngine,
} from '@nocobase/flow-engine';
import { omitBy, isUndefined } from 'lodash';
import { TableColumnProps, Tooltip, Form } from 'antd';
import React, { useEffect, useRef } from 'react';
import { FieldModel } from '../../../../base/FieldModel';
import { EditFormModel } from '../../../../data-blocks/form/EditFormModel';
import { EditableFieldModel } from '../../EditableFieldModel';
import { FieldModelRenderer } from '../../../FieldModelRenderer';
import { FormItem } from '../../../../data-blocks/form/FormItem/FormItem';

const LargeFieldEdit = observer(({ model, params: { fieldPath, index }, defaultValue, ...others }: any) => {
  const flowEngine = useFlowEngine();
  const [form] = Form.useForm();
  const ref = useRef(null);
  const field = model.subModels.readPrettyField as FieldModel;
  const fieldModel = field?.createFork({}, `${index}`);
  fieldModel.context.defineProperty('fieldValue', {
    get: () => {
      return others.value;
    },
    cache: false,
  });
  fieldModel.setProps({
    value: others.value,
  });
  const FieldModelRendererCom = (props) => {
    const { model, id, value, onChange, ['aria-describedby']: ariaDescribedby, path, ...rest } = props;

    useEffect(() => {
      const handelChange = (val) => {
        others.onChange(val);
        onChange(val);
      };
      model.setProps({ id, value, onChange: handelChange, ['aria-describedby']: ariaDescribedby, path });
    }, [model, id, value, ariaDescribedby, onChange]);

    return <FlowModelRenderer model={model} {...rest} />;
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
          model.setProps({ name: others.id });
          return (
            <Form form={form}>
              <Form.Item name={fieldPath} style={{ marginBottom: 0 }} initialValue={others.value}>
                <FieldModelRendererCom model={model} />
              </Form.Item>
            </Form>
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
        width: this.props.width,
        editable: this.props.editable,
        dataIndex: this.props.dataIndex,
        title: this.props.title,
        model: this,
      }),
      render: this.render(),
    };
  }
  render() {
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
          {this.mapSubModels('field', (action: EditableFieldModel) => {
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
                  name={[(this.parent as EditableFieldModel).fieldPath, rowIdx, action.fieldPath]}
                  style={{ marginBottom: 0 }}
                  initialValue={value}
                >
                  {fork.constructor.isLargeField ? (
                    <LargeFieldEdit
                      model={fork}
                      params={{
                        fieldPath: [(this.parent as EditableFieldModel).fieldPath, rowIdx, action.fieldPath],
                        index: id,
                      }}
                      defaultValue={value}
                    />
                  ) : (
                    <FieldModelRenderer model={fork} id={[(this.parent as EditableFieldModel).fieldPath, rowIdx]} />
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
        const collectionField = ctx.model.collectionField;
        const props = ctx.model.getProps();
        if (!collectionField) {
          return;
        }
        const fieldInterface = collectionField.interface;
        if (collectionField) {
          const { type, target } = collectionField;
          ctx.model.setProps(
            omitBy(
              {
                options: collectionField.enum.length ? collectionField.enum : props.options,
                ...collectionField.getComponentProps(),
                mode: collectionField.type === 'array' ? 'multiple' : props.mode,
                multiple: target ? ['belongsToMany', 'hasMany'].includes(type) : props.multiple,
                maxCount: target && !['belongsToMany', 'hasMany'].includes(type) ? 1 : undefined,
                valuePropName: fieldInterface === 'checkbox' ? 'checked' : 'value',
              },
              isUndefined,
            ),
          );
        }
        ctx.model.setProps('title', collectionField.title);
        ctx.model.setProps('dataIndex', collectionField.name);
        await ctx.model.applySubModelsAutoFlows('field');
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
    initialValue: {
      title: escapeT('Default value'),
      uiSchema: {
        defaultValue: {
          'x-component': 'DefaultValue',
          'x-decorator': 'FormItem',
        },
      },
      defaultParams: (ctx) => ({
        defaultValue: ctx.model.collectionField.defaultValue,
      }),
      handler(ctx, params) {
        ctx.model.setProps({ initialValue: params.defaultValue });
      },
    },
    required: {
      title: escapeT('Required'),
      use: 'required',
    },
    pattern: {
      title: escapeT('Display mode'),
      uiSchema: (ctx) => {
        return {
          pattern: {
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: [
              {
                value: 'editable',
                label: escapeT('Editable'),
              },
              {
                value: 'disabled',
                label: escapeT('Disabled'),
              },

              {
                value: 'readPretty',
                label: escapeT('Display only'),
              },
            ],
          },
        };
      },
      defaultParams: (ctx) => ({
        pattern: ctx.model.collectionField.readonly ? 'disabled' : 'editable',
      }),
      async handler(ctx, params) {
        if (params.pattern === 'readPretty') {
          const use =
            ctx.model.collectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
          const model = ctx.model.setSubModel('field', {
            use: use,
            stepParams: {
              fieldSettings: {
                init: ctx.model.getFieldSettingsInitParams(),
              },
            },
          });
          await model.applyAutoFlows();
          ctx.model.setProps({
            readPretty: true,
          });
        } else {
          const use = ctx.model.collectionField.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel';
          const subModel = ctx.model.subModels.field as FieldModel;
          if (use !== subModel.use) {
            const model = ctx.model.setSubModel('field', {
              use: use,
              stepParams: {
                fieldSettings: {
                  init: ctx.model.getFieldSettingsInitParams(),
                },
              },
            });
            await model.applyAutoFlows();
          }
          subModel.setProps({
            disabled: params.pattern === 'disabled',
            editable: params.pattern === 'editable',
          });
        }
      },
    },
  },
});

SubTableColumnModel.define({
  hide: true,
});
