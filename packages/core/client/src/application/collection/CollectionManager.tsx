import { CollectionFieldInterface } from './CollectionFieldInterface';
import { CollectionTemplate } from './CollectionTemplate';
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

export const DEFAULT_COLLECTION_NAMESPACE_TITLE = '{{t("main")}}';
export const DEFAULT_COLLECTION_NAMESPACE_NAME = 'main';

export interface GetCollectionOptions {
  ns?: string;
}

export interface CollectionManagerOptionsV2 {
  collections?: CollectionOptionsV2[] | Record<string, CollectionOptionsV2[]>;
  collectionTemplates?: (typeof CollectionTemplate)[];
  fieldInterfaces?: (typeof CollectionFieldInterface)[];
  fieldGroups?: Record<string, { label: string; order?: number }>;
  collectionNamespaces?: Record<string, string>;
  collectionMixins?: CollectionMixinConstructor[];
}

export class CollectionManagerV2 {
  public app: Application;
  protected collections: Record<string, Record<string, CollectionV2>> = {};
  protected collectionTemplateInstances: Record<string, CollectionTemplate> = {};
  protected fieldInterfaceInstances: Record<string, CollectionFieldInterface> = {};
  protected collectionMixins: CollectionMixinConstructor[] = [];
  protected collectionNamespaces: Record<string, string> = {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: DEFAULT_COLLECTION_NAMESPACE_TITLE,
  };
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};
  protected reloadFns?: {
    [key: string]: (...args: any[]) => Promise<any>;
  } = {};
  protected reloadCallbacks: {
    [key: string]: ((collections: CollectionV2[]) => void)[];
  } = {};
  protected collectionArr: Record<string, CollectionV2[]> = {};
  protected options: CollectionManagerOptionsV2 = {};

  constructor(options: CollectionManagerOptionsV2 = {}, app: Application) {
    this.options = options;
    this.app = app;
    this.init(options);
  }

  private init(options: CollectionManagerOptionsV2) {
    this.collectionMixins.push(...(options.collectionMixins || []));
    this.addCollectionTemplates(options.collectionTemplates || []);
    this.addFieldInterfaces(options.fieldInterfaces || []);
    this.addFieldGroups(options.fieldGroups || {});
    this.addCollectionNamespaces(options.collectionNamespaces || {});
    if (Array.isArray(options.collections)) {
      this.addCollections(options.collections);
    } else {
      Object.keys(options.collections || {}).forEach((ns) => {
        this.addCollections(options.collections[ns], { ns });
      });
    }
  }

  private checkNamespace(ns: string) {
    if (!this.collectionNamespaces[ns]) {
      throw new Error(
        `[@nocobase/client]: CollectionManager "${ns}" does not exist in namespace, you should call collectionManager.addNamespaces() to add it`,
      );
    }
  }

  // collection mixins
  addCollectionMixins(mixins: CollectionMixinConstructor[]) {
    if (mixins.length === 0) return;
    const newMixins = mixins.filter((mixin) => !this.collectionMixins.includes(mixin));
    this.collectionMixins.push(...newMixins);

    // 重新添加数据表
    Object.keys(this.collections).forEach((ns) => {
      const collections = this.getCollections(undefined, { ns });
      this.addCollections(collections, { ns });
    });
  }

  // collections
  addCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    this.collectionArr[ns] = undefined;

    collections
      .map((collection) => {
        const collectionTemplateInstance = this.getCollectionTemplate(collection.template);
        const Cls = collectionTemplateInstance?.Collection || CollectionV2;
        const transform = collectionTemplateInstance?.transform || defaultCollectionTransform;
        const transformedCollection = transform(collection, this.app);
        const instance = new Cls(transformedCollection, this.app, this);
        applyMixins(instance, this.collectionMixins);
        return instance;
      })
      .forEach((collectionInstance) => {
        if (!this.collections[ns]) {
          this.collections[ns] = {};
        }
        this.collections[ns][collectionInstance.name] = collectionInstance;
      });
  }
  setCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    this.collections[ns] = {};
    this.addCollections(collections, options);
  }
  getAllCollections() {
    return this.collections;
  }
  getCollections(predicate?: (collection: CollectionV2) => boolean, options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    if (!predicate && this.collectionArr[ns]?.length) {
      return this.collectionArr[ns];
    }

    this.collectionArr[ns] = Object.values(this.collections[ns] || {});
    if (predicate) {
      return this.collectionArr[ns].filter(predicate);
    }
    return this.collectionArr[ns];
  }
  /**
   * 获取数据表
   * @example
   * getCollection('users'); // 获取 users 表
   * getCollection('users.profile'); // 获取 users 表的 profile 字段的关联表
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段的关联表
   */
  getCollection<Mixins = {}>(path: string, options: GetCollectionOptions = {}): (Mixins & CollectionV2) | undefined {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    if (!path || typeof path !== 'string') return undefined;
    this.checkNamespace(ns);
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = this.getCollectionField(path);

      return this.getCollection(associationField.target, { ns });
    }
    return this.collections[ns]?.[path] as Mixins & CollectionV2;
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
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options || {};
    this.checkNamespace(ns);
    const collection = this.getCollection(collectionName, { ns });
    if (!collection) {
      return;
    }
    return collection.getField(fieldNames.join('.'));
  }

  // collectionNamespaces
  addCollectionNamespaces(collectionNamespaces: Record<string, string>) {
    Object.assign(this.collectionNamespaces, collectionNamespaces);
  }
  getCollectionNamespaces() {
    return Object.entries(this.collectionNamespaces).map(([name, title]) => ({ name, title }));
  }

  // CollectionTemplates
  addCollectionTemplates(templateClasses: (typeof CollectionTemplate)[]) {
    const newCollectionTemplateInstances = templateClasses.reduce((acc, Template) => {
      const instance = new Template(this.app, this);
      acc[instance.name] = instance;
      return acc;
    }, {});
    Object.assign(this.collectionTemplateInstances, newCollectionTemplateInstances);

    // 重新添加数据表
    const reAddCollections = Object.keys(this.collections).reduce<Record<string, CollectionOptionsV2[]>>((acc, ns) => {
      acc[ns] = this.getCollections(
        (collection) => {
          return newCollectionTemplateInstances[collection.template];
        },
        { ns },
      ).map((collection) => collection.getOptions());
      return acc;
    }, {});

    Object.keys(reAddCollections).forEach((ns) => {
      this.addCollections(reAddCollections[ns], { ns });
    });
  }
  getCollectionTemplates() {
    return Object.values(this.collectionTemplateInstances).sort((a, b) => (a.order || 0) - (b.order || 0));
  }
  getCollectionTemplate<T extends CollectionTemplate>(name: string): T {
    return this.collectionTemplateInstances[name] as T;
  }

  // field interface
  addFieldInterfaces(interfaces: (typeof CollectionFieldInterface)[]) {
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
  getFieldInterface<T extends CollectionFieldInterface>(name: string) {
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

  setReloadFn(fn: (...args: any[]) => Promise<any>, namespace: string = DEFAULT_COLLECTION_NAMESPACE_NAME) {
    this.reloadFns[namespace] = fn;
  }

  async reload(
    callback?: (collections: CollectionV2[]) => void,
    namespace = DEFAULT_COLLECTION_NAMESPACE_NAME,
  ): Promise<void> {
    if (this.reloadFns[namespace]) {
      const collections = await this.reloadFns[namespace]();
      this.setCollections(collections);
      callback && callback(collections);
      this.reloadCallbacks[namespace]?.forEach((cb) => cb(collections));
    }
  }

  addReloadCallback(callback: (collections: CollectionV2[]) => void, namespace = DEFAULT_COLLECTION_NAMESPACE_NAME) {
    if (!this.reloadCallbacks[namespace]) {
      this.reloadCallbacks[namespace] = [];
    }

    this.reloadCallbacks[namespace].push(callback);
  }

  private getInheritData() {
    return {
      collections: this.collections,
      collectionFieldGroups: this.collectionFieldGroups,
      reloadCallbacks: this.reloadCallbacks,
      collectionTemplateInstances: this.collectionTemplateInstances,
      fieldInterfaceInstances: this.fieldInterfaceInstances,
      collectionMixins: this.collectionMixins,
      collectionNamespaces: this.collectionNamespaces,
      reloadFns: this.reloadFns,
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
