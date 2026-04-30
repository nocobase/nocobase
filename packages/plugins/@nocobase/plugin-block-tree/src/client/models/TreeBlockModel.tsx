/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { SettingOutlined } from '@ant-design/icons';
import {
  AddChildActionModel,
  ActionModel,
  BlockSceneEnum,
  CollectionActionGroupModel,
  CollectionBlockModel,
  isTitleField,
  RecordActionGroupModel,
} from '@nocobase/client';
import {
  AddSubModelButton,
  buildSubModelItem,
  defineFlow,
  DndProvider,
  DragHandler,
  Droppable,
  DisplayItemModel,
  FlowModel,
  FlowModelContext,
  FlowModelRenderer,
  FlowSettingsButton,
  FlowsFloatContextMenu,
  MultiRecordResource,
} from '@nocobase/flow-engine';
import { Space } from 'antd';
import React from 'react';
import { TreeBlockView } from './components/TreeBlockView';
import { tExpr } from '../locale';
import { treeConnectDataBlocks } from './treeConnectDataBlocks';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500];
const TREE_ADD_CHILD_FORM_DATA_KEY = '__treeAddChildFormData';
const TREE_NODE_ACTION_MODEL_NAMES = [
  'ViewActionModel',
  'EditActionModel',
  'DeleteActionModel',
  'AddChildActionModel',
  'JSItemActionModel',
  'JSRecordActionModel',
];
const TREE_SEARCH_ACTION_MODEL_NAMES = ['AddNewActionModel', 'JSItemActionModel', 'JSCollectionActionModel'];

const getEffectiveFieldModelUse = (fieldModel: any) => {
  return fieldModel?.getStepParams?.('fieldBinding', 'use') || fieldModel?.use;
};

const getTitleFieldStepParams = (fieldModel: any, initParams: any, preservePrevious: boolean) => {
  const previousStepParams = preservePrevious ? fieldModel?.getStepParams?.() || {} : {};
  const { fieldBinding: _fieldBinding, ...stepParams } = previousStepParams;

  return {
    ...stepParams,
    fieldSettings: {
      ...(stepParams.fieldSettings || {}),
      init: initParams,
    },
  };
};

const getTreeAddChildFormDataFromContext = (ctx: FlowModelContext) => {
  const model = ctx.model as any;
  const blockModel = ctx.blockModel as TreeBlockModel;
  const cacheKey = blockModel?.getTreeAddChildFormDataInputKey?.();

  return cacheKey && ctx.inputArgs?.[cacheKey]
    ? ctx.inputArgs[cacheKey]
    : blockModel?.getTreeAddChildFormData?.(model.uid, ctx.inputArgs?.sourceId);
};

const addChildPopupSettingsFlow = AddChildActionModel.globalFlowRegistry.getFlow('popupSettings').toData();

const buildTreeActionItems = async (
  ctx: FlowModelContext,
  actionModelNames: string[],
  ActionGroupModelClass: typeof CollectionActionGroupModel | typeof RecordActionGroupModel,
  scene: 'collection' | 'record',
) => {
  const items = [];

  for (const modelName of actionModelNames) {
    const ModelClass = ctx.engine.getModelClass(modelName) as typeof ActionModel;
    if (!ModelClass) {
      continue;
    }
    if (!ActionGroupModelClass.isActionModelVisible(ModelClass, ctx)) {
      continue;
    }
    if (!ModelClass._isScene?.(scene) && !ActionGroupModelClass.models.has(modelName)) {
      continue;
    }

    const item = await buildSubModelItem(ModelClass as any, ctx);
    if (item) {
      items.push(item);
    }
  }

  return items.sort((a, b) => (a.sort ?? 1000) - (b.sort ?? 1000));
};

const buildTreeSearchActionItems = (ctx: FlowModelContext) =>
  buildTreeActionItems(ctx, TREE_SEARCH_ACTION_MODEL_NAMES, CollectionActionGroupModel, 'collection');

const buildTreeNodeActionItems = (ctx: FlowModelContext) =>
  buildTreeActionItems(ctx, TREE_NODE_ACTION_MODEL_NAMES, RecordActionGroupModel, 'record');

export class TreeBlockModel extends CollectionBlockModel {
  static scene = BlockSceneEnum.filter;

  static async getExtraMenuItems(model, t) {
    const items = await super.getExtraMenuItems(model, t);
    return items.filter((item) => item.key !== 'block-reference:convert-to-template');
  }

  _defaultCustomModelClasses = {
    CollectionActionGroupModel: 'CollectionActionGroupModel',
    RecordActionGroupModel: 'RecordActionGroupModel',
  };

  selectedKeys = observable.ref<React.Key[]>([]);
  selectedFilterValues = observable.ref<React.Key[]>([]);
  private treeAddChildFormDataCache = new Map<string, any>();

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
    this.ensureTitleFieldSettingsContainer();
    this.migrateLegacyTitleFieldSubModel();
    this.migrateLegacyActionSubModels();
  }

  protected onUnmount(): void {
    super.onUnmount();
    this.treeAddChildFormDataCache.clear();
  }

  private migrateLegacyTitleFieldSubModel() {
    const legacyField = this.subModels?.['field'];
    if (legacyField instanceof FlowModel) {
      const container = this.getTitleFieldSettingsContainer();
      if (!container.hasSubModel('field')) {
        (container.subModels as any).field = legacyField;
        legacyField.setParent?.(container);
      }
      delete (this.subModels as any).field;
    }
  }

  private migrateLegacyActionSubModels() {
    const legacyActions = this.subModels?.['actions'];
    if (Array.isArray(legacyActions) && legacyActions.length) {
      const container = this.getActionsContainer();
      if (!container.hasSubModel('actions')) {
        (container.subModels as any).actions = legacyActions;
        legacyActions.forEach((action) => action.setParent?.(container));
      }
      delete (this.subModels as any).actions;
    }

    const legacyNodeActions = this.subModels?.['nodeActions'];
    if (Array.isArray(legacyNodeActions) && legacyNodeActions.length) {
      const container = this.getNodeActionsContainer();
      if (!container.hasSubModel('actions')) {
        (container.subModels as any).actions = legacyNodeActions;
        legacyNodeActions.forEach((action) => action.setParent?.(container));
      }
      delete (this.subModels as any).nodeActions;
    }
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

  getActionsContainer() {
    return this.ensureActionContainer('actionsContainer');
  }

  getTitleFieldSettingsContainer() {
    return this.ensureTitleFieldSettingsContainer();
  }

  getNodeActionsContainer() {
    return this.ensureActionContainer('nodeActionsContainer');
  }

  private ensureTitleFieldSettingsContainer() {
    if (!this.subModels?.['titleFieldSettingsContainer']) {
      this.setSubModel('titleFieldSettingsContainer', {
        use: 'TreeTitleFieldSettingsModel',
      });
    }

    return this.subModels.titleFieldSettingsContainer as TreeTitleFieldSettingsModel;
  }

  private ensureActionContainer(subModelKey: 'actionsContainer' | 'nodeActionsContainer') {
    if (!this.subModels?.[subModelKey]) {
      this.setSubModel(subModelKey, {
        use: 'TreeActionGroupModel',
      });
    }

    return this.subModels[subModelKey] as TreeActionGroupModel;
  }

  renderConfigureActions() {
    const container = this.getActionsContainer();

    return (
      <AddSubModelButton
        key="tree-actions-add"
        model={container}
        items={buildTreeSearchActionItems}
        subModelKey="actions"
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  renderActions() {
    const isConfigMode = !!this.context.flowSettingsEnabled;
    const container = this.getActionsContainer();

    if (!isConfigMode && !container.hasSubModel('actions')) {
      return null;
    }

    return (
      <DndProvider>
        <Space wrap>
          {container.mapSubModels('actions', (action: ActionModel) => {
            if (action.hidden && !isConfigMode) {
              return;
            }

            return (
              <Droppable model={action} key={action.uid}>
                <FlowModelRenderer
                  model={action}
                  showFlowSettings={{ showBackground: false, showBorder: false, toolbarPosition: 'above' }}
                  extraToolbarItems={[
                    {
                      key: 'drag-handler',
                      component: DragHandler,
                      sort: 1,
                    },
                  ]}
                />
              </Droppable>
            );
          })}
          {this.renderConfigureActions()}
        </Space>
      </DndProvider>
    );
  }

  renderConfigureNodeActions() {
    const container = this.getNodeActionsContainer();

    return (
      <AddSubModelButton
        key="tree-node-actions-add"
        model={container}
        items={buildTreeNodeActionItems}
        subModelKey="actions"
        afterSubModelInit={async (actionModel) => {
          actionModel.setStepParams('buttonSettings', 'general', { type: 'link', icon: null });
        }}
      >
        <FlowSettingsButton icon={<SettingOutlined />}>{this.translate('Actions')}</FlowSettingsButton>
      </AddSubModelButton>
    );
  }

  renderTitleFieldSettings(children: React.ReactNode) {
    const container = this.getTitleFieldSettingsContainer();

    return (
      <FlowsFloatContextMenu
        model={container}
        showBackground={false}
        showBorder={false}
        showDeleteButton={false}
        showCopyUidButton={false}
        settingsMenuLevel={2}
      >
        {children}
      </FlowsFloatContextMenu>
    );
  }

  getTitleFieldName() {
    return this.props?.fieldNames?.title || this.collection?.filterTargetKey;
  }

  private getTreeAddChildFormDataCacheKey(actionUid: string, sourceId: any) {
    return [actionUid, sourceId].filter((value) => value !== undefined && value !== null).join(':');
  }

  getTreeAddChildFormData(actionUid: string, sourceId: any) {
    const cacheKey = this.getTreeAddChildFormDataCacheKey(actionUid, sourceId);
    return cacheKey ? this.treeAddChildFormDataCache.get(cacheKey) : undefined;
  }

  setTreeAddChildFormData(actionUid: string, sourceId: any, formData: any) {
    const cacheKey = this.getTreeAddChildFormDataCacheKey(actionUid, sourceId);
    if (cacheKey) {
      this.treeAddChildFormDataCache.set(cacheKey, formData);
    }
  }

  getTreeAddChildFormDataInputKey() {
    return TREE_ADD_CHILD_FORM_DATA_KEY;
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

    const container = this.getTitleFieldSettingsContainer?.() || this;
    const currentFieldModel = container.subModels.field as any;
    const currentFieldPath = currentFieldModel?.getStepParams?.('fieldSettings', 'init')?.fieldPath;
    const currentBindingUse = getEffectiveFieldModelUse(currentFieldModel);
    const currentModelUse = currentFieldModel?.use;
    const shouldPreserveStepParams = currentFieldPath === titleFieldName && currentBindingUse === binding.modelName;
    const nextStepParams = getTitleFieldStepParams(currentFieldModel, initParams, shouldPreserveStepParams);
    const nextProps = {
      ...(typeof binding.defaultProps === 'function'
        ? binding.defaultProps(bindingCtx, titleField)
        : binding.defaultProps),
      ...titleField.getComponentProps(),
      clickToOpen: false,
    };

    if (currentFieldModel && shouldPreserveStepParams && currentModelUse === binding.modelName) {
      currentFieldModel.setProps(nextProps);
      currentFieldModel.setStepParams(nextStepParams);
      await currentFieldModel.dispatchEvent('beforeRender', undefined, { useCache: false });
      if (options.persist) {
        await currentFieldModel.save?.();
        await this.save();
      }
      return currentFieldModel;
    }

    if (currentFieldModel?.uid) {
      if (options.persist && this.flowEngine.destroyModel) {
        await this.flowEngine.destroyModel(currentFieldModel.uid);
      } else {
        currentFieldModel.invalidateFlowCache?.('beforeRender', true);
        this.flowEngine.removeModelWithSubModels(currentFieldModel.uid);
      }
    }

    const fieldModel = container.setSubModel('field', {
      uid: currentFieldModel?.uid,
      use: binding.modelName,
      props: nextProps,
      stepParams: nextStepParams as any,
    });

    if (options.persist) {
      await container.save?.();
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

export class TreeTitleFieldSettingsModel extends FlowModel<{
  subModels: {
    field: FlowModel;
  };
}> {
  get treeBlockModel() {
    return this.parent as TreeBlockModel;
  }
}

TreeTitleFieldSettingsModel.define({
  createModelOptions: {
    use: 'TreeTitleFieldSettingsModel',
  },
  hide: true,
});

export class TreeActionGroupModel extends FlowModel<{
  subModels: {
    actions: ActionModel[];
  };
}> {}

TreeActionGroupModel.define({
  createModelOptions: {
    use: 'TreeActionGroupModel',
  },
  hide: true,
});

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

AddChildActionModel.registerFlow({
  ...defineFlow(addChildPopupSettingsFlow),
  steps: {
    treeAddChildFormDataInit: {
      sort: -1000,
      async handler(ctx) {
        const formData = getTreeAddChildFormDataFromContext(ctx);
        if (!formData || ctx.inputArgs?.formData) {
          return;
        }

        ctx.inputArgs.formData = formData;
      },
    },
    ...addChildPopupSettingsFlow.steps,
  },
});

TreeTitleFieldSettingsModel.registerFlow({
  key: 'treeTitleFieldSettings',
  sort: 1000,
  title: tExpr('Tree node settings'),
  steps: {
    titleField: {
      title: tExpr('Title field'),
      uiMode(ctx) {
        const model = (ctx.model as TreeTitleFieldSettingsModel).treeBlockModel;
        const collection = model.collection;
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
          titleField: (ctx.model as TreeTitleFieldSettingsModel).treeBlockModel.getTitleFieldName(),
        };
      },
      async beforeParamsSave(ctx, params, previousParams) {
        if (params.titleField === previousParams.titleField) {
          return;
        }

        const model = (ctx.model as TreeTitleFieldSettingsModel).treeBlockModel;
        model.setProps({
          fieldNames: {
            ...(model.props?.fieldNames || {}),
            title: params.titleField,
          },
        });

        await model.syncTitleFieldSubModel(params.titleField, { persist: true });
      },
      handler(ctx, params) {
        const model = (ctx.model as TreeTitleFieldSettingsModel).treeBlockModel;
        model.setProps({
          fieldNames: {
            ...(model.props?.fieldNames || {}),
            title: params.titleField,
          },
        });
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
