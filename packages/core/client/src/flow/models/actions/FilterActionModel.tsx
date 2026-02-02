/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tExpr, MobilePopup, MultiRecordResource, useFlowSettingsContext } from '@nocobase/flow-engine';
import { isEmptyFilter, transformFilter } from '@nocobase/utils/client';
import { ButtonProps, Popover, Transfer } from 'antd';
import React from 'react';
import { FilterGroup, VariableFilterItem } from '../../components/filter';
import { ActionModel, CollectionBlockModel } from '../base';
import { FilterContainer } from '../../components/filter/FilterContainer';
import _ from 'lodash';

export class FilterActionModel extends ActionModel {
  static scene = 'collection';

  private readonly map = new WeakMap<any, any>();

  declare props: ButtonProps & {
    filterValue?: any;
    defaultFilterValue?: any;
    ignoreFieldsNames?: string[];
    open?: boolean;
    position: 'left';
    filterableFieldNames?: string[];
  };

  defaultProps: any = {
    type: 'default',
    title: tExpr('Filter'),
    icon: 'FilterOutlined',
    filterValue: { logic: '$and', items: [] },
  };

  getIgnoreFieldNames() {
    if (this.map.has(this.props.filterableFieldNames)) {
      return this.map.get(this.props.filterableFieldNames);
    }

    const fields = this.context.blockModel.collection?.getFields() || [];

    const result = getIgnoreFieldNames(
      this.props.filterableFieldNames || [],
      fields.map((field) => field.name),
    );
    this.map.set(this.props.filterableFieldNames, result);
    return result;
  }

  render() {
    if (this.context.isMobileLayout) {
      return (
        <>
          <MobilePopup
            title={this.context.t('Filter')}
            visible={this.props.open}
            onClose={() => {
              this.setProps('open', false);
            }}
          >
            <div
              style={{
                padding: this.context.themeToken.paddingMD,
                backgroundColor: this.context.themeToken.colorBgContainer,
              }}
            >
              <FilterContainer
                value={this.props.filterValue || this.props.defaultFilterValue}
                ctx={this.context}
                FilterItem={(props) => (
                  <VariableFilterItem {...props} model={this} ignoreFieldNames={this.getIgnoreFieldNames()} />
                )}
              />
              <div style={{ height: 150 }}></div>
            </div>
          </MobilePopup>
          {super.render()}
        </>
      );
    }

    return (
      <Popover
        open={this.props.open}
        content={
          <FilterContainer
            value={this.props.filterValue || this.props.defaultFilterValue}
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
  label: tExpr('Filter'),
  toggleable: true,
  sort: 5,
});

FilterActionModel.registerFlow({
  key: 'filterSettings',
  title: tExpr('Filter settings'),
  steps: {
    position: {
      handler(ctx, params) {
        ctx.model.setProps('position', params.position || 'left');
      },
    },
    filterableFieldNames: {
      title: tExpr('Filterable fields'),
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
            const dataSource = filterable.map((field: any) => ({ key: field.name, title: field.title }));
            return (
              <Transfer
                {...props}
                dataSource={dataSource}
                targetKeys={props.value || []}
                onChange={(nextKeys) => props.onChange?.(nextKeys)}
                render={(item) => item.title as string}
              />
            );
          },
          'x-component-props': {
            showSearch: true,
            listStyle: { width: 280, height: 360 },
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
      title: tExpr('Default filter conditions'),
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
        ctx.model.setProps('defaultFilterValue', _.cloneDeep(params.defaultFilter));
        ctx.model.setProps('filterValue', _.cloneDeep(params.defaultFilter));
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
        const blockModel = ctx.blockModel as CollectionBlockModel;
        const resource = blockModel?.resource as MultiRecordResource;
        if (!blockModel || !resource) {
          return;
        }

        const filter = transformFilter(ctx.model.props.filterValue);
        const hasFilter = !isEmptyFilter(filter);

        // 更新筛选来源活跃状态
        blockModel.setFilterActive(ctx.model.uid, hasFilter);

        if (hasFilter) {
          resource.addFilterGroup(ctx.model.uid, filter);
          resource.setPage(1);
        } else {
          resource.removeFilterGroup(ctx.model.uid);
        }

        // 检查数据加载模式
        const loadingMode = blockModel.getDataLoadingMode();
        if (loadingMode === 'manual' && !hasFilter && !blockModel.hasActiveFilters()) {
          // manual 模式且筛选为空，清空数据
          resource.setData([]);
          resource.setMeta({ count: 0, hasNext: false });
          if (typeof resource.setPage === 'function') {
            resource.setPage(1);
          }
          resource.loading = false;
        } else {
          resource.refresh();
        }

        ctx.model.setProps('open', false);
      },
    },
  },
});

FilterActionModel.registerFlow({
  key: 'resetSettings',
  title: tExpr('Reset'),
  on: 'reset',
  steps: {
    reset: {
      handler(ctx, params) {
        const blockModel = ctx.blockModel as CollectionBlockModel;
        const resource = blockModel?.resource as MultiRecordResource;
        if (!blockModel || !resource) {
          return;
        }

        // 移除当前筛选来源
        resource.removeFilterGroup(ctx.model.uid);
        blockModel.setFilterActive(ctx.model.uid, false);

        // 检查数据加载模式
        const loadingMode = blockModel.getDataLoadingMode();
        const defaultFilter = ctx.model.props.defaultFilterValue;
        const hasDefaultFilter = !isEmptyFilter(transformFilter(defaultFilter));

        if (loadingMode === 'manual' && !hasDefaultFilter && !blockModel.hasActiveFilters()) {
          // manual 模式且无默认筛选值，清空数据
          resource.setData([]);
          resource.setMeta({ count: 0, hasNext: false });
          if (typeof resource.setPage === 'function') {
            resource.setPage(1);
          }
          resource.loading = false;
        } else if (hasDefaultFilter) {
          // 有默认筛选值时，应用默认筛选并刷新
          resource.addFilterGroup(ctx.model.uid, transformFilter(defaultFilter));
          blockModel.setFilterActive(ctx.model.uid, true);
          resource.setPage(1);
          resource.refresh();
        } else {
          resource.refresh();
        }

        ctx.model.setProps('open', false);
        ctx.model.setProps('filterValue', _.cloneDeep(defaultFilter));
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
    if (!field?.interface) return false;
    if (field?.filterable === false) return false;
    const fi = fiMgr.getFieldInterface(field.interface);
    return !!fi?.filterable;
  });
}

function getIgnoreFieldNames(filterableFieldNames: string[], allFields: string[]) {
  return allFields?.filter((field) => !filterableFieldNames.includes(field));
}
