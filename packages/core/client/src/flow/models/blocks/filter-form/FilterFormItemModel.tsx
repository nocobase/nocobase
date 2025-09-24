/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Collection,
  escapeT,
  FieldModelRenderer,
  FilterableItemModel,
  FlowModelContext,
  FormItem,
} from '@nocobase/flow-engine';
import { Empty } from 'antd';
import _, { debounce } from 'lodash';
import React from 'react';
import { CollectionBlockModel, FieldModel } from '../../base';
import { getAllDataModels } from '../filter-manager/utils';
import { FilterFormFieldModel } from './fields';

const getModelFields = async (model: CollectionBlockModel) => {
  const collection = model.context.collection as Collection;
  const fields = (await model?.getFilterFields()) || [];
  return fields
    .map((field: any) => {
      const binding = FilterableItemModel.getDefaultBindingByField(model.context, field);
      if (!binding) {
        return;
      }
      const fieldModel = binding.modelName;
      const fieldPath = field.name;
      return {
        key: field.name,
        label: field.title,
        useModel: 'FilterFormItemModel',
        refreshTargets: ['FormCustomItemModel/FormJSFieldItemModel'],
        createModelOptions: () => ({
          use: 'FilterFormItemModel',
          stepParams: {
            fieldSettings: {
              init: {
                dataSourceKey: collection?.dataSourceKey,
                collectionName: collection?.name,
                fieldPath,
              },
            },
            filterFormItemSettings: {
              label: {
                label: field.title,
              },
              init: {
                filterField: _.pick(field, ['name', 'title', 'interface', 'type']),
                defaultTargetUid: model.uid,
              },
            },
          },
          subModels: {
            field: {
              use: fieldModel,
              props:
                typeof binding.defaultProps === 'function'
                  ? binding.defaultProps(model.context, field)
                  : binding.defaultProps,
            },
          },
        }),
      };
    })
    .filter(Boolean);
};

export class FilterFormItemModel extends FilterableItemModel<{
  subModels: {
    field: FilterFormFieldModel & { getFilterValue?: () => any };
  };
}> {
  static defineChildren(ctx: FlowModelContext) {
    // 1. 找到当前页面的 GridModel 实例
    const gridModelInstance = ctx.blockGridModel;
    if (!gridModelInstance) {
      return [];
    }

    // 2. 获取所有的数据区块的实例
    const allModelInstances = getAllDataModels(gridModelInstance);

    if (allModelInstances.length === 0) {
      return [
        {
          key: 'no-data-blocks',
          label: (
            <Empty
              style={{ width: 140 }}
              description={ctx.t('Please add a data block on the page first')}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
          disabled: true,
        },
      ];
    }

    return allModelInstances.map((model: CollectionBlockModel) => {
      return {
        key: model.uid,
        label: `${model.title} #${model.uid.substring(0, 4)}`,
        children: async () => {
          return [
            {
              key: 'fields',
              label: 'Fields',
              type: 'group' as const,
              searchable: true,
              searchPlaceholder: 'Search fields',
              children: await getModelFields(model),
            },
          ];
        },
      };
    });
  }

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
    if (this.subModels.field.getFilterValue) {
      return this.subModels.field.getFilterValue();
    }

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
      isRange: this.operator === '$dateBetween',
    };
  }

  render() {
    const fieldModel = this.subModels.field as FieldModel;
    return (
      <FormItem {...this.props} getValueProps={this.getValueProps.bind(this)}>
        <FieldModelRenderer model={fieldModel} />
      </FormItem>
    );
  }
}

FilterFormItemModel.define({
  label: 'Block list',
});

FilterFormItemModel.registerFlow({
  key: 'filterFormItemSettings',
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
              const originTitle = model.collectionField?.title || ctx.filterField?.title;
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
          label: ctx.collectionField?.title || ctx.filterField?.title,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ label: params.label });
      },
    },
    // aclCheck: {
    //   use: 'aclCheck',
    // },
    init: {
      async handler(ctx, params) {
        const collectionField = ctx.model.collectionField;
        if (collectionField?.getComponentProps) {
          ctx.model.setProps(collectionField.getComponentProps());
        }
        ctx.model.setProps({
          name: `${ctx.model.fieldPath}_${ctx.model.uid}`, // 确保每个字段的名称唯一
        });
        ctx.model.context.defineProperty('filterField', {
          value: params.filterField,
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
        const classes = FilterableItemModel.getBindingsByField(ctx, ctx.collectionField);
        if (classes.length === 1) {
          return null;
        }
        return {
          use: {
            type: 'string',
            'x-component': 'Select',
            'x-decorator': 'FormItem',
            enum: classes.map((model) => ({
              label: model.modelName,
              value: model.modelName,
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

FilterFormItemModel.registerFlow({
  key: 'fieldSettings',
  title: escapeT('Field settings'),
  steps: {
    init: {
      // 去掉 CollectionFieldModel 的一些报错信息，
      // 筛选这里 dataSourceKey, collectionName, fieldPath 不是必须的
      handler(ctx, params) {},
    },
  },
});
