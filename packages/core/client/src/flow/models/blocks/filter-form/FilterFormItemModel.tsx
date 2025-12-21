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
  tExpr,
  FieldModelRenderer,
  FilterableItemModel,
  FlowModelContext,
  FormItem,
} from '@nocobase/flow-engine';
import { Empty } from 'antd';
import _, { debounce } from 'lodash';
import React from 'react';
import { CollectionBlockModel, FieldModel } from '../../base';
import { getAllDataModels, getDefaultOperator } from '../filter-manager/utils';
import { FilterFormFieldModel } from './fields';
import { FilterManager } from '../filter-manager';

const getModelFields = async (model: CollectionBlockModel) => {
  // model.collection 是普通区块，model.context.collection 是图表区块 / 代理区块（如 ReferenceBlockModel）, 为啥不统一？
  const collection = (model as any).collection || (model.context.collection as Collection);
  const fields = (await model?.getFilterFields?.()) || [];
  return fields
    .map((field: any) => {
      // 为筛选场景创建新的上下文实例，委托到原 context 并补充 flags
      const ctxWithFlags = new FlowModelContext(model);
      ctxWithFlags.addDelegate(model.context);
      ctxWithFlags.defineProperty('flags', {
        value: { ...model.context?.flags, isInFilterFormBlock: true },
      });
      const binding = FilterableItemModel.getDefaultBindingByField(ctxWithFlags, field);
      if (!binding) {
        return;
      }
      const fieldModel = binding.modelName;
      const fieldPath = field.name;
      return {
        key: field.name,
        label: field.title,
        useModel: 'FilterFormItemModel',
        refreshTargets: ['FilterFormCustomItemModel'],
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
        label: (
          <span
            style={{ margin: '-5px -24px -5px -12px', padding: '5px 24px 5px 12px' }}
            onMouseEnter={() => {
              const modelEl = model.context.ref?.current;
              if (modelEl instanceof HTMLElement) {
                modelEl.style.outline = `2px solid ${model.context.themeToken.colorPrimaryBorder}`;
              }
            }}
            onMouseLeave={() => {
              const modelEl = model.context.ref?.current;
              if (modelEl instanceof HTMLElement) {
                modelEl.style.outline = 'none';
              }
            }}
          >{`${model.title} #${model.uid.substring(0, 4)}`}</span>
        ),
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

  private getCurrentOperatorMeta() {
    const operator = getDefaultOperator(this);
    if (!operator) return null;

    const operatorList = this.collectionField?.filterable?.operators;

    if (!Array.isArray(operatorList)) {
      return null;
    }

    return operatorList.find((op) => op.value === operator) || null;
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
    const filterManager: FilterManager = this.context.filterManager;
    filterManager.refreshTargetsByFilter(this.uid);
  }

  doReset() {
    const filterManager: FilterManager = this.context.filterManager;
    filterManager.refreshTargetsByFilter(this.uid);
  }

  /**
   * 获取用于显示在筛选条件中的字段值
   * @returns
   */
  getFilterValue() {
    const defaultValue = this.getStepParams('filterFormItemSettings', 'initialValue').defaultValue;
    const fieldValue = this.subModels.field.getFilterValue
      ? this.subModels.field.getFilterValue()
      : this.context.form?.getFieldValue(this.props.name);
    const rawValue = _.isEmpty(fieldValue) ? defaultValue : fieldValue;

    const operatorMeta = this.getCurrentOperatorMeta();
    if (operatorMeta?.noValue) {
      const options = operatorMeta?.schema?.['x-component-props']?.options;
      if (Array.isArray(options)) {
        return rawValue;
      }
      return true;
    }

    return rawValue;
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
  label: tExpr('Block list'),
});

FilterFormItemModel.registerFlow({
  key: 'filterFormItemSettings',
  sort: 300,
  title: tExpr('Form item settings'),
  steps: {
    label: {
      title: tExpr('Label'),
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
          const componentProps = collectionField.getComponentProps();
          const { rules, required, ...restProps } = componentProps || {};

          // 筛选表单不继承字段的后端校验
          ctx.model.setProps({ ...restProps, rules: undefined, required: undefined });
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
      title: tExpr('Show label'),
      uiMode: { type: 'switch', key: 'showLabel' },
      defaultParams: {
        showLabel: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ showLabel: params.showLabel });
      },
    },
    tooltip: {
      title: tExpr('Tooltip'),
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
      title: tExpr('Description'),
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
    model: {
      use: 'fieldComponent',
      title: tExpr('Field component'),
      uiMode(ctx) {
        const classes = FilterableItemModel.getBindingsByField(ctx, ctx.collectionField);
        const t = ctx.t;
        return {
          type: 'select',
          key: 'use',
          props: {
            options: classes.map((model) => ({
              label: t(model.modelName),
              value: model.modelName,
            })),
          },
        };
      },
      hideInSettings(ctx) {
        const classes = FilterableItemModel.getBindingsByField(ctx, ctx.collectionField);
        if (classes.length === 1) {
          return true;
        }
      },
    },
    connectFields: {
      use: 'connectFields',
    },
    defaultOperator: {
      use: 'defaultOperator',
    },
    operatorComponentProps: {
      use: 'operatorComponentProps',
    },
    customizeFilterRender: {
      use: 'customizeFilterRender',
    },
  },
});

FilterFormItemModel.registerFlow({
  key: 'fieldSettings',
  title: tExpr('Field settings'),
  steps: {
    init: {
      // 去掉 CollectionFieldModel 的一些报错信息，
      // 筛选这里 dataSourceKey, collectionName, fieldPath 不是必须的
      handler(ctx, params) {},
    },
  },
});
