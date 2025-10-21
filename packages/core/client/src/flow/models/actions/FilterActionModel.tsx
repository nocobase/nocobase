/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import { isEmptyFilter, removeNullCondition, transformFilter } from '@nocobase/utils/client';
import { ButtonProps, Popover, Select } from 'antd';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../../components/filter';
import { ActionModel } from '../base';
import { FilterContainer } from '../../components/filter/FilterContainer';

export class FilterActionModel extends ActionModel {
  static scene = 'collection';

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
            FilterItem={(props) => <VariableFilterItem {...props} model={this} />}
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
  label: escapeT('Filter'),
  toggleable: true,
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
                FilterItem={(props) => <VariableFilterItem {...props} model={modelInstance} />}
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
