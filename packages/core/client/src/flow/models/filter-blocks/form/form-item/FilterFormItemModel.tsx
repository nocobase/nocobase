/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, escapeT, FlowModelContext, reaction } from '@nocobase/flow-engine';
import { Alert } from 'antd';
import { capitalize, debounce } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldModelRenderer } from '../../../../common/FieldModelRenderer';
import { CollectionFieldItemModel } from '../../../base/CollectionFieldItemModel';
import { FieldModel } from '../../../base/FieldModel';
import { FormItem } from '../../../data-blocks/form/FormItem';
import { FilterManager } from '../../filter-manager/FilterManager';

export const FieldNotAllow = ({ actionName, FieldTitle }) => {
  const { t } = useTranslation();
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for field "{{name}}"`,
      {
        actionName: t(capitalize(actionName)),
        name: FieldTitle,
      },
    ).replaceAll('&gt;', '>');
  }, [FieldTitle, actionName, t]);
  return <Alert type="warning" message={messageValue} showIcon />;
};

export class FilterFormItemModel extends CollectionFieldItemModel {
  static defineChildren(ctx: FlowModelContext) {
    const collection = ctx.collection as Collection;
    return collection.getFields().map((field) => {
      const fieldModel = field.getFirstSubclassNameOf('FormFieldModel') || 'FormFieldModel';
      const fieldPath = field.name;
      return {
        key: field.name,
        label: field.title,
        toggleable: (subModel) => subModel.getStepParams('fieldSettings', 'init')?.fieldPath === field.name,
        useModel: 'FormItemModel',
        createModelOptions: () => ({
          use: 'FormItemModel',
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: collection.dataSourceKey,
                collectionName: collection.name,
                fieldPath,
              },
            },
          },
          subModels: {
            field: {
              use: fieldModel,
            },
          },
        }),
      };
    });
  }

  operator: string;

  private debouncedDoFilter: ReturnType<typeof debounce>;

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

  async destroy(): Promise<boolean> {
    const result = await super.destroy();

    // 清理筛选配置
    const filterManager: FilterManager = this.context.filterManager;
    await filterManager.removeFilterConfig({ filterId: this.uid });

    return result;
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
    if (event.key === 'Enter' || event.keyCode === 13) {
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
    const fieldModel = this.subModels.field as FieldModel;
    return (
      <FormItem {...this.props} getValueProps={this.getValueProps}>
        <FieldModelRenderer model={fieldModel} />
      </FormItem>
    );
  }
  // 设置态隐藏时的占位渲染
  renderHiddenInConfig(): React.ReactNode | undefined {
    return (
      <FormItem {...this.props}>
        <FieldNotAllow actionName={this.context.actionName} FieldTitle={this.props.label} />
      </FormItem>
    );
  }
}

FilterFormItemModel.define({
  sort: 100,
});

FilterFormItemModel.registerFlow({
  key: 'editItemSettings',
  sort: 300,
  title: escapeT('Form item settings'),
  steps: {
    label: {
      title: escapeT('Label'),
      uiSchema: (ctx) => {
        return {
          label: {
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            'x-reactions': (field) => {
              const model = ctx.model;
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
          label: ctx.collectionField.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ label: params.label });
      },
    },
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      async handler(ctx) {
        await ctx.model.applySubModelsAutoFlows('field');
        const collectionField = ctx.model.collectionField;
        if (collectionField) {
          ctx.model.setProps(collectionField.getComponentProps());
        }
        ctx.model.setProps({
          name: `${ctx.model.fieldPath}_${ctx.model.uid}`, // 确保每个字段的名称唯一
        });
      },
    },

    showLabel: {
      title: escapeT('Show label'),
      uiSchema: {
        showLabel: {
          'x-component': 'Switch',
          'x-decorator': 'FormItem',
          'x-component-props': {
            checkedChildren: escapeT('Yes'),
            unCheckedChildren: escapeT('No'),
          },
        },
      },
      defaultParams: {
        showLabel: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ showLabel: params.showLabel });
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
        ctx.model.setProps({ tooltip: params.tooltip });
      },
    },
    description: {
      title: escapeT('Description'),
      uiSchema: {
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
        },
      },
      handler(ctx, params) {
        ctx.model.setProps({ extra: params.description });
      },
    },
    initialValue: {
      title: escapeT('Default value'),
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

    model: {
      use: 'fieldComponent',
      title: escapeT('Field component'),
      uiSchema: (ctx) => {
        const className = ctx.model.getProps().pattern === 'readPretty' ? 'ReadPrettyFieldModel' : 'FormFieldModel';
        const classes = [...ctx.model.collectionField.getSubclassesOf(className).keys()];
        if (classes.length === 1) {
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
    },

    connectFields: {
      use: 'connectFields',
    },
    defaultOperator: {
      use: 'defaultOperator',
    },
  },
});
