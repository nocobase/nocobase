/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { BlockSceneEnum, CollectionBlockModel, isTitleField } from '@nocobase/client';
import { MultiRecordResource } from '@nocobase/flow-engine';
import React from 'react';
import { TreeBlockView } from './components/TreeBlockView';
import { tExpr } from '../locale';
import { treeConnectDataBlocks } from './treeConnectDataBlocks';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500];

export class TreeBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.filter;

  selectedKeys = observable.ref<React.Key[]>([]);
  selectedFilterValues = observable.ref<React.Key[]>([]);

  defaultProps = {
    searchable: true,
    defaultExpandAll: false,
    includeDescendants: true,
  };

  get operator() {
    return this.props?.includeDescendants === false ? '$eq' : '$in';
  }

  createResource() {
    const resource = this.context.createResource(MultiRecordResource);
    resource.setPageSize(this.getPageSize());

    if (this.collection?.template === 'tree') {
      resource.setRequestParameters({ tree: true });
    }

    return resource;
  }

  getPageSize() {
    return this.props?.pageSize || 200;
  }

  get resource() {
    return super.resource as MultiRecordResource;
  }

  getTitleFieldName() {
    return this.props?.fieldNames?.title || this.collection?.filterTargetKey;
  }

  getFieldNames() {
    return {
      key: this.collection?.filterTargetKey,
      title: this.getTitleFieldName(),
      children: 'children',
      ...(this.props?.fieldNames || {}),
    };
  }

  setSelectedKeys(keys: React.Key[] = []) {
    this.selectedKeys.value = Array.isArray(keys) ? keys : [];
  }

  setSelectedFilterValues(values: React.Key[] = []) {
    this.selectedFilterValues.value = Array.isArray(values) ? values : [];
  }

  getFilterValue() {
    if (this.props?.includeDescendants === false) {
      return this.selectedKeys.value?.[0];
    }

    return this.selectedFilterValues.value;
  }

  renderComponent() {
    return <TreeBlockView model={this} />;
  }
}

TreeBlockModel.registerFlow({
  key: 'treeSettings',
  sort: 500,
  title: tExpr('Tree settings'),
  steps: {
    searchable: {
      title: tExpr('Searchable'),
      uiMode: { type: 'switch', key: 'searchable' },
      defaultParams: {
        searchable: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ searchable: params.searchable !== false });
      },
    },
    defaultExpandAll: {
      title: tExpr('Expand all'),
      uiMode: { type: 'switch', key: 'defaultExpandAll' },
      defaultParams: {
        defaultExpandAll: false,
      },
      handler(ctx, params) {
        ctx.model.setProps({ defaultExpandAll: params.defaultExpandAll === true });
      },
    },
    includeDescendants: {
      title: tExpr('Include child nodes when filtering'),
      uiMode: { type: 'switch', key: 'includeDescendants' },
      defaultParams: {
        includeDescendants: true,
      },
      handler(ctx, params) {
        ctx.model.setProps({ includeDescendants: params.includeDescendants !== false });
        void ctx.model.context.filterManager?.refreshTargetsByFilter?.(ctx.model.uid);
      },
    },
    titleField: {
      title: tExpr('Title field'),
      uiMode(ctx) {
        const collection = ctx.model.collection;
        const dataSourceManager = ctx.app.dataSourceManager;
        const options = (collection?.getFields?.() || [])
          .filter((field) => isTitleField(dataSourceManager, field.options || field))
          .map((field) => ({
            label: field.title || field.name,
            value: field.name,
          }));

        return {
          type: 'select',
          key: 'titleField',
          props: {
            options,
          },
        };
      },
      defaultParams(ctx) {
        return {
          titleField: ctx.model.getTitleFieldName(),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({
          fieldNames: {
            ...(ctx.model.props?.fieldNames || {}),
            title: params.titleField,
          },
        });
      },
    },
    pageSize: {
      title: tExpr('Root records per page'),
      uiMode: {
        type: 'select',
        key: 'pageSize',
        props: {
          options: PAGE_SIZE_OPTIONS.map((value) => ({ label: String(value), value })),
        },
      },
      defaultParams(ctx) {
        return {
          pageSize: ctx.model.getPageSize(),
        };
      },
      handler(ctx, params) {
        ctx.model.setProps({ pageSize: params.pageSize });
        ctx.model.resource.loading = true;
        ctx.model.resource.setPage(1);
        ctx.model.resource.setPageSize(params.pageSize);
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    connectFields: {
      use: treeConnectDataBlocks.name,
      title: tExpr('Connect data blocks'),
    },
  },
});

TreeBlockModel.registerFlow({
  key: 'dataLoadingModeSettings',
  steps: {},
});

TreeBlockModel.define({
  label: tExpr('Tree'),
  hide: true,
  searchable: true,
  searchPlaceholder: tExpr('Search'),
  createModelOptions: {
    use: 'TreeBlockModel',
  },
  sort: 480,
});
