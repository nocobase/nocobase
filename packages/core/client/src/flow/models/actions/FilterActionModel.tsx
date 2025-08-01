/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource, observer, useFlowSettingsContext } from '@nocobase/flow-engine';
import { isEmptyFilter, removeNullCondition } from '@nocobase/utils/client';
import { Button, ButtonProps, Popover, Select, Space } from 'antd';
import React, { FC } from 'react';
import { CollectionActionModel } from '../base/ActionModel';
import { FilterGroup, FilterItem, transformFilter } from '../../components/filter';

export class FilterActionModel extends CollectionActionModel {
  declare props: ButtonProps & {
    filterValue?: any;
    ignoreFieldsNames?: string[];
    open?: boolean;
    position: 'left';
  };

  defaultProps: any = {
    type: 'default',
    title: escapeT('Filter'),
    icon: 'FilterOutlined',
    filterValue: { logic: '$and', items: [] },
  };

  render() {
    return (
      <Popover
        open={this.props.open}
        content={
          <FilterContainer
            value={this.props.filterValue}
            ctx={this.context}
            FilterItem={(props) => <FilterItem {...props} model={this} />}
          />
        }
        trigger="click"
        placement="bottomLeft"
        onOpenChange={(open) => {
          // 解决当鼠标点击其他地方时，Popover 不关闭的问题
          if (open === false) {
            this.setProps('open', undefined);
          }
        }}
      >
        {super.render()}
      </Popover>
    );
  }
}

FilterActionModel.define({
  title: escapeT('Filter'),
  toggleDetector: ({ model }) => {
    let ret = false;
    model.findSubModel('actions', (action) => {
      if (action.constructor === FilterActionModel) {
        ret = true;
      }
    });
    return ret;
  },
  customRemove: async ({ model }, item) => {
    model.findSubModel('actions', (action) => {
      if (action instanceof FilterActionModel) {
        action.destroy();
      }
    });
  },
});

FilterActionModel.registerFlow({
  key: 'filterSettings',
  title: escapeT('Filter settings'),
  steps: {
    position: {
      handler(ctx, params) {
        ctx.model.setProps('position', params.position || 'left');
      },
    },
    filterableFieldsNames: {
      title: escapeT('Filterable fields'),
      uiSchema: {
        filterableFieldsNames: {
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model } = useFlowSettingsContext();
            const options = model.context.blockModel.collection.getFields().map((field) => {
              return {
                label: field.title,
                value: field.name,
              };
            });
            return <Select {...props} options={options} />;
          },
          'x-component-props': {
            mode: 'multiple',
            placeholder: escapeT('Please select non-filterable fields'),
          },
        },
      },
      defaultParams(ctx) {
        const names = ctx.blockModel.collection.getFields().map((field) => field.name);
        return {
          filterableFieldsNames: names || [],
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('filterableFieldsNames', params.filterableFieldsNames);
      },
    },
    defaultFilter: {
      title: escapeT('Default filter conditions'),
      uiSchema: {
        defaultFilter: {
          type: 'object',
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model: modelInstance } = useFlowSettingsContext();

            return (
              <FilterGroup
                value={props.value || {}}
                FilterItem={(props) => <FilterItem {...props} model={modelInstance} />}
              />
            );
          },
        },
      },
      defaultParams(ctx) {
        return {
          defaultFilter: ctx.model.defaultProps.filterValue,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('filterValue', params.defaultFilter);
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'submitSettings',
  on: 'submit',
  steps: {
    submit: {
      handler(ctx, params) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }

        const filter = removeNullCondition(transformFilter(ctx.model.props.filterValue));

        if (!isEmptyFilter(filter)) {
          resource.addFilterGroup(ctx.model.uid, filter);
          resource.setPage(1);
        } else {
          resource.removeFilterGroup(ctx.model.uid);
        }

        resource.refresh();
        ctx.model.setProps('open', false);
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'resetSettings',
  title: escapeT('Reset'),
  on: 'reset',
  steps: {
    submit: {
      handler(ctx, params) {
        const resource = ctx.blockModel?.resource as MultiRecordResource;
        if (!resource) {
          return;
        }
        resource.removeFilterGroup(ctx.model.uid);
        resource.refresh();
        ctx.model.setProps('open', false);
        ctx.model.setProps('filterValue', clearInputValue(ctx.model.props.filterValue));
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'openSettings',
  on: 'click',
  steps: {
    open: {
      handler(ctx, params) {
        ctx.model.setProps('open', !ctx.model.props.open);
      },
    },
  },
});

function clearInputValue(value: any) {
  if (Array.isArray(value)) {
    return value.map((item) => clearInputValue(item));
  } else if (typeof value === 'object' && value !== null) {
    const newValue: any = {};
    for (const key in value) {
      newValue[key] = clearInputValue(value[key]);
    }
    return newValue;
  } else if (typeof value === 'string') {
    return '';
  }
  return undefined;
}

/**
 * 筛选项组件的属性接口
 */
interface FilterItemProps {
  value: {
    leftValue: string;
    operator: string;
    rightValue: string;
  };
}

/**
 * FilterContent 组件的属性接口
 */
interface FilterContentProps {
  /** 响应式的过滤条件对象 */
  value: Record<string, any>;
  /** 自定义筛选项组件 */
  FilterItem?: React.FC<FilterItemProps>;
  /** 上下文对象，用于获取字段列表等元信息 */
  ctx: any;
}

/**
 * 筛选内容组件
 *
 * 支持新的数据结构格式：
 * ```typescript
 * {
 *   "logic": "or",
 *   "items": [
 *     {
 *       "leftValue": "isAdmin",
 *       "operator": "eq",
 *       "rightValue": true
 *     },
 *     {
 *       "logic": "and",
 *       "items": [...]
 *     }
 *   ]
 * }
 * ```
 *
 * @example
 * ```typescript
 * const filterValue = observable({
 *   logic: 'and',
 *   items: []
 * });
 *
 * <FilterContent
 *   value={filterValue}
 *   ctx={contextObject}
 *   FormItem={CustomFormItem}
 * />
 * ```
 */
export const FilterContainer: FC<FilterContentProps> = observer(
  (props) => {
    const { value, FilterItem, ctx } = props;

    // 确保 value 有正确的默认结构
    if (!value.logic) {
      value.logic = 'and';
    }
    if (!Array.isArray(value.items)) {
      value.items = [];
    }

    const handleReset = () => {
      // 触发重置事件，由外部组件处理
      if (ctx?.model?.dispatchEvent) {
        ctx.model.dispatchEvent('reset');
      }
    };

    const handleSubmit = () => {
      // 触发提交事件，由外部组件处理
      if (ctx?.model?.dispatchEvent) {
        ctx.model.dispatchEvent('submit');
      }
    };

    const translate = ctx?.model?.translate || ((text: string) => text);

    return (
      <>
        <FilterGroup value={value} FilterItem={FilterItem} />
        <Space style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleReset}>{translate('Reset')}</Button>
          <Button type="primary" onClick={handleSubmit}>
            {translate('Submit')}
          </Button>
        </Space>
      </>
    );
  },
  {
    displayName: 'FilterContainer',
  },
);
