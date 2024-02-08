import type { CollectionOptionsV2, CollectionV2 } from '../collection';
import type { Application } from '../../application/Application';

import { type DataSourceOptionsV2, DataSourceV2, LocalDataSource, DataSourceFactory } from './DataSource';
import { type CollectionTemplateFactory, CollectionTemplateManagerV2 } from '../collection-template';
import { type CollectionFieldInterfaceFactory, CollectionFieldInterfaceManager } from '../collection-field-interface';
import type { SchemaKey } from '@formily/json-schema';

export const DEFAULT_DATA_SOURCE_NAME = 'main';
export const DEFAULT_DATA_SOURCE_TITLE = '{{t("main")}}';

export interface DataSourceManagerOptionsV2 {
  collectionTemplates?: CollectionTemplateFactory[];
  fieldInterfaces?: CollectionFieldInterfaceFactory[];
  fieldInterfaceGroups?: Record<string, { label: string; order?: number }>;
  collectionMixins?: (typeof CollectionV2)[];
  dataSources?: DataSourceOptionsV2[];
  collections?: CollectionOptionsV2[];
}

export class DataSourceManagerV2 {
  protected dataSourceInstancesMap: Record<string, DataSourceV2> = {};
  protected multiDataSources: [() => Promise<DataSourceOptionsV2[]>, DataSourceFactory][] = [];
  public collectionMixins: (typeof CollectionV2)[] = [];
  public collectionTemplateManager: CollectionTemplateManagerV2;
  public collectionFieldInterfaceManager: CollectionFieldInterfaceManager;

  constructor(
    protected options: DataSourceManagerOptionsV2 = {},
    public app: Application,
  ) {
    this.collectionTemplateManager = new CollectionTemplateManagerV2(options.collectionTemplates, this);
    this.collectionFieldInterfaceManager = new CollectionFieldInterfaceManager(
      options.fieldInterfaces,
      options.fieldInterfaceGroups,
      this,
    );
    this.collectionMixins.push(...(options.collectionMixins || []));

    this.addDataSource(LocalDataSource, {
      key: DEFAULT_DATA_SOURCE_NAME,
      displayName: DEFAULT_DATA_SOURCE_TITLE,
      collections: options.collections || [],
    });
    (options.dataSources || []).forEach((dataSourceOptions) => {
      this.addDataSource(LocalDataSource, dataSourceOptions);
    });
  }

  addCollectionMixins(mixins: (typeof CollectionV2)[] = []) {
    const newMixins = mixins.filter((mixin) => !this.collectionMixins.includes(mixin));
    if (!newMixins.length) return;
    this.collectionMixins.push(...newMixins);

    // Re-add tables
    this.getDataSources().forEach((dataSource) => dataSource.collectionManager.reAddCollections());
  }

  getDataSources() {
    return Object.values(this.dataSourceInstancesMap);
  }

  getDataSource(key?: string) {
    return key ? this.dataSourceInstancesMap[key] : this.dataSourceInstancesMap[DEFAULT_DATA_SOURCE_NAME];
  }

  removeDataSources(keys: string[]) {
    keys.forEach((key) => {
      delete this.dataSourceInstancesMap[key];
    });
  }

  addDataSource(DataSource: DataSourceFactory, options: DataSourceOptionsV2) {
    const dataSourceInstance = new DataSource(options, this);
    this.dataSourceInstancesMap[dataSourceInstance.key] = dataSourceInstance;
    return dataSourceInstance;
  }

  async addDataSources(request: () => Promise<DataSourceOptionsV2[]>, DataSource: DataSourceFactory) {
    this.multiDataSources.push([request, DataSource]);
  }

  getAllCollections(predicate?: (collection: CollectionV2) => boolean) {
    return this.getDataSources().reduce((acc, dataSource) => {
      acc.push({
        ...dataSource.getOptions(),
        collections: dataSource.collectionManager.getCollections(predicate),
      });
      return acc;
    }, []);
  }

  addFieldInterfaceGroups(options: Record<string, { label: string; order?: number }>) {
    this.collectionFieldInterfaceManager.addFieldInterfaceGroups(options);
  }

  addCollectionTemplates(templateClasses: CollectionTemplateFactory[] = []) {
    this.collectionTemplateManager.addCollectionTemplates(templateClasses);
  }

  addFieldInterfaces(fieldInterfaceClasses: CollectionFieldInterfaceFactory[] = []) {
    this.collectionFieldInterfaceManager.addFieldInterfaces(fieldInterfaceClasses);
  }

  async reload() {
    await Promise.all(
      this.multiDataSources.map(async ([request, DataSource]) => {
        const list = await request();
        list.map((options) => this.addDataSource(DataSource, options));
      }),
    );

    return Promise.all(this.getDataSources().map((dataSource) => dataSource.reload()));
  }
}
