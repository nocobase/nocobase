import { CollectionFieldInterfaceV2 } from './CollectionFieldInterface';
import { CollectionTemplateV2, CollectionTemplateV2Options } from './CollectionTemplate';
import { CollectionFieldOptionsV2, CollectionOptionsV2, CollectionV2 } from './Collection';
import type { Application } from '../Application';
import { IField } from '../../collection-manager';
import { SchemaKey } from '@formily/react';

export type CollectionMixinConstructor<T = {}> = new (...args: any[]) => T;
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

function applyMixins(derivedCtor: CollectionMixinConstructor, baseCtors: CollectionMixinConstructor[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!);
    });
  });
}

export const DEFAULT_COLLECTION_NAMESPACE_TITLE = '{{t("main")}}';
export const DEFAULT_COLLECTION_NAMESPACE_NAME = 'main';

export interface GetCollectionOptions {
  ns?: string;
}

export interface CollectionManagerOptionsV2 {
  collections?: Record<string, CollectionOptionsV2[]> | CollectionOptionsV2[];
  collectionTemplates?: (typeof CollectionTemplateV2)[];
  collectionFieldInterfaces?: (typeof CollectionFieldInterfaceV2)[];
  collectionNamespaces?: Record<string, string>;
  collectionMixins?: CollectionMixinConstructor[];
}

export class CollectionManagerV2<Mixins = {}> {
  public app: Application;
  protected collections: Record<string, Record<string, CollectionV2>> = {};
  // protected collectionTemplateClasses: typeof CollectionTemplateV2[] = [];
  protected collectionTemplateInstances: Record<string, CollectionTemplateV2> = {};
  // protected collectionFieldInterfaceClasses: typeof CollectionFieldInterfaceV2[] = [];
  protected collectionFieldInterfaceInstances: Record<string, CollectionFieldInterfaceV2> = {};
  protected collectionMixins: CollectionMixinConstructor[] = [];
  protected collectionNamespaces: Record<string, string> = {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: DEFAULT_COLLECTION_NAMESPACE_TITLE,
  };
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
  }

  init(options: CollectionManagerOptionsV2) {
    Object.assign(this.collectionMixins, options.collectionMixins || []);
    this.addCollectionTemplates(options.collectionTemplates || []);
    this.addCollectionFieldInterfaces(options.collectionFieldInterfaces || []);
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

  addCollectionMixins(mixins: CollectionMixinConstructor[]) {
    if (mixins.length === 0) return;
    this.collectionMixins.push(...mixins);

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
        if (collection instanceof CollectionV2) {
          return collection;
        }
        const collectionTemplateInstance = this.getCollectionTemplate(collection.template);
        const Cls = collectionTemplateInstance?.Collection || CollectionV2;
        // eslint-disable-next-line prettier/prettier
        class CombinedClass extends Cls { }
        applyMixins(CombinedClass, this.collectionMixins);
        const instance = new CombinedClass(collection, this);

        if (collectionTemplateInstance && collectionTemplateInstance.transform) {
          collectionTemplateInstance.transform(instance);
        }
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
    if (!predicate && this.collectionArr[ns]) {
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
  getCollection(path: string, options: GetCollectionOptions = {}): (Mixins & CollectionV2) | undefined {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    if (!path) return undefined;
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
  removeCollection(path: string, options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = this.getCollectionField(path);

      return this.removeCollection(associationField.target, { ns });
    }
    delete this.collections[ns]?.[path];
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
    const arr = String(path).split('.');
    if (arr.length < 2) {
      throw new Error(`[@nocobase/client]: CollectionManager.getCollectionField() path "${path}" is invalid`);
    }
    const [collectionName, fieldName, ...otherFieldNames] = String(path).split('.');
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options || {};
    this.checkNamespace(ns);
    const collection = this.getCollection(collectionName, { ns });
    if (!collection) {
      return;
    }
    const field = collection.getField(fieldName);
    if (!field) return;
    if (otherFieldNames.length === 0) {
      return field;
    }
    return this.getCollectionField(`${field.target}.${otherFieldNames.join('.')}`, { ns });
  }

  // collectionNamespaces
  addCollectionNamespaces(collectionNamespaces: Record<string, string>) {
    Object.assign(this.collectionNamespaces, collectionNamespaces);
  }
  getCollectionNamespaces() {
    return Object.entries(this.collectionNamespaces).map(([name, title]) => ({ name, title }));
  }

  // CollectionTemplates
  addCollectionTemplates(
    templateClasses:
      | (CollectionTemplateV2Options | typeof CollectionTemplateV2)[]
      | Record<string, CollectionTemplateV2Options>,
  ) {
    // this.collectionTemplateClasses = [...this.collectionTemplateClasses, ...templateClasses];
    const newCollectionTemplateInstances =
      typeof templateClasses === 'object' && !Array.isArray(templateClasses)
        ? templateClasses
        : templateClasses.reduce((acc, Template) => {
            const instance = typeof Template === 'function' ? new Template() : Template;
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
  getCollectionTemplate(name: string) {
    return this.collectionTemplateInstances[name];
  }

  // field interface
  addCollectionFieldInterfaces(interfaces: (IField | typeof CollectionFieldInterfaceV2)[] | Record<string, IField>) {
    // this.collectionFieldInterfaceClasses = [...this.collectionFieldInterfaceClasses, ...interfaces];
    if (typeof interfaces === 'object' && !Array.isArray(interfaces)) {
      Object.assign(this.collectionFieldInterfaceInstances, interfaces);
      return;
    }
    const newCollectionFieldInterfaces = interfaces.reduce((acc, Interface) => {
      const instance = typeof Interface === 'function' ? new Interface() : Interface;
      acc[instance.name] = instance;
      return acc;
    }, {});

    Object.assign(this.collectionFieldInterfaceInstances, newCollectionFieldInterfaces);
  }
  getCollectionFieldInterfaces() {
    return Object.values(this.collectionFieldInterfaceInstances);
  }
  // getCollectionFieldInterfaceGroups(): { name: string; children: CollectionFieldInterfaceV2[] }[] {
  //   return Object.values(
  //     Object.values(this.collectionFieldInterfaceInstances).reduce<
  //       Record<string, { name: string; children: CollectionFieldInterfaceV2[] }>
  //     >((memo, fieldInterface) => {
  //       const group = fieldInterface.group || 'basic';
  //       if (!memo[group]) {
  //         memo[group] = {
  //           name: group,
  //           children: [],
  //         };
  //       }
  //       memo[group].children.push(fieldInterface);
  //       return memo;
  //     }, {}),
  //   ).map((item) => {
  //     item.children = item.children.sort((a, b) => (a.order || 0) - (b.order || 0));
  //     return item;
  //   });
  // }
  getCollectionFieldInterface(name: string) {
    return this.collectionFieldInterfaceInstances[name];
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
      // collectionTemplateClasses: this.collectionTemplateClasses,
      collectionTemplateInstances: this.collectionTemplateInstances,
      // collectionFieldInterfaceClasses: this.collectionFieldInterfaceClasses,
      collectionFieldInterfaceInstances: this.collectionFieldInterfaceInstances,
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
