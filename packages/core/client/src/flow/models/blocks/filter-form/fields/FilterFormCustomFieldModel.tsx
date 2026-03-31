/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { cloneDeep, debounce, isEqual } from 'lodash';
import { CollectionField, FieldModelRenderer, FlowModelContext, FormItem, tExpr } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import { FieldComponentProps } from './FieldComponentProps';
import { FieldModelSelect } from '../FieldModelSelect';
import { FieldOperatorSelect } from '../FieldOperatorSelect';
import { resolveCustomFieldOperatorList, resolveDefaultCustomFieldOperator } from '../customFieldOperators';
import { FilterFormCustomItemModel } from '../FilterFormCustomItemModel';
import { SourceCascader } from '../SourceCascader';
import { normalizeFilterValueByOperator } from '../valueNormalization';

const validateRecordSelectRequired = (value: any, _rule: any, ctx: any) => {
  if (ctx?.form?.values?.fieldModel !== 'FilterFormCustomRecordSelectFieldModel') {
    return;
  }
  if (value === undefined || value === null || value === '') {
    return ctx?.t?.('The field value is required') || 'The field value is required';
  }
};

export class FilterFormCustomFieldModel extends FilterFormCustomItemModel {
  customFieldModelInstance = null;
  customFieldProps = null;

  operator: string;

  private debouncedDoFilter: ReturnType<typeof debounce>;
  private lastAutoTriggerValue: any;
  private autoTriggerInitialized = false;

  /**
   * Resolve or build collection field context for RecordSelect custom fields.
   *
   * When user creates a custom RecordSelect field, there is no real collection field.
   * We build a lightweight CollectionField with target metadata so downstream
   * flows can render select settings and load remote options.
   *
   * @param ctx - Flow context for current model
   * @param props - Field model props from settings
   * @returns CollectionField instance or undefined when not applicable
   */
  buildRecordSelectCollectionField(ctx: FlowModelContext, props: Record<string, any>) {
    const dataSourceKey = props?.recordSelectDataSourceKey || 'main';
    const targetCollectionName = props?.recordSelectTargetCollection;
    if (!targetCollectionName) return;

    const dataSource = ctx.dataSourceManager?.getDataSource?.(dataSourceKey);
    const targetCollection = dataSource?.getCollection?.(targetCollectionName);
    if (!dataSource || !targetCollection) return;

    const titleFieldName =
      props?.recordSelectTitleField ||
      targetCollection.titleCollectionField?.name ||
      targetCollection.titleCollectionField?.options?.name;
    const valueFieldName = props?.recordSelectValueField || targetCollection.filterTargetKey || 'id';

    const collectionField = new CollectionField({
      name: props?.name || 'recordSelect',
      interface: 'm2o',
      type: 'belongsTo',
      target: targetCollectionName,
      dataSourceKey,
      uiSchema: {
        'x-component': 'Select',
      },
      fieldNames: {
        label: titleFieldName,
        value: valueFieldName,
      },
    });
    collectionField.setCollection(targetCollection);
    return collectionField;
  }

  get defaultTargetUid(): string {
    return this.getStepParams('filterFormItemSettings', 'init').defaultTargetUid;
  }

  onInit(options) {
    super.onInit(options);
    // 创建防抖的 doFilter 方法，延迟 300ms
    this.debouncedDoFilter = debounce(this.doFilter.bind(this), 300);
  }

  onUnmount() {
    super.onUnmount();
    // 取消防抖函数的执行
    this.debouncedDoFilter.cancel();
  }

  doFilter() {
    this.context.filterManager.refreshTargetsByFilter(this.uid);
  }

  doReset() {
    this.context.filterManager.refreshTargetsByFilter(this.uid);
  }

  /**
   * 获取用于显示在筛选条件中的字段值
   * @returns
   */
  getFilterValue() {
    const rawValue = this.customFieldModelInstance?.getFilterValue
      ? this.customFieldModelInstance.getFilterValue()
      : this.context.form?.getFieldValue(this.props.name);
    const operatorMeta = this.getCurrentOperatorMeta();
    const normalizedValue = normalizeFilterValueByOperator(this.operator, rawValue);
    if (operatorMeta?.noValue) {
      const options = operatorMeta?.schema?.['x-component-props']?.options;
      if (Array.isArray(options)) {
        return normalizedValue;
      }
      return true;
    }
    return normalizedValue;
  }

  private getCurrentOperatorMeta() {
    const fieldSettings = this.getStepParams('formItemSettings', 'fieldSettings') || {};
    const fieldModel = fieldSettings.fieldModel;
    const source = fieldSettings.source || [];
    const fieldModelProps = this.customFieldProps || fieldSettings.fieldModelProps || {};
    const operatorList = resolveCustomFieldOperatorList({
      flowEngine: this.flowEngine,
      fieldModel,
      source,
      fieldModelProps,
    });
    const operator = this.operator || fieldSettings.operator;
    if (!operator) return null;
    return operatorList.find((item) => item.value === operator) || null;
  }

  /**
   * 处理回车事件
   * 当用户在输入框中按下回车键时触发筛选
   */
  handleEnterPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // 防止表单提交等默认行为
      this.doFilter(); // 立即执行筛选
    }
  };

  getValueProps(value) {
    if (this.context.blockModel.autoTriggerFilter) {
      if (!this.autoTriggerInitialized) {
        this.autoTriggerInitialized = true;
        this.lastAutoTriggerValue = cloneDeep(value);
      } else if (!isEqual(this.lastAutoTriggerValue, value)) {
        this.lastAutoTriggerValue = cloneDeep(value);
        this.debouncedDoFilter(); // 仅在值变化时触发筛选，避免渲染导致重复请求
      }
    }

    return {
      value,
      onKeyDown: this.handleEnterPress.bind(this), // 添加回车事件监听
    };
  }

  render() {
    if (!this.customFieldModelInstance) {
      return null;
    }

    return (
      <FormItem {...this.props} getValueProps={this.getValueProps.bind(this)}>
        <FieldModelRenderer model={this.customFieldModelInstance} />
      </FormItem>
    );
  }
}

FilterFormCustomFieldModel.define({
  label: '{{t("Custom field")}}',
  sort: 1,
});

FilterFormCustomFieldModel.registerFlow({
  key: 'formItemSettings',
  title: tExpr('Form item settings'),
  steps: {
    fieldSettings: {
      preset: true,
      title: tExpr('Field settings'),
      uiSchema: {
        title: {
          type: 'string',
          title: tExpr('Field title'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        name: {
          type: 'string',
          title: tExpr('Field name'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
          description:
            '{{t("Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.")}}',
        },
        source: {
          type: 'array',
          title: tExpr('Field source'),
          'x-decorator': 'FormItem',
          'x-component': SourceCascader,
          'x-component-props': {
            placeholder: tExpr('Select a source field to use metadata of the field'),
          },
          description: tExpr('Select a source field to use metadata of the field'),
        },
        fieldModel: {
          type: 'string',
          title: tExpr('Field type'),
          'x-component': FieldModelSelect,
          'x-decorator': 'FormItem',
          required: true,
          enum: [
            { label: tExpr('Input'), value: 'InputFieldModel' },
            { label: tExpr('Number'), value: 'NumberFieldModel' },
            { label: tExpr('Date'), value: 'DateTimeFilterFieldModel' },
            { label: tExpr('Select'), value: 'SelectFieldModel' },
            { label: tExpr('Radio group'), value: 'RadioGroupFieldModel' },
            { label: tExpr('Checkbox group'), value: 'CheckboxGroupFieldModel' },
            { label: tExpr('Record select'), value: 'FilterFormCustomRecordSelectFieldModel' },
          ],
          'x-component-props': {
            placeholder: tExpr('Please select'),
            valueMap: {
              RecordSelectFieldModel: 'FilterFormCustomRecordSelectFieldModel',
            },
          },
          'x-reactions': [
            {
              dependencies: ['source'],
              fulfill: {
                state: {
                  componentProps: {
                    source: '{{$deps[0]}}',
                    valueMap: {
                      RecordSelectFieldModel: 'FilterFormCustomRecordSelectFieldModel',
                    },
                  },
                },
              },
            },
          ],
        },
        fieldModelProps: {
          type: 'object',
          title: tExpr('Component properties'),
          'x-component': FieldComponentProps,
          properties: {
            recordSelectTargetCollection: {
              type: 'string',
              'x-validator': validateRecordSelectRequired,
            },
            recordSelectTitleField: {
              type: 'string',
              'x-validator': validateRecordSelectRequired,
            },
            recordSelectValueField: {
              type: 'string',
              'x-validator': validateRecordSelectRequired,
            },
          },
          'x-reactions': [
            {
              dependencies: ['fieldModel', 'source'],
              fulfill: {
                state: {
                  componentProps: {
                    fieldModel: '{{$deps[0]}}',
                    source: '{{$deps[1]}}',
                  },
                },
              },
            },
          ],
        },
        operator: {
          type: 'string',
          title: tExpr('Operator'),
          'x-component': FieldOperatorSelect,
          'x-decorator': 'FormItem',
          required: true,
          'x-reactions': [
            {
              dependencies: ['fieldModel', 'source', 'fieldModelProps'],
              fulfill: {
                state: {
                  componentProps: {
                    fieldModel: '{{$deps[0]}}',
                    source: '{{$deps[1]}}',
                    fieldModelProps: '{{$deps[2] || {}}}',
                  },
                },
              },
            },
          ],
        },
      },
      defaultParams(ctx) {
        return {
          name: `f_${uid().slice(0, 4)}`,
        };
      },
      handler(ctx, params) {
        const { fieldModel, fieldModelProps = {}, title, name, source = [], operator } = params;

        ctx.model.setProps({
          label: title,
          name: name,
        });

        let resolvedFieldModelProps = fieldModelProps;
        let recordSelectCollectionField;
        if (fieldModel === 'FilterFormCustomRecordSelectFieldModel') {
          const allowMultiple =
            fieldModelProps?.allowMultiple === undefined ? true : Boolean(fieldModelProps?.allowMultiple);
          const multiple = fieldModelProps?.multiple === undefined ? allowMultiple : Boolean(fieldModelProps?.multiple);
          resolvedFieldModelProps = {
            ...fieldModelProps,
            allowMultiple,
            multiple,
            valueMode: fieldModelProps?.valueMode || 'value',
          };

          recordSelectCollectionField = ctx.model.buildRecordSelectCollectionField(ctx, {
            ...resolvedFieldModelProps,
            name,
          });
          if (recordSelectCollectionField) {
            const labelField =
              fieldModelProps?.recordSelectTitleField || recordSelectCollectionField.targetCollectionTitleFieldName;
            const valueField =
              fieldModelProps?.recordSelectValueField ||
              recordSelectCollectionField.targetCollection?.filterTargetKey ||
              'id';
            if (labelField && valueField) {
              resolvedFieldModelProps = {
                ...resolvedFieldModelProps,
                fieldNames: {
                  label: labelField,
                  value: valueField,
                },
              };
            }
          }
        }

        if (!ctx.model.customFieldModelInstance) {
          ctx.model.customFieldModelInstance = ctx.model.flowEngine.createModel({
            use: fieldModel,
            props: { allowClear: true, ...resolvedFieldModelProps },
          });
        } else {
          ctx.model.customFieldModelInstance.setProps({ allowClear: true, ...resolvedFieldModelProps });
        }
        if (fieldModel === 'FilterFormCustomRecordSelectFieldModel') {
          const titleFieldParam =
            resolvedFieldModelProps?.recordSelectTitleField || resolvedFieldModelProps?.fieldNames?.label;
          if (titleFieldParam) {
            ctx.model.customFieldModelInstance.setStepParams('selectSettings', 'fieldNames', {
              label: titleFieldParam,
            });
          }
        }
        if (recordSelectCollectionField) {
          ctx.model.customFieldModelInstance.context.defineProperty('collectionField', {
            value: recordSelectCollectionField,
          });
        }

        const operatorList = resolveCustomFieldOperatorList({
          flowEngine: ctx.model.flowEngine,
          fieldModel,
          source,
          fieldModelProps: resolvedFieldModelProps,
        });
        const operatorIsValid = !!operatorList.find((item) => item.value === operator);
        ctx.model.operator =
          (operatorIsValid ? operator : undefined) ||
          resolveDefaultCustomFieldOperator({
            flowEngine: ctx.model.flowEngine,
            fieldModel,
            source,
            fieldModelProps: resolvedFieldModelProps,
          });

        ctx.model.customFieldProps = resolvedFieldModelProps;
      },
    },
    connectFields: {
      use: 'connectFields',
    },
  },
});
