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
import React from 'react';
import { BlockItemCard } from '../common/BlockItemCard';
import { FilterManager } from '../filter-blocks/filter-manager/FilterManager';

export interface ResourceSettingsInitParams {
  dataSourceKey: string;
  collectionName: string;
  associationName?: string;
  sourceId?: string;
  filterByTk?: string;
}

export class BlockModel<T = DefaultStructure> extends FlowModel<T> {
  decoratorProps: Record<string, any> = observable({});

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
    return `${this.translate(this.constructor['meta']?.title || this.constructor.name)}`;
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

export class DataBlockModel<T = DefaultStructure> extends BlockModel<T> {}

export class CollectionBlockModel<T = DefaultStructure> extends DataBlockModel<T> {
  isManualRefresh = false;

  // Hook: subclasses can narrow which association fields are offered (e.g., only to-many)
  protected static filterAssociatedFields(fields: CollectionField[]): CollectionField[] {
    return fields;
  }

  // Hook: subclasses can add a "Current record" quick item in record context
  protected static buildCurrentRecordItem(
    ctx: FlowModelContext,
    c: Collection,
    input: Record<string, any>,
  ): any | undefined {
    return undefined;
  }

  // Builder: DS -> collections tree, with single-DS flattening
  // Subclasses can override to filter data sources/collections or customize menu items.
  protected static buildCollectionsMenuGroups(
    ctx: FlowModelContext,
    filter?: (col: Collection) => boolean,
  ): SubModelItem[] {
    const dsm = (ctx as any).dataSourceManager;
    const dataSources: DataSource[] = dsm?.getDataSources?.() ?? [];
    const className = (this as any).name as string;

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
        use: className,
        stepParams: {
          resourceSettings: { init: { dataSourceKey: ds.key, collectionName: col.name } },
        },
      }),
    });

    if (groups.length === 1) {
      const g = groups[0];
      return g.cols.map((c) => makeItem(g.ds, c));
    }

    return groups.map((g) => ({
      key: `ds:${g.ds.key}`,
      label: g.ds.displayName || g.ds.key,
      children: g.cols.map((c) => makeItem(g.ds, c)),
    }));
  }

  // Default children for all collection-based blocks:
  // - Associated records (when currentFlow has filterByTk)
  // - Other records/collections depending on context
  static defineChildren(ctx: FlowModelContext) {
    const modelName = (this as any).name as string;
    const current = ctx.currentFlow;
    const inputCF = current?.inputArgs || {};
    const resource: BaseRecordResource | undefined = ctx.resource;
    const inputCtx = ctx.inputArgs || {};
    const rsParams =
      typeof ctx.blockModel?.getStepParams === 'function'
        ? ctx.blockModel.getStepParams('resourceSettings', 'init') || {}
        : {};

    // Resolve current collection (c) from multiple sources
    const resolveCollection = (): Collection | undefined => {
      const fromFlow = current?.blockModel?.collection as Collection | undefined;
      const fromCtx = ctx.collection as Collection | undefined;
      if (fromFlow || fromCtx) return fromFlow || fromCtx;
      const targetName = (current?.inputArgs as any)?.collectionName || rsParams.collectionName;
      if (!targetName) return undefined;
      const dsm = (ctx as any).dataSourceManager;
      const dataSources = dsm?.getDataSources?.() || [];
      for (const ds of dataSources) {
        const found = ds.getCollection?.(targetName);
        if (found) return found;
      }
      return undefined;
    };

    // Normalized context values
    const c = resolveCollection();
    const filterByTk = inputCF.filterByTk ?? inputCtx.filterByTk ?? rsParams.filterByTk ?? resource?.getFilterByTk?.();
    const targetCollectionNameCF =
      (inputCF.collectionName as string | undefined) ?? inputCtx.collectionName ?? rsParams.collectionName;

    // Helper: build DS->collections group(s)
    const buildCollectionsByDS = (filter?: (col: Collection) => boolean) =>
      (this as any).buildCollectionsMenuGroups(ctx, filter);

    // Helper: build "Associated records" entry (with DS grouping and single-DS flattening)
    const buildAssociationRecords = (assocFrom: Collection): SubModelItem | null => {
      let relatedFields = assocFrom.getRelationshipFields();
      relatedFields = relatedFields.filter(
        (f) => f.target !== assocFrom.name && !!f.targetCollection && f.interface !== 'mbm',
      );
      relatedFields = (this as any).filterAssociatedFields?.(relatedFields) || relatedFields;
      if (relatedFields.length === 0) return null;

      // group by dataSource
      const byDS = new Map<string, CollectionField[]>();
      for (const f of relatedFields) {
        const dsKey = f.collection.dataSource.key;
        if (!byDS.has(dsKey)) byDS.set(dsKey, []);
        byDS.get(dsKey)!.push(f);
      }
      const groups = Array.from(byDS.entries()).map(([dsKey, fields]) => ({
        key: `ds:${dsKey}`,
        label: dsKey,
        children: fields.map((field) => ({
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
        })),
      }));

      return {
        key: MENU_KEYS.ASSOCIATION_RECORDS,
        label: escapeT('Associated records'),
        children: groups.length === 1 && Array.isArray(groups[0].children) ? (groups[0].children as any) : groups,
      } as any;
    };

    // Record context branch
    if (filterByTk && c) {
      const items: SubModelItem[] = [];
      const currentRecordItem = (this as any).buildCurrentRecordItem?.(ctx, c, inputCF);
      if (currentRecordItem) items.push(currentRecordItem);

      // Determine whether target collection is cross-DS
      const targetName = targetCollectionNameCF;
      let isCrossDS = false;
      let assocFrom: Collection | undefined;
      if (!targetName || targetName === c.name) {
        assocFrom = c;
      } else {
        assocFrom = c.dataSource.getCollection(targetName);
        if (!assocFrom) isCrossDS = true;
      }

      if (!isCrossDS && assocFrom) {
        const assocItem = buildAssociationRecords(assocFrom);
        if (assocItem) items.push(assocItem);
      }

      // Other records
      const otherChildren = buildCollectionsByDS();
      items.push({ key: MENU_KEYS.OTHER_RECORDS, label: escapeT('Other records'), children: otherChildren });

      // If only "Other records" exists, flatten
      if (items.length === 1 && Array.isArray(items[0].children)) {
        return items[0].children as any;
      }
      return items;
    }

    // No record context
    const items: SubModelItem[] = [];
    if (c) {
      items.push({
        key: MENU_KEYS.CURRENT_COLLECTIONS,
        label: escapeT('Current collection'),
        createModelOptions: {
          use: modelName,
          stepParams: { resourceSettings: { init: { dataSourceKey: c.dataSource.key, collectionName: c.name } } },
        },
      });
    }
    const otherCollections = buildCollectionsByDS();
    if (items.length > 0) {
      items.push({
        key: `${this.name}.${MENU_KEYS.OTHER_COLLECTIONS}`,
        label: escapeT('Other collections'),
        children: otherCollections,
      });
    } else {
      items.push(...otherCollections);
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
        return this.dataSource.getAssocation(params.associationName);
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
    ${this.translate(this.constructor['meta']?.title || this.constructor.name)}:
    ${collectionTitle}`;
  }

  addAppends(fieldPath: string, refresh = false) {
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
  steps: {
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

CollectionBlockModel.define({ hide: true, label: 'Data blocks' });

export class FilterBlockModel<T = DefaultStructure> extends BlockModel<T> {}

FilterBlockModel.define({ hide: true, label: 'Filter blocks' });
