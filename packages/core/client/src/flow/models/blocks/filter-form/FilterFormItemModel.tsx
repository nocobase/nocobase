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
import _, { cloneDeep, debounce, isEqual } from 'lodash';
import React from 'react';
import { CollectionBlockModel, FieldModel } from '../../base';
import { RecordSelectFieldModel } from '../../fields/AssociationFieldModel/RecordSelectFieldModel';
import { getAllDataModels, getDefaultOperator } from '../filter-manager/utils';
import { FilterFormFieldModel } from './fields';
import { FilterManager } from '../filter-manager';
import { normalizeFilterValueByOperator } from './valueNormalization';

const getAssociationTargetCollection = (field: any, collection?: Collection, model?: CollectionBlockModel) => {
  if (field?.targetCollection) {
    return field.targetCollection;
  }
  const targetName = field?.target;
  if (!targetName) {
    return;
  }
  if (collection?.dataSource?.getCollection) {
    return collection.dataSource.getCollection(targetName);
  }
  const dataSourceKey = collection?.dataSourceKey;
  if (dataSourceKey && model?.context?.dataSourceManager?.getCollection) {
    return model.context.dataSourceManager.getCollection(dataSourceKey, targetName);
  }
};

const getTargetFilterableFields = (field: any, collection?: Collection, model?: CollectionBlockModel) => {
  const targetCollection = getAssociationTargetCollection(field, collection, model);
  if (!targetCollection?.getFields) {
    return [];
  }
  return (targetCollection.getFields() || []).filter((childField: any) => childField?.filterable);
};

const MAX_ASSOCIATION_DEPTH = 5;

const normalizeAssociationDefaultFilterValue = (value: any, fieldModel: any) => {
  const collectionField = fieldModel?.context?.collectionField;
  if (!collectionField?.isAssociationField?.()) {
    return value;
  }

  const fieldNames = fieldModel?.props?.fieldNames || collectionField?.fieldNames || {};
  const valueKey =
    fieldNames?.value ||
    collectionField?.targetKey ||
    collectionField?.targetCollection?.filterTargetKey ||
    collectionField?.collection?.filterTargetKey ||
    'id';
  const pickValue = (item: any) => {
    const target = item && typeof item === 'object' && typeof item?.data !== 'undefined' ? item.data : item;
    if (!target || typeof target !== 'object') {
      return target;
    }
    if (typeof target?.[valueKey] !== 'undefined') {
      return target[valueKey];
    }
    if (typeof target?.id !== 'undefined') {
      return target.id;
    }
    if (typeof target?.value !== 'undefined') {
      return target.value;
    }
    return target;
  };

  if (Array.isArray(value)) {
    return value.map(pickValue);
  }

  return pickValue(value);
};

const buildFilterFormFieldItem = ({
  model,
  collection,
  ctxWithFlags,
  field,
  fieldPath,
  labelPrefix,
}: {
  model: CollectionBlockModel;
  collection: Collection | undefined;
  ctxWithFlags: FlowModelContext;
  field: any;
  fieldPath: string;
  labelPrefix?: string;
}) => {
  const binding = FilterableItemModel.getDefaultBindingByField(ctxWithFlags, field);
  if (!binding) {
    return;
  }
  const isAssociation =
    typeof field?.isAssociationField === 'function' ? field.isAssociationField() : Boolean(field?.target);
  const fieldModel =
    isAssociation && ctxWithFlags.engine?.getModelClass?.('FilterFormRecordSelectFieldModel')
      ? 'FilterFormRecordSelectFieldModel'
      : binding.modelName;
  const label = field.title || field.name;
  const displayLabel = labelPrefix ? `${labelPrefix} / ${label}` : label;
  return {
    key: fieldPath,
    label: displayLabel,
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
};

const buildAssociationFieldMenuItem = ({
  model,
  collection,
  ctxWithFlags,
  field,
  fieldPath,
  depth,
}: {
  model: CollectionBlockModel;
  collection: Collection | undefined;
  ctxWithFlags: FlowModelContext;
  field: any;
  fieldPath: string;
  depth: number;
}) => {
  const targetCollection = getAssociationTargetCollection(field, collection, model);
  if (!targetCollection) {
    return;
  }
  if (depth > MAX_ASSOCIATION_DEPTH) {
    return;
  }

  const label = field.title || field.name;
  const t = model.context?.t || ctxWithFlags?.t || ((value: string) => value);

  return {
    key: `${fieldPath}-associationField`,
    label,
    children: async () => {
      const targetFields = getTargetFilterableFields(field, collection, model);
      const fieldItems: any[] = [];
      const associationItems: any[] = [];

      targetFields.forEach((targetField: any) => {
        const targetFieldPath = `${fieldPath}.${targetField.name}`;
        if (targetField?.targetCollection) {
          const associationItem = buildAssociationFieldMenuItem({
            model,
            collection,
            ctxWithFlags,
            field: targetField,
            fieldPath: targetFieldPath,
            depth: depth + 1,
          });
          if (associationItem) {
            associationItems.push(associationItem);
          }
          return;
        }

        const targetItem = buildFilterFormFieldItem({
          model,
          collection,
          ctxWithFlags,
          field: targetField,
          fieldPath: targetFieldPath,
        });
        if (targetItem) {
          fieldItems.push(targetItem);
        }
      });

      const groups: any[] = [];

      if (fieldItems.length) {
        groups.push({
          key: `${fieldPath}-fields`,
          label: t('Fields'),
          type: 'group' as const,
          searchable: true,
          searchPlaceholder: t('Search fields'),
          children: fieldItems,
        });
      }

      if (associationItems.length) {
        groups.push({
          key: `${fieldPath}-relation-fields`,
          label: t('Association fields'),
          type: 'group' as const,
          searchable: true,
          searchPlaceholder: t('Search association fields'),
          children: associationItems,
        });
      }

      if (groups.length) {
        return groups;
      }

      return [
        {
          key: `${fieldPath}-empty`,
          label: <Empty style={{ width: 140 }} description={t('No data')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          disabled: true,
        },
      ];
    },
  };
};

const getModelFieldGroups = async (model: CollectionBlockModel) => {
  // model.collection 是普通区块，model.context.collection 是图表区块 / 代理区块（如 ReferenceBlockModel）, 为啥不统一？
  const collection = (model as any).collection || (model.context.collection as Collection);
  const fields = (await model?.getFilterFields?.()) || [];
  // 为筛选场景创建新的上下文实例，委托到原 context 并补充 flags
  const ctxWithFlags = new FlowModelContext(model);
  ctxWithFlags.addDelegate(model.context);
  ctxWithFlags.defineProperty('flags', {
    value: { ...model.context?.flags, isInFilterFormBlock: true },
  });

  const baseItems: any[] = [];
  const relationItems: any[] = [];

  fields.forEach((field: any) => {
    const baseFieldPath = field.name;
    const baseItem = buildFilterFormFieldItem({
      model,
      collection,
      ctxWithFlags,
      field,
      fieldPath: baseFieldPath,
    });
    if (baseItem) {
      baseItems.push(baseItem);
    }

    if (field?.targetCollection) {
      const associationItem = buildAssociationFieldMenuItem({
        model,
        collection,
        ctxWithFlags,
        field,
        fieldPath: baseFieldPath,
        depth: 1,
      });
      if (associationItem) {
        relationItems.push(associationItem);
      }
    }
  });

  return {
    baseItems: baseItems.filter(Boolean),
    relationItems: relationItems.filter(Boolean),
  };
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
          const { baseItems, relationItems } = await getModelFieldGroups(model);
          const groups: any[] = [
            {
              key: 'fields',
              label: ctx.t('Fields'),
              type: 'group' as const,
              searchable: true,
              searchPlaceholder: ctx.t('Search fields'),
              children: baseItems,
            },
          ];

          if (relationItems.length) {
            groups.push({
              key: 'relation-fields',
              label: ctx.t('Association fields'),
              type: 'group' as const,
              searchable: true,
              searchPlaceholder: ctx.t('Search association fields'),
              children: relationItems,
            });
          }

          return [...groups];
        },
      };
    });
  }

  operator: string;
  mounted = false;

  private debouncedDoFilter: ReturnType<typeof debounce>;
  private lastAutoTriggerValue: any;
  private autoTriggerInitialized = false;

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

  onMount(): void {
    super.onMount();
    this.mounted = true;
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
    const fieldModel = this.subModels.field as FieldModel & { getFilterValue?: () => any };
    const fieldValue = fieldModel.getFilterValue
      ? fieldModel.getFilterValue()
      : this.context.form?.getFieldValue(this.props.name);

    let rawValue = fieldValue;

    if (!this.mounted) {
      const sourceValue = _.isEmpty(fieldValue) ? this.getDefaultValue() : fieldValue;
      rawValue = normalizeAssociationDefaultFilterValue(sourceValue, this.subModels?.field);
    }

    const operator = getDefaultOperator(this);
    rawValue = this.normalizeAssociationFilterValue(rawValue, fieldModel);
    const operatorMeta = this.getCurrentOperatorMeta();
    if (operatorMeta?.noValue) {
      const options = operatorMeta?.schema?.['x-component-props']?.options;
      if (Array.isArray(options)) {
        return rawValue;
      }
      return true;
    }

    return normalizeFilterValueByOperator(operator, rawValue);
  }

  normalizeAssociationFilterValue(value: any, fieldModel: FieldModel) {
    if (value === null || typeof value === 'undefined') {
      return value;
    }
    const collectionField = (fieldModel as any)?.context?.collectionField;
    const isAssociation =
      typeof collectionField?.isAssociationField === 'function'
        ? collectionField.isAssociationField()
        : !!collectionField?.target;
    if (!isAssociation) {
      return value;
    }
    const valueKey = collectionField?.targetKey || collectionField?.targetCollection?.filterTargetKey || 'id';
    if (Array.isArray(value)) {
      if (value.length === 0) return value;
      return value.map((item) => (item && typeof item === 'object' ? item[valueKey] : item));
    }
    if (typeof value === 'object') {
      return (value as any)?.[valueKey];
    }
    return value;
  }

  getDefaultValue() {
    return this.getStepParams('filterFormItemSettings', 'initialValue')?.defaultValue;
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
      if (!this.autoTriggerInitialized) {
        this.autoTriggerInitialized = true;
        this.lastAutoTriggerValue = cloneDeep(value);
      } else if (!isEqual(this.lastAutoTriggerValue, value)) {
        this.lastAutoTriggerValue = cloneDeep(value);
        this.debouncedDoFilter(); // 当值发生变化时，触发一次筛选
      }
    }

    return {
      value,
      onKeyDown: this.handleEnterPress.bind(this), // 添加回车事件监听
      isRange: this.operator === '$dateBetween',
    };
  }

  renderItem() {
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
                extra: model.context.t('Original field title: ') + originTitle,
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
        if (params.label && params.label === ctx.collectionField?.title) {
          ctx.model.setProps({ label: params.label });
        } else {
          ctx.model.setProps({ label: ctx.t(params.label, { ns: 'lm-flow-engine' }) });
        }
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
          const fieldModel = ctx.model.subModels?.field;
          const shouldIgnoreMultiple = fieldModel instanceof RecordSelectFieldModel;
          const { rules, required, multiple, allowMultiple, maxCount, ...restProps } = componentProps || {};

          // 筛选表单不继承字段的后端校验
          ctx.model.setProps({
            ...(shouldIgnoreMultiple ? restProps : { ...restProps, multiple, allowMultiple, maxCount }),
            rules: undefined,
            required: undefined,
          });
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
        ctx.model.setProps({ tooltip: ctx.t(params.tooltip, { ns: 'lm-flow-engine' }) });
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
        ctx.model.setProps({
          extra: ctx.t(params.description, { ns: 'lm-flow-engine' }),
        });
      },
    },
    initialValue: {
      title: tExpr('Default value'),
      // 默认值已统一到筛选表单级“默认值”配置，此处仅保留旧配置兼容读取（禁用入口）
      disabledInSettings: true,
      disabledReasonInSettings: (ctx) =>
        `${ctx.t('This setting has been moved to')}: ${ctx.t('Form block settings')} > ${ctx.t('Field values')}`,
      uiSchema: (ctx) => {
        const baseFlags = ctx?.model?.context?.flags || {};
        const flags = { ...baseFlags, isInSetDefaultValueDialog: true };
        return {
          defaultValue: {
            'x-component': 'DefaultValue',
            'x-decorator': 'FormItem',
            'x-component-props': {
              flags,
            },
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
