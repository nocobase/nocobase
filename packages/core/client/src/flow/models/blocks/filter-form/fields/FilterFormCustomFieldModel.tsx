/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { FilterFormCustomItemModel } from '../FilterFormCustomItemModel';
import { tExpr, FieldModelRenderer, FormItem } from '@nocobase/flow-engine';
import { FieldComponentProps } from './FieldComponentProps';
import { debounce } from 'lodash';
import { SourceCascader } from '../SourceCascader';
import { FieldModelSelect } from '../FieldModelSelect';
import { uid } from '@nocobase/utils/client';
import { normalizeFilterValueByOperator } from '../valueNormalization';

export class FilterFormCustomFieldModel extends FilterFormCustomItemModel {
  customFieldModelInstance = null;
  customFieldProps = null;

  operator: string;

  private debouncedDoFilter: ReturnType<typeof debounce>;

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
    const rawValue = this.context.form?.getFieldValue(this.props.name);
    return normalizeFilterValueByOperator(this.operator, rawValue);
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
      this.debouncedDoFilter(); // 当值发生变化时，触发一次筛选
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
          title: tExpr('Field model'),
          'x-component': FieldModelSelect,
          'x-decorator': 'FormItem',
          required: true,
          enum: [
            { label: 'Input', value: 'InputFieldModel' },
            { label: 'Number', value: 'NumberFieldModel' },
            { label: 'Date', value: 'DateTimeFilterFieldModel' },
            { label: 'Select', value: 'SelectFieldModel' },
            { label: 'Radio group', value: 'RadioGroupFieldModel' },
            { label: 'Checkbox group', value: 'CheckboxGroupFieldModel' },
            { label: 'Record select', value: 'RecordSelectFieldModel' },
          ],
          'x-component-props': {
            placeholder: tExpr('Please select'),
          },
          'x-reactions': [
            {
              dependencies: ['source'],
              fulfill: {
                state: {
                  componentProps: {
                    source: '{{$deps[0]}}',
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
      },
      defaultParams(ctx) {
        return {
          name: `f_${uid().slice(0, 4)}`,
        };
      },
      handler(ctx, params) {
        const { fieldModel, fieldModelProps = {}, title, name } = params;
        ctx.model.setProps({
          label: title,
          name: name,
        });

        if (!ctx.model.customFieldModelInstance) {
          ctx.model.customFieldModelInstance = ctx.model.flowEngine.createModel({
            use: fieldModel,
            props: { allowClear: true, ...fieldModelProps },
          });
        } else {
          ctx.model.customFieldModelInstance.setProps({ allowClear: true, ...fieldModelProps });
        }

        if (fieldModel === 'DateTimeFilterFieldModel' && fieldModelProps.isRange) {
          ctx.model.operator = '$dateBetween';
        } else {
          ctx.model.operator = undefined;
        }

        ctx.model.customFieldProps = fieldModelProps;
      },
    },
    connectFields: {
      use: 'connectFields',
    },
    initialValue: {
      title: tExpr('Default value'),
      uiSchema: (ctx) => {
        return {
          defaultValue: {
            'x-component': 'DefaultValue',
            'x-decorator': 'FormItem',
          },
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ initialValue: params.defaultValue });
      },
    },
  },
});
