import type { CollectionV3 } from '../collection';
import type { Application } from '../../Application';

import { type DataSourceOptionsV3, DataSourceV3, LocalDataSource, DataSourceFactory } from './DataSource';
import { type CollectionTemplateFactory, CollectionTemplateManagerV3 } from '../collection-template';
import { type CollectionFieldInterfaceFactory, CollectionFieldInterfaceManager } from '../collection-field-interface';

export const DEFAULT_DATA_SOURCE_NAME_V3 = 'main';
export const DEFAULT_DATA_SOURCE_TITLE_V3 = '{{t("main")}}';

export interface DataSourceManagerOptionsV3 {
  collectionTemplates?: CollectionTemplateFactory[];
  fieldInterfaces?: CollectionFieldInterfaceFactory[];
  fieldInterfaceGroups?: Record<string, { label: string; order?: number }>;
  collectionMixins?: (typeof CollectionV3)[];
  dataSources?: DataSourceOptionsV3[];
}

export class DataSourceManagerV3 {
  protected dataSourceInstancesMap: Record<string, DataSourceV3> = {};
  protected multiDataSources: [() => Promise<DataSourceOptionsV3[]>, DataSourceFactory][] = [];
  public collectionMixins: (typeof CollectionV3)[] = [];
  public collectionTemplateManager: CollectionTemplateManagerV3;
  public collectionFieldInterfaceManager: CollectionFieldInterfaceManager;

  constructor(
    protected options: DataSourceManagerOptionsV3 = {},
    public app: Application,
  ) {
    this.collectionTemplateManager = new CollectionTemplateManagerV3(options.collectionTemplates, app, this);
    this.collectionFieldInterfaceManager = new CollectionFieldInterfaceManager(
      options.fieldInterfaces,
      options.fieldInterfaceGroups,
      app,
      this,
    );
    this.collectionMixins.push(...(options.collectionMixins || []));

    (options.dataSources || []).forEach((dataSourceOptions) => {
      this.addDataSource(LocalDataSource, dataSourceOptions);
    });
  }

  addCollectionMixins(mixins: (typeof CollectionV3)[] = []) {
    const newMixins = mixins.filter((mixin) => !this.collectionMixins.includes(mixin));
    this.collectionMixins.push(...newMixins);

    // Re-add tables
    this.getDataSources().forEach((dataSource) => dataSource.addCollections());
  }

  getDataSources() {
    return Object.values(this.dataSourceInstancesMap);
  }

  getDataSource(name: string) {
    return name ? this.dataSourceInstancesMap[name] : this.dataSourceInstancesMap[DEFAULT_DATA_SOURCE_NAME_V3];
  }

  addDataSource(DataSource: DataSourceFactory, options: DataSourceOptionsV3) {
    const dataSourceInstance = new DataSource(options, this.app, this);
    this.dataSourceInstancesMap[dataSourceInstance.key] = dataSourceInstance;
    return dataSourceInstance;
  }

  async addDataSources(request: () => Promise<DataSourceOptionsV3[]>, DataSource: DataSourceFactory) {
    this.multiDataSources.push([request, DataSource]);
  }

  getAllCollections(predicate?: (collection: CollectionV3) => boolean) {
    return this.getDataSources().reduce((acc, dataSource) => {
      acc.push({
        ...dataSource.getOptions(),
        collections: dataSource.collectionManager.getCollections(predicate),
      });
      return acc;
    }, []);
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
