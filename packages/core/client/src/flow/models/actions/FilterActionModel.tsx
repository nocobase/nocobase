/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { escapeT, MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import { isEmptyFilter, transformFilter } from '@nocobase/utils/client';
import { ButtonProps, Popover, Select } from 'antd';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../../components/filter';
import { ActionModel } from '../base';
import { FilterContainer } from '../../components/filter/FilterContainer';

export class FilterActionModel extends ActionModel {
  static scene = 'collection';

  private readonly map = new WeakMap<any, any>();

  declare props: ButtonProps & {
    filterValue?: any;
    ignoreFieldsNames?: string[];
    open?: boolean;
    position: 'left';
    filterableFieldNames?: string[];
  };

  defaultProps: any = {
    type: 'default',
    title: escapeT('Filter'),
    icon: 'FilterOutlined',
    filterValue: { logic: '$and', items: [] },
  };

  getIgnoreFieldNames() {
    if (this.map.has(this.props.filterableFieldNames)) {
      return this.map.get(this.props.filterableFieldNames);
    }

    const fields =
      this.context.blockModel.collection?.getFields().filter((field) => {
        // 过滤掉附件字段，因为会报错：Target collection attachments not found for field xxx
        return field.target !== 'attachments';
      }) || [];

    const result = getIgnoreFieldNames(
      this.props.filterableFieldNames || [],
      fields.map((field) => field.name),
    );
    this.map.set(this.props.filterableFieldNames, result);
    return result;
  }

  render() {
    return (
      <Popover
        open={this.props.open}
        content={
          <FilterContainer
            value={this.props.filterValue}
            ctx={this.context}
            FilterItem={(props) => (
              <VariableFilterItem {...props} model={this} ignoreFieldNames={this.getIgnoreFieldNames()} />
            )}
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
    filterableFieldNames: {
      title: escapeT('Filterable fields'),
      uiSchema: {
        filterableFieldNames: {
          type: 'array',
          'x-decorator': 'FormItem',
          'x-component': (props) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const { model } = useFlowSettingsContext();
            const dm = model?.context?.app?.dataSourceManager;
            const fiMgr = dm?.collectionFieldInterfaceManager;
            const filterable = getFilterableFields(model.context.blockModel.collection, fiMgr);
            const options = filterable.map((field: any) => ({ label: field.title, value: field.name }));
            return <Select {...props} options={options} />;
          },
          'x-component-props': {
            mode: 'multiple',
            placeholder: escapeT('Please select filterable fields'),
          },
        },
      },
      defaultParams(ctx) {
        // 默认仅包含“可筛选”的字段（与 1.0 一致），以避免 JSON 等未提供 operators 的字段出现在默认允许集合中
        const dm = ctx?.model?.context?.app?.dataSourceManager;
        const fiMgr = dm?.collectionFieldInterfaceManager;
        const names = getFilterableFields(ctx.blockModel.collection, fiMgr).map((field: any) => field.name);
        return {
          filterableFieldNames: names || [],
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('filterableFieldNames', params.filterableFieldNames);
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

        const filter = transformFilter(ctx.model.props.filterValue);

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

function getFilterableFields(collection: any, fiMgr: any) {
  const fields = collection?.getFields?.() || [];
  if (!fiMgr) return [];
  return fields.filter((field: any) => {
    if (field.target === 'attachments') return false;
    if (!field?.interface) return false;
    if (field?.filterable === false) return false;
    const fi = fiMgr.getFieldInterface(field.interface);
    return !!fi?.filterable;
  });
}

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

function getIgnoreFieldNames(filterableFieldNames: string[], allFields: string[]) {
  return allFields?.filter((field) => !filterableFieldNames.includes(field));
}
