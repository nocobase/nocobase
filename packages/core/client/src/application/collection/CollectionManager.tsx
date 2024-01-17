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

export const DEFAULT_COLLECTION_NAMESPACE_TITLE = '{{t("main")}}';
export const DEFAULT_COLLECTION_NAMESPACE_NAME = 'main';

export interface GetCollectionOptions {
  namespace?: string;
}

export interface CollectionManagerOptionsV2 {
  collections?: CollectionOptionsV2[] | Record<string, CollectionOptionsV2[]>;
  collectionTemplates?: (typeof CollectionTemplateBase)[];
  fieldInterfaces?: (typeof CollectionFieldInterfaceBase)[];
  fieldGroups?: Record<string, { label: string; order?: number }>;
  collectionNamespaces?: Record<string, string>;
  collectionMixins?: CollectionMixinConstructor[];
}

export class CollectionManagerV2 {
  public app: Application;
  protected collections: Record<string, Record<string, CollectionV2>> = {};
  protected collectionTemplateInstances: Record<string, CollectionTemplateBase> = {};
  protected fieldInterfaceInstances: Record<string, CollectionFieldInterfaceBase> = {};
  protected collectionMixins: CollectionMixinConstructor[] = [];
  protected collectionNamespaces: Record<string, string> = {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: DEFAULT_COLLECTION_NAMESPACE_TITLE,
  };
  protected collectionFieldGroups: Record<string, { label: string; order?: number }> = {};
  protected mainResource: (...args: any[]) => Promise<CollectionOptionsV2[]>;
  protected thirdResources: ((
    ...args: any[]
  ) => Promise<{ name: string; description: string; collections: CollectionOptionsV2[] }[]>)[] = [];
  protected reloadCallbacks: {
    [key: string]: ((collections: CollectionOptionsV2[]) => void)[];
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
      Object.keys(options.collections || {}).forEach((namespace) => {
        this.addCollections(options.collections[namespace], { namespace });
      });
    }
  }

  private checkNamespace(namespace: string) {
    if (!this.collectionNamespaces[namespace]) {
      throw new Error(
        `[@nocobase/client]: CollectionManager "${namespace}" does not exist in namespace, you should call collectionManager.addNamespaces() to add it`,
      );
    }
  }

  // collection mixins
  addCollectionMixins(mixins: CollectionMixinConstructor[]) {
    if (mixins.length === 0) return;
    const newMixins = mixins.filter((mixin) => !this.collectionMixins.includes(mixin));
    this.collectionMixins.push(...newMixins);

    // 重新添加数据表
    Object.keys(this.collections).forEach((namespace) => {
      const collections = this.getCollections({ namespace });
      this.addCollections(collections, { namespace });
    });
  }

  // collections
  addCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}) {
    const { namespace = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(namespace);
    this.collectionArr[namespace] = undefined;

    collections
      .map((collection) => {
        const collectionTemplateInstance = this.getCollectionTemplate(collection.template);
        const Cls = collectionTemplateInstance?.Collection || CollectionV2;
        const transform = collectionTemplateInstance?.transform || defaultCollectionTransform;
        const transformedCollection = transform(collection, this.app);
        const instance = new Cls({ ...transformedCollection, namespace: namespace }, this.app, this);
        applyMixins(instance, this.collectionMixins);
        return instance;
      })
      .forEach((collectionInstance) => {
        if (!this.collections[namespace]) {
          this.collections[namespace] = {};
        }
        this.collections[namespace][collectionInstance.name] = collectionInstance;
      });
  }
  setCollections(collections: CollectionOptionsV2[], options: GetCollectionOptions = {}) {
    const { namespace = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(namespace);
    this.collections[namespace] = {};
    this.addCollections(collections, options);
  }
  getAllCollections(
    predicate?: (collection: CollectionV2) => boolean,
  ): { nsName: string; nsTitle: string; collections: CollectionV2[] }[] {
    return Object.keys(this.collectionNamespaces).reduce<
      { nsName: string; nsTitle: string; collections: CollectionV2[] }[]
    >((acc, namespace) => {
      acc.push({
        nsName: namespace,
        nsTitle: this.collectionNamespaces[namespace],
        collections: this.getCollections({ predicate, namespace }),
      });
      return acc;
    }, []);
  }
  getCollections(options: { predicate?: (collection: CollectionV2) => boolean; namespace?: string } = {}) {
    const { namespace = DEFAULT_COLLECTION_NAMESPACE_NAME, predicate } = options;
    if (!this.collectionArr[namespace]?.length) {
      this.collectionArr[namespace] = Object.values(this.collections[namespace] || {});
    }
    if (predicate) {
      return this.collectionArr[namespace].filter(predicate);
    }
    return this.collectionArr[namespace];
  }
  /**
   * 获取数据表
   * @example
   * getCollection('users'); // 获取 users 表
   * getCollection('users.profile'); // 获取 users 表的 profile 字段的关联表
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段的关联表
   */
  getCollection<Mixins = {}>(path: string, options: GetCollectionOptions = {}): (Mixins & CollectionV2) | undefined {
    const { namespace = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    if (!path || typeof path !== 'string') return undefined;
    this.checkNamespace(namespace);
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = this.getCollectionField(path);

      return this.getCollection(associationField.target, { namespace });
    }
    return this.collections[namespace]?.[path] as Mixins & CollectionV2;
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
    const { namespace = DEFAULT_COLLECTION_NAMESPACE_NAME } = options || {};
    this.checkNamespace(namespace);
    const collection = this.getCollection(collectionName, { namespace });
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
  addCollectionTemplates(templateClasses: (typeof CollectionTemplateBase)[]) {
    const newCollectionTemplateInstances = templateClasses.reduce((acc, Template) => {
      const instance = new Template(this.app, this);
      acc[instance.name] = instance;
      return acc;
    }, {});
    Object.assign(this.collectionTemplateInstances, newCollectionTemplateInstances);

    // 重新添加数据表
    const reAddCollections = Object.keys(this.collections).reduce<Record<string, CollectionOptionsV2[]>>(
      (acc, namespace) => {
        acc[namespace] = this.getCollections({
          predicate: (collection) => {
            return newCollectionTemplateInstances[collection.template];
          },
          namespace,
        }).map((collection) => collection.getOptions());
        return acc;
      },
      {},
    );

    Object.keys(reAddCollections).forEach((namespace) => {
      this.addCollections(reAddCollections[namespace], { namespace });
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

  setMainResource(fn: (...args: any[]) => Promise<CollectionOptionsV2[]>) {
    this.mainResource = fn;
  }

  addThirdResource(
    fn: (...args: any[]) => Promise<{ name: string; description: string; collections: CollectionOptionsV2[] }[]>,
  ) {
    if (!this.thirdResources.includes(fn)) {
      this.thirdResources.push(fn);
    }
  }

  async reloadMain(callback?: (collections?: CollectionOptionsV2[]) => void) {
    const collections = await this.mainResource();
    this.setCollections(collections);
    callback && callback(collections);
    this.reloadCallbacks[DEFAULT_COLLECTION_NAMESPACE_NAME]?.forEach((cb) => cb(collections));
  }

  private async reloadThird(
    thirdResource: (
      ...args: any[]
    ) => Promise<{ name: string; description: string; collections: CollectionOptionsV2[] }[]>,
  ) {
    const data = await thirdResource();
    data.forEach(({ name, description, collections }) => {
      this.addCollectionNamespaces({ [name]: description });
      this.setCollections(collections, { namespace: name });
      this.reloadCallbacks[name]?.forEach((cb) => cb(collections));
    });
  }

  private async reloadThirds(callback?: () => void) {
    await Promise.all(this.thirdResources.map((thirdResource) => this.reloadThird(thirdResource)));
    callback && callback();
  }

  async reloadAll(callback?: () => void) {
    await this.reloadMain();
    await this.reloadThirds();
    callback && callback();
  }

  addReloadCallback(
    callback: (collections: CollectionOptionsV2[]) => void,
    namespace = DEFAULT_COLLECTION_NAMESPACE_NAME,
  ) {
    if (!this.reloadCallbacks[namespace]) {
      this.reloadCallbacks[namespace] = [];
    }

    this.reloadCallbacks[namespace].push(callback);
  }

  private getInheritData() {
    return {
      collections: this.collections,
      collectionTemplateInstances: this.collectionTemplateInstances,
      fieldInterfaceInstances: this.fieldInterfaceInstances,
      collectionMixins: this.collectionMixins,
      collectionNamespaces: this.collectionNamespaces,
      collectionFieldGroups: this.collectionFieldGroups,
      mainResource: this.mainResource,
      thirdResources: this.thirdResources,
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
