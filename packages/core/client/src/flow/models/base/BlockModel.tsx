/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { observable } from '@formily/reactive';
import { Observer } from '@formily/reactive-react';
import {
  BaseRecordResource,
  Collection,
  CollectionField,
  createCollectionContextMeta,
  DataSource,
  DefaultStructure,
  escapeT,
  FlowModel,
  FlowModelContext,
  MENU_KEYS,
  MultiRecordResource,
  SingleRecordResource,
  SubModelItem,
} from '@nocobase/flow-engine';
import { Result } from 'antd';
import { capitalize } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockItemCard } from '../common/BlockItemCard';
import { FilterManager } from '../filter-blocks/filter-manager/FilterManager';

function resolveDefineContext(ctx: FlowModelContext) {
  const current = ctx.currentFlow;
  const inputCF = current?.inputArgs || {};
  const resource: BaseRecordResource | undefined = ctx.resource;
  const inputCtx = ctx.inputArgs || {};
  const bm = ctx.blockModel;
  const rsParams = typeof bm?.getStepParams === 'function' ? bm.getStepParams('resourceSettings', 'init') || {} : {};

  const dsm = ctx.dataSourceManager;
  const resolveCollection = (): Collection | undefined => {
    const fromFlow = current?.blockModel?.collection as Collection | undefined;
    const fromCtx = ctx.collection as Collection | undefined;
    if (fromFlow || fromCtx) return fromFlow || fromCtx;
    const targetName = current?.inputArgs?.collectionName || rsParams.collectionName;
    if (!targetName) return undefined;
    const dataSources = dsm?.getDataSources?.() || [];
    for (const ds of dataSources) {
      const found = ds.getCollection?.(targetName);
      if (found) return found;
    }
    return undefined;
  };

  const c = resolveCollection();
  const filterByTk = inputCF.filterByTk ?? inputCtx.filterByTk ?? rsParams.filterByTk ?? resource?.getFilterByTk?.();
  const targetCollectionNameCF =
    (inputCF.collectionName as string | undefined) ?? inputCtx.collectionName ?? rsParams.collectionName;

  return { current, inputCF, rsParams, c, filterByTk, targetCollectionNameCF } as const;
}

async function resolveAllowedCollectionsWhitelist(ctx: FlowModelContext, filters: any): Promise<Set<string> | null> {
  const src = filters?.collections;
  if (!src) return null;
  const list: Collection[] = typeof src === 'function' ? (await src(ctx)) || [] : src || [];
  return new Set(list.map((col) => `${col.dataSourceKey}:${col.name}`));
}

function isAllowedCollection(col: Collection, allowedSet: Set<string> | null): boolean {
  return allowedSet ? allowedSet.has(`${col.dataSourceKey}:${col.name}`) : true;
}

function makeCurrentCollectionItem(modelName: string, c: Collection): SubModelItem {
  return {
    key: MENU_KEYS.CURRENT_COLLECTIONS,
    label: escapeT('Current collection'),
    createModelOptions: {
      use: modelName,
      stepParams: { resourceSettings: { init: { dataSourceKey: c.dataSource.key, collectionName: c.name } } },
    },
  };
}

function makeCurrentRecordItem(
  modelName: string,
  targetName: string,
  dataSourceKey: string,
  inputCF: any,
): SubModelItem {
  return {
    key: MENU_KEYS.CURRENT_RECORD,
    label: escapeT('Current record'),
    createModelOptions: {
      use: modelName,
      stepParams: {
        resourceSettings: {
          init: {
            filterByTk: '{{ ctx.view.inputArgs.filterByTk }}',
            collectionName: targetName,
            dataSourceKey,
            ...(inputCF.associationName && {
              associationName: inputCF.associationName,
              sourceId: '{{ ctx.view.inputArgs.sourceId }}',
            }),
          },
        },
      },
    },
  };
}

function resolveAssocFrom(c: Collection, targetName?: string) {
  if (!targetName || targetName === c.name) {
    return { assocFrom: c, isCrossDS: false } as const;
  }
  const found = c.dataSource.getCollection(targetName);
  return { assocFrom: found, isCrossDS: !found } as const;
}

function pushGroupOrFlatten(
  items: SubModelItem[],
  modelName: string,
  menuKey: string,
  label: string,
  children: SubModelItem[],
  alwaysKeep = false,
) {
  if (alwaysKeep || items.length > 0) {
    const menuItem: SubModelItem = { key: `${modelName}.${menuKey}`, label, children };
    // 为“选择 Collection”的子菜单开启搜索
    if (menuKey === MENU_KEYS.OTHER_COLLECTIONS) {
      menuItem.searchable = true;
      menuItem.searchPlaceholder = escapeT('Search');
    }
    items.push(menuItem);
  } else {
    items.push(...children);
  }
}

function buildAssociatedRecordsItem(
  ctx: FlowModelContext,
  assocFrom: Collection,
  filterByTk: any,
  modelName: string,
  allowedSet: Set<string> | null,
  filterAssociatedFields?: (fields: CollectionField[]) => CollectionField[],
): SubModelItem | null {
  let relatedFields = assocFrom.getRelationshipFields();
  relatedFields = relatedFields.filter(
    (f) => f.target !== assocFrom.name && !!f.targetCollection && f.interface !== 'mbm',
  );
  relatedFields = filterAssociatedFields ? filterAssociatedFields(relatedFields) : relatedFields;
  if (relatedFields.length === 0) return null;

  // group by dataSource
  const byDS = new Map<string, CollectionField[]>();
  for (const f of relatedFields) {
    const dsKey = f.collection.dataSource.key;
    if (!byDS.has(dsKey)) byDS.set(dsKey, []);
    byDS.get(dsKey)!.push(f);
  }
  const groups = Array.from(byDS.entries())
    .map(([dsKey, fields]) => ({
      key: `ds:${dsKey}`,
      label: dsKey,
      children: fields
        .map((field) => ({
          key: `field:${field.name}`,
          label: field.uiSchema?.title || field.name,
          createModelOptions: {
            use: modelName,
            stepParams: {
              resourceSettings: {
                init: {
                  dataSourceKey: field.collection.dataSource.key,
                  collectionName: field.target,
                  associationName: `${field.collection.name}.${field.name}`,
                  sourceId: filterByTk,
                },
              },
            },
          },
        }))
        // apply allowed collections if present
        .filter((item) =>
          allowedSet
            ? allowedSet.has(
                `${item.createModelOptions.stepParams.resourceSettings.init.dataSourceKey}:${item.createModelOptions.stepParams.resourceSettings.init.collectionName}`,
              )
            : true,
        ),
    }))
    .filter((g) => g.children && g.children.length > 0);

  if (groups.length === 0) return null;
  const children = groups.length === 1 && Array.isArray(groups[0].children) ? groups[0].children : groups;
  return {
    key: MENU_KEYS.ASSOCIATION_RECORDS,
    label: escapeT('Associated records'),
    children,
  } as SubModelItem;
}

function buildCollectionsMenuGroups(
  ctx: FlowModelContext,
  modelName: string,
  filter?: (col: Collection) => boolean,
  preserveGrouping = false,
): SubModelItem[] {
  const dsm = ctx.dataSourceManager;
  const dataSources: DataSource[] = dsm?.getDataSources?.() ?? [];

  const groups = dataSources
    .map((ds) => {
      let cols = (ds.getCollections?.() ?? []) as Collection[];
      if (filter) cols = cols.filter(filter);
      return { ds, cols };
    })
    .filter((g) => g.cols.length > 0);

  if (groups.length === 0) return [];

  const makeItem = (ds: DataSource, col: Collection): SubModelItem => ({
    key: `ds:${ds.key}.col:${col.name}`,
    label: col.title || col.name,
    createModelOptions: () => ({
      use: modelName,
      stepParams: {
        resourceSettings: { init: { dataSourceKey: ds.key, collectionName: col.name } },
      },
    }),
  });

  if (groups.length === 1 && !preserveGrouping) {
    const g = groups[0];
    return g.cols.map((c) => makeItem(g.ds, c));
  }

  return groups.map((g) => ({
    key: `ds:${g.ds.key}`,
    type: 'group' as const,
    label: g.ds.displayName || g.ds.key,
    searchable: true,
    searchPlaceholder: escapeT('Search'),
    children: g.cols.map((c) => makeItem(g.ds, c)),
  }));
}

export interface ResourceSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  associationName?: string;
  sourceId?: string;
  filterByTk?: string;
}

export const CollectionNotAllowView = ({ actionName, collectionTitle }) => {
  const { t } = useTranslation();
  const messageValue = useMemo(() => {
    return t(
      `The current user only has the UI configuration permission, but don't have "{{actionName}}" permission for collection "{{name}}"`,
      {
        actionName: t(capitalize(actionName)),
        name: collectionTitle,
      },
    ).replaceAll('&gt;', '>');
  }, [collectionTitle, actionName, t]);
  return (
    <BlockItemCard>
      <Result status="403" subTitle={messageValue} />
    </BlockItemCard>
  );
};

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});

  // 设置态隐藏时的占位渲染
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    return (
      <CollectionNotAllowView actionName={this.context.actionName} collectionTitle={(this as any).collection?.title} />
    );
  }

  setDecoratorProps(props) {
    Object.assign(this.decoratorProps, props);
  }

  get title() {
    if (!this._title) {
      this._title = this.defaultBlockTitle();
    }
    return this._title;
  }

  protected defaultBlockTitle() {
    return `${this.translate(this.constructor['meta']?.label || this.constructor.name)}`;
  }

  renderComponent(): any {
    throw new Error('renderComponent method must be implemented in subclasses of BlockModel');
  }

  render() {
    return (
      <BlockItemCard ref={this.context.ref} {...this.decoratorProps}>
        <Observer>
          {() => {
            return this.renderComponent();
          }}
        </Observer>
      </BlockItemCard>
    );
  }
}

BlockModel.registerFlow({
  key: 'cardSettings',
  title: escapeT('Card settings'),
  steps: {
    titleDescription: {
      title: escapeT('Title & description'),
      uiSchema: {
        title: {
          'x-component': 'Input',
          'x-decorator': 'FormItem',
          title: escapeT('Title'),
        },
        description: {
          'x-component': 'Input.TextArea',
          'x-decorator': 'FormItem',
          title: escapeT('Description'),
        },
      },
      handler(ctx, params) {
        const title = ctx.t(params.title);
        const description = ctx.t(params.description);
        ctx.model.setDecoratorProps({ title: title, description: description });
      },
    },
    // setBlockHeight: {
    //   title: tval('Set block height'),
    //   uiSchema: {
    //     heightMode: {
    //       type: 'string',
    //       enum: [
    //         { label: tval('Default'), value: HeightMode.DEFAULT },
    //         { label: tval('Specify height'), value: HeightMode.SPECIFY_VALUE },
    //         { label: tval('Full height'), value: HeightMode.FULL_HEIGHT },
    //       ],
    //       required: true,
    //       'x-decorator': 'FormItem',
    //       'x-component': 'Radio.Group',
    //     },
    //     height: {
    //       title: tval('Height'),
    //       type: 'string',
    //       required: true,
    //       'x-decorator': 'FormItem',
    //       'x-component': 'NumberPicker',
    //       'x-component-props': {
    //         addonAfter: 'px',
    //       },
    //       'x-validator': [
    //         {
    //           minimum: 40,
    //         },
    //       ],
    //       'x-reactions': {
    //         dependencies: ['heightMode'],
    //         fulfill: {
    //           state: {
    //             hidden: '{{ $deps[0]==="fullHeight"||$deps[0]==="defaultHeight"}}',
    //             value: '{{$deps[0]!=="specifyValue"?null:$self.value}}',
    //           },
    //         },
    //       },
    //     },
    //   },
    //   defaultParams: () => {
    //     return {
    //       heightMode: HeightMode.DEFAULT,
    //     };
    //   },
    //   handler(ctx, params) {
    //     ctx.model.setDecoratorProps({ heightMode: params.heightMode, height: params.height });
    //   },
    // },
  },
});

BlockModel.define({ hide: true, label: escapeT('Other blocks') });

//

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {}

DataBlockModel.define({ hide: true, label: escapeT('Data blocks') });

export class CollectionBlockModel<T = DefaultStructure> extends DataBlockModel<T> {
  isManualRefresh = false;

  protected static filterAssociatedFields(fields: CollectionField[]): CollectionField[] {
    return fields;
  }

  static getChildrenFilters(_ctx: FlowModelContext): {
    currentCollection?: boolean;
    currentRecord?: boolean;
    otherCollections?: boolean;
    otherRecords?: boolean;
    collections?: Collection[] | ((ctx: FlowModelContext) => Collection[] | Promise<Collection[]>);
  } {
    // Subclasses may override; base will merge with defaults inside defineChildren.
    return {};
  }

  static async defineChildren(ctx: FlowModelContext) {
    const modelName = this.name as string;
    const { inputCF, c, filterByTk, targetCollectionNameCF } = resolveDefineContext(ctx);

    // Helper: build DS->collections group(s)
    const buildCollectionsByDS = (filter?: (col: Collection) => boolean, preserveGrouping = false) =>
      buildCollectionsMenuGroups(ctx, modelName, filter, preserveGrouping);

    // Helper: build "Associated records" entry via helper
    const buildAssociationRecords = (assocFrom: Collection, allowedSet: Set<string> | null): SubModelItem | null =>
      buildAssociatedRecordsItem(ctx, assocFrom, filterByTk, modelName, allowedSet, this.filterAssociatedFields);

    const defaultFilters = {
      currentCollection: true,
      currentRecord: false,
      otherCollections: true,
      otherRecords: true,
    };
    const subclassFilters = this.getChildrenFilters?.(ctx) || {};
    const filters = { ...defaultFilters, ...subclassFilters };

    const allowedSet = await resolveAllowedCollectionsWhitelist(ctx, filters);
    const isAllowed = (col: Collection) => isAllowedCollection(col, allowedSet);

    if (filterByTk && c) {
      const items: SubModelItem[] = [];

      if (filters.currentRecord) {
        const targetName = targetCollectionNameCF || c.name;
        const targetCol = c.dataSource.getCollection(targetName) || c;
        if (!allowedSet || (targetCol && isAllowed(targetCol))) {
          items.push(makeCurrentRecordItem(modelName, targetName, c.dataSource.key, inputCF));
        }
      }

      const { assocFrom, isCrossDS } = resolveAssocFrom(c, targetCollectionNameCF);
      if (!isCrossDS && assocFrom) {
        // Apply allowed collections filter on fields by their target collection
        const assocItem = buildAssociationRecords(assocFrom, allowedSet);
        if (assocItem) items.push(assocItem);
      }

      if (filters.otherRecords) {
        const otherChildren = buildCollectionsByDS(allowedSet ? isAllowed : undefined, !!allowedSet);
        pushGroupOrFlatten(items, modelName, MENU_KEYS.OTHER_RECORDS, escapeT('Other records'), otherChildren, true);
      }

      return items;
    }

    const items: SubModelItem[] = [];
    if (filters.currentCollection && c && (!allowedSet || isAllowed(c))) {
      items.push(makeCurrentCollectionItem(modelName, c));
    }

    if (filters.otherCollections) {
      const children = buildCollectionsByDS(allowedSet ? isAllowed : undefined, !!allowedSet);
      pushGroupOrFlatten(items, modelName, MENU_KEYS.OTHER_COLLECTIONS, escapeT('Other collections'), children, false);
    }
    return items;
  }

  async destroy(): Promise<boolean> {
    const result = await super.destroy();

    const filterManager: FilterManager = this.context.filterManager;
    await filterManager.removeFilterConfig({ targetId: this.uid });

    return result;
  }

  get dataSource(): DataSource {
    return this.context.dataSource;
  }

  get collection(): Collection {
    return this.context.collection;
  }

  get resource(): BaseRecordResource {
    return this.context.resource;
  }

  get association(): CollectionField | undefined {
    return this.context.association;
  }

  get associationField(): CollectionField | undefined {
    return this.context.association;
  }

  getAclActionName() {
    return 'view';
  }
  /**
   * 获取可用于筛选的字段列表
   */
  async getFilterFields(): Promise<{ name: string; title: string; target?: string }[]> {
    return this.collection.getFields().filter((field) => field.filterable);
  }

  getResourceSettingsInitParams(): ResourceSettingsInitParams {
    return this.getStepParams('resourceSettings', 'init');
  }

  onInit(options) {
    this.context.defineProperty('blockModel', {
      value: this,
    });
    this.context.defineProperty('actionName', {
      get: () => this.getAclActionName(),
      cache: false,
    });
    this.context.defineProperty('resourceName', {
      get: () => this.resource.getResourceName(),
      cache: false,
    });
    this.context.defineProperty('dataSource', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        return this.context.dataSourceManager.getDataSource(params.dataSourceKey);
      },
    });
    this.context.defineProperty('collection', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        return this.context.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
      },
      meta: createCollectionContextMeta(() => {
        const params = this.getResourceSettingsInitParams();
        return this.context.dataSourceManager.getCollection(params.dataSourceKey, params.collectionName);
      }, this.context.t('Current collection')),
    });
    this.context.defineProperty('resource', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        const resource = this.createResource(this.context, params);
        resource.setAPIClient(this.context.api);
        resource.setDataSourceKey(params.dataSourceKey);
        resource.setResourceName(params.associationName || params.collectionName);
        resource.on('refresh', () => {
          this.invalidateAutoFlowCache();
        });
        return resource;
      },
    });
    this.context.defineProperty('association', {
      get: () => {
        const params = this.getResourceSettingsInitParams();
        if (!params.associationName) {
          return undefined;
        }
        return this.dataSource.getAssociation(params.associationName);
      },
    });
  }

  createResource(ctx, params): SingleRecordResource | MultiRecordResource {
    throw new Error('createResource method must be implemented in subclasses of CollectionBlockModel');
  }

  protected defaultBlockTitle() {
    let collectionTitle = this.collection?.title;
    if (this.association) {
      const resourceName = this.resource.getResourceName();
      const sourceCollection = this.dataSource.getCollection(resourceName.split('.')[0]);
      collectionTitle = [sourceCollection.title, this.association.title].join(' > ');
      collectionTitle += ` (${this.collection?.title})`;
    }
    return `
    ${this.translate(this.constructor['meta']?.label || this.constructor.name)}:
    ${collectionTitle}`;
  }

  addAppends(fieldPath: string, refresh = false) {
    if (!fieldPath) {
      return;
    }
    if (fieldPath.includes('.')) {
      // 关系数据
      const [field1, field2] = fieldPath.split('.');
      const associationField = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${this.collection.name}.${field1}`,
      ) as CollectionField;
      const targetCollectionName = associationField.target;
      const collectionField = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${targetCollectionName}.${field2}`,
      ) as CollectionField;

      if (collectionField.isAssociationField()) {
        (this.resource as BaseRecordResource).addAppends(fieldPath);
        if (refresh) {
          this.resource.refresh();
        }
      }
    } else {
      const field = this.context.dataSourceManager.getCollectionField(
        `${this.collection.dataSourceKey}.${this.collection.name}.${fieldPath}`,
      ) as CollectionField;
      if (!field) {
        return;
      }
      if (field.isAssociationField()) {
        (this.resource as BaseRecordResource).addAppends(field.name);
        if (refresh) {
          this.resource.refresh();
        }
      }
    }
  }
}

CollectionBlockModel.registerFlow({
  key: 'resourceSettings',
  sort: -999, //置顶，
  steps: {
    aclCheck: {
      use: 'aclCheck',
    },
    init: {
      handler(ctx, params) {
        if (!params.dataSourceKey) {
          throw new Error('dataSourceKey is required');
        }
        if (!params.collectionName) {
          throw new Error('collectionName is required');
        }
        // sourceId 为运行时参数，必须放在 runtime context 中
        if (Object.keys(params).includes('sourceId')) {
          // TODO: 这里的 replace 都是为了兼容老数据，发布版本前删除掉（或者下次大的不兼容变更时删除）
          ctx.resource.setSourceId(params.sourceId);
        }
        // filterByTk 为运行时参数，必须放在 runtime context 中
        if (Object.keys(params).includes('filterByTk')) {
          // TODO: 这里的 replace 都是为了兼容老数据，发布版本前删除掉（或者下次大的不兼容变更时删除）
          ctx.resource.setFilterByTk(params.filterByTk);
        }
      },
    },
  },
});

CollectionBlockModel.registerFlow({
  key: 'refreshSettings',
  sort: 10000,
  steps: {
    refresh: {
      async handler(ctx) {
        const filterManager: FilterManager = ctx.model.context.filterManager;
        filterManager.bindToTarget(ctx.model.uid);
        if (ctx.model.isManualRefresh) {
          ctx.model.resource.loading = false;
        } else {
          await ctx.model.resource.refresh();
        }
      },
    },
  },
});

CollectionBlockModel.define({ hide: true });

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}

FilterBlockModel.define({ hide: true, label: 'Filter blocks' });
