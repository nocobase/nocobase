/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { BlockSceneEnum, CollectionBlockModel, FieldModel, isTitleField } from '@nocobase/client';
import { DisplayItemModel, MultiRecordResource } from '@nocobase/flow-engine';
import React from 'react';
import { TreeBlockView } from './components/TreeBlockView';
import { tExpr } from '../locale';
import { treeConnectDataBlocks } from './treeConnectDataBlocks';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500];

export class TreeBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.filter;

  static async getExtraMenuItems(model, t) {
    const items = await super.getExtraMenuItems(model, t);
    return items.filter((item) => item.key !== 'block-reference:convert-to-template');
  }

  settingsMenuLevel = 2;

  selectedKeys = observable.ref<React.Key[]>([]);
  selectedFilterValues = observable.ref<React.Key[]>([]);

  defaultProps = {
    searchable: true,
    defaultExpandAll: false,
    includeDescendants: true,
  };

  onInit(options) {
    super.onInit(options);
    this.context.defineProperty('collectionField', {
      get: () => this.collection?.getField?.(this.getTitleFieldName()),
      cache: false,
    });
  }

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

  getTitleFieldSettingsInitParams(titleFieldName = this.getTitleFieldName()) {
    return {
      dataSourceKey: this.collection?.dataSourceKey,
      collectionName: this.collection?.name,
      fieldPath: titleFieldName,
    };
  }

  async syncTitleFieldSubModel(titleFieldName = this.getTitleFieldName(), options: { persist?: boolean } = {}) {
    const titleField = this.collection?.getField?.(titleFieldName);
    const initParams = this.getTitleFieldSettingsInitParams(titleFieldName);

    if (!titleField || !initParams.dataSourceKey || !initParams.collectionName || !initParams.fieldPath) {
      return null;
    }

    const bindingCtx = {
      ...this.context,
      engine: this.flowEngine,
      model: this,
      collectionField: titleField,
    } as any;
    const binding = DisplayItemModel.getDefaultBindingByField(bindingCtx, titleField);
    if (!binding?.modelName) {
      return null;
    }

    const currentFieldModel = this.subModels.field as any;
    const currentFieldPath = currentFieldModel?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
    const currentBindingUse = currentFieldModel?.getStepParams?.('fieldBinding', 'use') || currentFieldModel?.use;
    const nextProps = {
      ...(typeof binding.defaultProps === 'function'
        ? binding.defaultProps(bindingCtx, titleField)
        : binding.defaultProps),
      ...titleField.getComponentProps(),
      clickToOpen: false,
    };

    if (currentFieldModel && currentFieldPath === titleFieldName && currentBindingUse === binding.modelName) {
      currentFieldModel.setProps(nextProps);
      currentFieldModel.setStepParams({
        ...currentFieldModel.getStepParams(),
        fieldBinding: {
          ...(currentFieldModel.getStepParams('fieldBinding') || {}),
          use: binding.modelName,
        },
        fieldSettings: {
          init: initParams,
        },
      });
      await currentFieldModel.dispatchEvent('beforeRender', undefined, { useCache: false });
      if (options.persist) {
        await currentFieldModel.save?.();
        await this.save();
      }
      return currentFieldModel;
    }

    if (currentFieldModel?.uid) {
      currentFieldModel.invalidateFlowCache?.('beforeRender', true);
      this.flowEngine.removeModelWithSubModels(currentFieldModel.uid);
    }

    const fieldModel = this.setSubModel('field', {
      uid: currentFieldModel?.uid,
      use: FieldModel,
      props: nextProps,
      stepParams: {
        fieldBinding: {
          use: binding.modelName,
        },
        fieldSettings: {
          init: initParams,
        },
      } as any,
    });

    if (options.persist) {
      await fieldModel.save?.();
    }
    await fieldModel.dispatchEvent('beforeRender', undefined, { useCache: false });
    if (options.persist) {
      await this.save();
    }
    return fieldModel;
  }

  renderComponent() {
    return <TreeBlockView model={this} />;
  }
}

TreeBlockModel.registerFlow({
  key: 'titleFieldModelSync',
  on: 'beforeRender',
  steps: {
    syncModel: {
      hideInSettings() {
        return true;
      },
      async handler(ctx) {
        await (ctx.model as TreeBlockModel).syncTitleFieldSubModel();
      },
    },
  },
});

TreeBlockModel.registerFlow({
  key: 'treeSettings',
  sort: 1000,
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
      async beforeParamsSave(ctx, params, previousParams) {
        if (params.titleField === previousParams.titleField) {
          return;
        }

        ctx.model.setProps({
          fieldNames: {
            ...(ctx.model.props?.fieldNames || {}),
            title: params.titleField,
          },
        });

        await (ctx.model as TreeBlockModel).syncTitleFieldSubModel(params.titleField, { persist: true });
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
  sort: 1100,
});
