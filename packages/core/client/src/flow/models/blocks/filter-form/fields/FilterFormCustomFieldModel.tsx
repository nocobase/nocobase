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
import { escapeT, FieldModelRenderer, FormItem } from '@nocobase/flow-engine';
import { FieldComponentProps } from './FieldComponentProps';
import { debounce } from 'lodash';
import { SourceCascader } from '../SourceCascader';

export class FilterFormCustomFieldModel extends FilterFormCustomItemModel {
  fieldModelInstance = null;

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
    return this.context.form?.getFieldValue(this.props.name);
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
    if (!this.fieldModelInstance) {
      return null;
    }

    return (
      <FormItem {...this.props} getValueProps={this.getValueProps.bind(this)}>
        <FieldModelRenderer model={this.fieldModelInstance} />
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
  title: escapeT('Form item settings'),
  steps: {
    fieldSettings: {
      preset: true,
      title: escapeT('Field Settings'),
      uiSchema: {
        title: {
          type: 'string',
          title: escapeT('Field title'),
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          required: true,
        },
        source: {
          type: 'array',
          title: escapeT('Field source'),
          'x-decorator': 'FormItem',
          'x-component': SourceCascader,
          'x-component-props': {
            placeholder: escapeT('Select a source field to use metadata of the field'),
          },
          description: escapeT('Select a source field to use metadata of the field'),
        },
        fieldModel: {
          type: 'string',
          title: escapeT('Field model'),
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          required: true,
          enum: [
            { label: escapeT('Input'), value: 'InputFieldModel' },
            { label: escapeT('Number'), value: 'NumberFieldModel' },
            { label: escapeT('Date'), value: 'DateTimeFilterFieldModel' },
            { label: escapeT('Select'), value: 'SelectFieldModel' },
            { label: escapeT('Radio group'), value: 'RadioGroupFieldModel' },
            { label: escapeT('Checkbox group'), value: 'CheckboxGroupFieldModel' },
            { label: escapeT('Record select'), value: 'RecordSelectFieldModel' },
          ],
          'x-component-props': {
            placeholder: escapeT('Please select'),
          },
        },
        fieldModelProps: {
          type: 'object',
          title: escapeT('Component properties'),
          'x-component': FieldComponentProps,
          'x-reactions': [
            {
              dependencies: ['fieldModel'],
              fulfill: {
                state: {
                  componentProps: {
                    fieldModel: '{{$deps[0]}}',
                  },
                },
              },
            },
          ],
        },
      },
      handler(ctx, params) {
        const { fieldModel, fieldModelProps = {}, title } = params;
        ctx.model.setProps({
          label: title,
          name: ctx.model.uid,
        });

        if (!ctx.model.fieldModelInstance) {
          ctx.model.fieldModelInstance = ctx.model.flowEngine.createModel({
            use: fieldModel,
            props: { allowClear: true, ...fieldModelProps },
          });
        } else {
          ctx.model.fieldModelInstance.setProps({ allowClear: true, ...fieldModelProps });
        }
      },
    },
    connectFields: {
      use: 'connectFields',
    },
  },
});
