import { CollectionFieldInterfaceBase } from './CollectionFieldInterface';
import { CollectionTemplateBase } from './CollectionTemplate';
import { CollectionFieldOptionsV2, CollectionOptionsV2, CollectionV2 } from './Collection';
import type { Application } from '../Application';
import { SchemaKey } from '@formily/react';

export type CollectionMixinConstructor<T = {}> = new (...args: any[]) => T;

function applyMixins(instance: any, mixins: any[]) {
  mixins.forEach((MixinClass) => {
    const mixin = new MixinClass();
    Object.getOwnPropertyNames(mixin).forEach((key) => {
      instance.__proto__[key] = mixin[key];
    });

    Object.getOwnPropertyNames(mixin.__proto__).forEach((key) => {
      if (key !== 'constructor') {
        instance.__proto__[key] = mixin.__proto__[key];
      }
    });
  });
}

const defaultCollectionTransform = (collection: CollectionOptionsV2, app: Application) => {
  const { rawTitle, title, fields, ...rest } = collection;
  return {
    ...rest,
    title: rawTitle ? title : app.i18n.t(title),
    rawTitle: rawTitle || title,
    fields: fields.map(({ uiSchema, ...field }) => {
      if (uiSchema?.title) {
        const title = uiSchema.title;
        uiSchema.title = uiSchema.rawTitle ? title : app.i18n.t(title, { ns: 'lm-collections' });
        uiSchema.rawTitle = uiSchema.rawTitle || title;
      }
      if (Array.isArray(uiSchema?.enum)) {
        uiSchema.enum = uiSchema.enum.map((item) => ({
          ...item,
          value: item?.value || item,
          label: item.rawLabel ? item.label : app.i18n.t(item.label, { ns: 'lm-collections' }),
          rawLabel: item.rawLabel || item.label,
        }));
      }
      return { uiSchema, ...field };
    }),
  };
};

export const DEFAULT_DATA_SOURCE_TITLE = '{{t("main")}}';
export const DEFAULT_DATA_SOURCE_NAME = 'main';

export interface GetCollectionOptions {
  dataSource?: string;
}

interface DataSource {
  name: string;
  description: string;
  collections?: CollectionOptionsV2[];
  [key: string]: any;
}

type DataSourceNameType = string;

export interface CollectionManagerOptionsV2 {
  collections?: CollectionOptionsV2[];
  collectionTemplates?: (typeof CollectionTemplateBase)[];
  fieldInterfaces?: (typeof CollectionFieldInterfaceBase)[];
  fieldGroups?: Record<string, { label: string; order?: number }>;
  collectionMixins?: CollectionMixinConstructor[];
}

type ThirdDataResourceFn = () => Promise<DataSource[]>;
type MainDataSOurceFn = () => Promise<CollectionOptionsV2[]>;
type ReloadCallback = (collections: CollectionOptionsV2[]) => void;

export class CollectionManagerV2 {
  public app: Application;
  protected collections: Record<string, Record<DataSourceNameType, CollectionV2>> = {};
  protected collectionTemplateInstances: Record<string, CollectionTemplateBase> = {};
  protected fieldInterfaceInstances: Record<string, CollectionFieldInterfaceBase> = {};
  protected collectionMixins: CollectionMixinConstructor[] = [];
  protected dataSourceMap: Record<DataSourceNameType, Omit<DataSource, 'collections'>> = {};
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};
  protected mainDataSourceFn: MainDataSOurceFn;
  protected thirdDataSourceFn: ThirdDataResourceFn;
  protected reloadCallbacks: Record<string, ReloadCallback[]> = {};
  protected collectionArr: Record<string, CollectionV2[]> = {};
  protected options: CollectionManagerOptionsV2 = {};

  constructor(options: CollectionManagerOptionsV2 = {}, app: Application) {
    this.options = options;
    this.app = app;
    this.init(options);
  }

  private init(options: CollectionManagerOptionsV2) {
    this.initDataSourceMap();
    this.collectionMixins.push(...(options.collectionMixins || []));
    this.addCollectionTemplates(options.collectionTemplates || []);
    this.addFieldInterfaces(options.fieldInterfaces || []);
    this.addFieldGroups(options.fieldGroups || {});
    this.addCollections(options.collections || []);
  }

  private initDataSourceMap() {
    this.dataSourceMap = {
      [DEFAULT_DATA_SOURCE_NAME]: {
        name: DEFAULT_DATA_SOURCE_NAME,
        description: DEFAULT_DATA_SOURCE_TITLE,
      },
    };
  }

  // collection mixins
  addCollectionMixins(mixins: CollectionMixinConstructor[]) {
    if (mixins.length === 0) return;
    const newMixins = mixins.filter((mixin) => !this.collectionMixins.includes(mixin));
    this.collectionMixins.push(...newMixins);

    // 重新添加数据表
    Object.keys(this.collections).forEach((dataSource) => {
      const collections = this.getCollections({ dataSource }).map((item) => item.getOptions());
      this.addCollections(collections, { dataSource });
    });
  }

  // collections
  addCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}) {
    const { dataSource = DEFAULT_DATA_SOURCE_NAME } = options;
    this.collectionArr[dataSource] = undefined;

    collections
      .map((collection) => {
        const collectionTemplateInstance = this.getCollectionTemplate(collection.template);
        const Cls = collectionTemplateInstance?.Collection || CollectionV2;
        const transform = collectionTemplateInstance?.transform || defaultCollectionTransform;
        const transformedCollection = transform(collection, this.app);
        const instance = new Cls({ ...transformedCollection, dataSource }, this.app, this);
        applyMixins(instance, this.collectionMixins);
        return instance;
      })
      .forEach((collectionInstance) => {
        if (!this.collections[dataSource]) {
          this.collections[dataSource] = {};
        }
        this.collections[dataSource][collectionInstance.name] = collectionInstance;
      });
  }
  setCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}) {
    const { dataSource = DEFAULT_DATA_SOURCE_NAME } = options;
    this.collections[dataSource] = {};
    this.addCollections(collections, options);
  }
  getAllCollections(
    predicate?: (collection: CollectionV2) => boolean,
  ): (Omit<DataSource, 'collections'> & { collections: CollectionV2[] })[] {
    return Object.keys(this.dataSourceMap).reduce<Omit<DataSource, 'collections'> & { collections: CollectionV2[] }[]>(
      (acc, dataSourceName) => {
        const dataSource = this.dataSourceMap[dataSourceName];
        acc.push({
          ...dataSource,
          collections: this.getCollections({ predicate, dataSource: dataSourceName }),
        });
        return acc;
      },
      [],
    );
  }
  getCollections(options: { predicate?: (collection: CollectionV2) => boolean; dataSource?: string } = {}) {
    const { dataSource = DEFAULT_DATA_SOURCE_NAME, predicate } = options;
    if (!this.collectionArr[dataSource]?.length) {
      this.collectionArr[dataSource] = Object.values(this.collections[dataSource] || {});
    }
    if (predicate) {
      return this.collectionArr[dataSource].filter(predicate);
    }
    return this.collectionArr[dataSource];
  }
  /**
   * 获取数据表
   * @example
   * getCollection('users'); // 获取 users 表
   * getCollection('users.profile'); // 获取 users 表的 profile 字段的关联表
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段的关联表
   */
  getCollection<Mixins = {}>(path: string, options: GetCollectionOptions = {}): (Mixins & CollectionV2) | undefined {
    const { dataSource = DEFAULT_DATA_SOURCE_NAME } = options;
    if (!path || typeof path !== 'string') return undefined;
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = this.getCollectionField(path);

      return this.getCollection(associationField.target, { dataSource });
    }
    return this.collections[dataSource]?.[path] as Mixins & CollectionV2;
  }
  getCollectionName(path: string, options: GetCollectionOptions = {}): string | undefined {
    const res = this.getCollection(path, options);
    return res?.name;
  }

  getCollectionFields(collectionName: string, options: GetCollectionOptions = {}): CollectionFieldOptionsV2[] {
    return this.getCollection(collectionName, options)?.getFields() || [];
  }
  /**
   * 获取数据表字段
   * @example
   * getCollection('users.username'); // 获取 users 表的 username 字段
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段
   */
  getCollectionField(path: SchemaKey, options: GetCollectionOptions = {}): CollectionFieldOptionsV2 | undefined {
    if (!path) return;
    if (typeof path === 'object' || String(path).split('.').length < 2) {
      console.error(`[@nocobase/client]: CollectionManager.getCollectionField() path "${path}" is invalid`);
      return;
    }
    const [collectionName, ...fieldNames] = String(path).split('.');
    const { dataSource = DEFAULT_DATA_SOURCE_NAME } = options || {};
    const collection = this.getCollection(collectionName, { dataSource });
    if (!collection) {
      return;
    }
    return collection.getField(fieldNames.join('.'));
  }

  // dataSources
  getDataSources() {
    return Object.values(this.dataSourceMap);
  }
  getDataSource(name: string) {
    return this.dataSourceMap[name];
  }

  // CollectionTemplates
  addCollectionTemplates(templateClasses: (typeof CollectionTemplateBase)[]) {
    const newCollectionTemplateInstances = templateClasses.reduce((acc, Template) => {
      const instance = new Template(this.app, this);
      acc[instance.name] = instance;
      return acc;
    }, {});
    Object.assign(this.collectionTemplateInstances, newCollectionTemplateInstances);

    // 重新添加数据表
    const reAddCollections = Object.keys(this.collections).reduce<Record<string, CollectionOptionsV2[]>>(
      (acc, dataSource) => {
        acc[dataSource] = this.getCollections({
          predicate: (collection) => {
            return newCollectionTemplateInstances[collection.template];
          },
          dataSource,
        }).map((collection) => collection.getOptions());
        return acc;
      },
      {},
    );

    Object.keys(reAddCollections).forEach((dataSource) => {
      this.addCollections(reAddCollections[dataSource], { dataSource });
    });
  }
  getCollectionTemplates() {
    return Object.values(this.collectionTemplateInstances).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  getCollectionTemplate<T extends CollectionTemplateBase>(name: string): T {
    return this.collectionTemplateInstances[name] as T;
  }

  // field interface
  addFieldInterfaces(interfaces: (typeof CollectionFieldInterfaceBase)[]) {
    const newCollectionFieldInterfaces = interfaces.reduce((acc, Interface) => {
      const instance = new Interface(this.app, this);
      acc[instance.name] = instance;
      return acc;
    }, {});

    Object.assign(this.fieldInterfaceInstances, newCollectionFieldInterfaces);
  }
  getFieldInterfaces() {
    return this.fieldInterfaceInstances;
  }
  getFieldInterface<T extends CollectionFieldInterfaceBase>(name: string) {
    return this.fieldInterfaceInstances[name] as T;
  }

  addFieldGroups(fieldGroups: Record<string, { label: string; order?: number }>) {
    Object.assign(this.collectionFieldGroups, fieldGroups);
  }
  getFieldGroups() {
    return this.collectionFieldGroups;
  }
  getFieldGroup(name: string) {
    return this.collectionFieldGroups[name];
  }

  setMainDataSource(fn: MainDataSOurceFn) {
    this.mainDataSourceFn = fn;
  }

  setThirdDataSource(fn: ThirdDataResourceFn) {
    this.thirdDataSourceFn = fn;
  }

  async reloadMain(callback?: ReloadCallback) {
    const collections = await this.mainDataSourceFn();
    this.setCollections(collections);
    callback && callback(collections);
    this.reloadCallbacks[DEFAULT_DATA_SOURCE_NAME]?.forEach((cb) => cb(collections));
  }

  async reloadThirdDataSource(callback?: () => void) {
    if (!this.thirdDataSourceFn) return;
    const data = await this.thirdDataSourceFn();
    this.initDataSourceMap();
    data.forEach((dataSource) => {
      const { collections: _unUse, ...rest } = dataSource;
      this.dataSourceMap[dataSource.name] = rest;
    });

    data.forEach(({ name, collections, ...others }) => {
      this.dataSourceMap[name] = { ...others, name };
      this.setCollections(collections, { dataSource: name });
      this.reloadCallbacks[name]?.forEach((cb) => cb(collections));
    });
    callback && callback();
  }

  async reloadAll(callback?: () => void) {
    await this.reloadMain();
    await this.reloadThirdDataSource();
    callback && callback();
  }

  addReloadCallback(callback: ReloadCallback, dataSource = DEFAULT_DATA_SOURCE_NAME) {
    if (!this.reloadCallbacks[dataSource]) {
      this.reloadCallbacks[dataSource] = [];
    }

    this.reloadCallbacks[dataSource].push(callback);
  }

  private getInheritData() {
    return {
      collections: this.collections,
      collectionTemplateInstances: this.collectionTemplateInstances,
      fieldInterfaceInstances: this.fieldInterfaceInstances,
      collectionMixins: this.collectionMixins,
      dataSourceMap: this.dataSourceMap,
      collectionFieldGroups: this.collectionFieldGroups,
      mainDataSourceFn: this.mainDataSourceFn,
      thirdDataSourceFn: this.thirdDataSourceFn,
      reloadCallbacks: this.reloadCallbacks,
      collectionArr: this.collectionArr,
      options: this.options,
    };
  }

  setInheritData(data: any) {
    Object.assign(this, data);
  }

  inherit(options: CollectionManagerOptionsV2 & { reloadCallback?: (collections: CollectionV2[]) => void } = {}) {
    const { reloadCallback, ...opts } = options;
    const cm = new CollectionManagerV2({}, this.app);
    cm.setInheritData(this.getInheritData());
    cm.init(opts);
    if (reloadCallback) {
      cm.addReloadCallback(reloadCallback);
    }
    return cm;
  }
}
