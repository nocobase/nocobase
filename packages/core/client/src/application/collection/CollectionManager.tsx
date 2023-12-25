import { filter } from 'lodash';

import { CollectionFieldInterfaceOptions, CollectionFieldInterfaceV2 } from './CollectionFieldInterface';
import { CollectionTemplateOptionsV2, CollectionTemplateV2 } from './CollectionTemplate';
import { CollectionFieldOptionsV2, CollectionOptionsV2, CollectionV2 } from './Collection';
import type { Application } from '../Application';

export const DEFAULT_COLLECTION_NAMESPACE_TITLE = '{{t("main")}}';
export const DEFAULT_COLLECTION_NAMESPACE_NAME = 'main';

export interface GetCollectionOptions {
  ns?: string;
}

export interface CollectionManagerOptionsV2 {
  collections?: Record<string, CollectionV2[] | CollectionOptionsV2[]> | CollectionV2[] | CollectionOptionsV2[];
  collectionTemplates?: CollectionTemplateV2[] | CollectionTemplateOptionsV2[];
  collectionFieldInterfaces?: CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[];
  collectionNamespaces?: Record<string, string>;
}

export class CollectionManagerV2 {
  public app: Application;
  protected collections: Record<string, Record<string, CollectionV2>> = {};
  protected collectionTemplates: Record<string, CollectionTemplateV2> = {};
  protected collectionFieldInterfaces: Record<string, CollectionFieldInterfaceV2> = {};
  protected collectionNamespaces: Record<string, string> = {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: DEFAULT_COLLECTION_NAMESPACE_TITLE,
  };

  constructor(options: CollectionManagerOptionsV2 = {}, app: Application) {
    this.app = app;
    if (Array.isArray(options.collections)) {
      this.addCollections(options.collections);
    } else {
      Object.keys(options.collections || {}).forEach((ns) => {
        this.addCollections(options.collections[ns], { ns });
      });
    }
    this.addCollectionTemplates(options.collectionTemplates || []);
    this.addCollectionFieldInterfaces(options.collectionFieldInterfaces || []);
    this.addCollectionNamespaces(options.collectionNamespaces || {});
  }

  private checkNamespace(ns: string) {
    if (!this.collectionNamespaces[ns]) {
      throw new Error(
        `[@nocobase/client]: CollectionManager "${ns}" does not exist in namespace, you should call collectionManager.addNamespaces() to add it`,
      );
    }
  }

  // collections
  addCollections(collections: (CollectionOptionsV2 | CollectionV2)[], options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    collections
      .map((collection) => {
        if (collection instanceof CollectionV2) {
          return collection;
        }
        const collectionTemplateInstance = this.getCollectionTemplate(collection.template);
        const Cls = collectionTemplateInstance?.Collection || CollectionV2;
        const ins = new Cls(collection, this);
        if (collectionTemplateInstance && collectionTemplateInstance.transform) {
          collectionTemplateInstance.transform(ins);
        }
        return ins;
      })
      .forEach((collectionInstance) => {
        if (!this.collections[ns]) {
          this.collections[ns] = {};
        }
        this.collections[ns][collectionInstance.name] = collectionInstance;
      });
  }
  setCollections(collections: (CollectionOptionsV2 | CollectionV2)[], options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    this.collections[ns] = {};
    this.addCollections(collections, options);
  }
  getAllCollections() {
    return this.collections;
  }
  getCollections(ns: string = DEFAULT_COLLECTION_NAMESPACE_NAME, predicate?: (collection: CollectionV2) => boolean) {
    return filter(Object.values(this.collections[ns]), predicate);
  }
  /**
   * 获取数据表
   * @example
   * getCollection('users'); // 获取 users 表
   * getCollection('users.profile'); // 获取 users 表的 profile 字段的关联表
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段的关联表
   */
  async getCollection(path: string, options: GetCollectionOptions = {}): Promise<CollectionV2 | undefined> {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = await this.getCollectionField(path);

      return this.getCollection(associationField.target, { ns });
    }
    return this.collections[ns]?.[path];
  }
  async getCollectionName(path: string, options: GetCollectionOptions = {}): Promise<string | undefined> {
    const res = await this.getCollection(path, options);
    return res?.name;
  }
  async removeCollection(path: string, options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = await this.getCollectionField(path);

      return this.removeCollection(associationField.target, { ns });
    }
    delete this.collections[ns]?.[path];
  }

  /**
   * 获取数据表字段
   * @example
   * getCollection('users.username'); // 获取 users 表的 username 字段
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段
   */
  async getCollectionField(
    path: string,
    options: GetCollectionOptions = {},
  ): Promise<CollectionFieldOptionsV2 | undefined> {
    const arr = path.split('.');
    if (arr.length < 2) {
      throw new Error(`[@nocobase/client]: CollectionManager.getCollectionField() path "${path}" is invalid`);
    }
    const [collectionName, fieldName, ...otherFieldNames] = path.split('.');
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options || {};
    this.checkNamespace(ns);
    const collection = await this.getCollection(collectionName, { ns });
    if (!collection) {
      return;
    }
    const field = collection.getField(fieldName);
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
  addCollectionTemplates(templates: CollectionTemplateV2[] | CollectionTemplateOptionsV2[]) {
    templates
      .map((template) => {
        if (template instanceof CollectionTemplateV2) {
          return template;
        }
        return new CollectionTemplateV2(template);
      })
      .forEach((template) => {
        this.collectionTemplates[template.name] = template;
      });
  }
  getCollectionTemplates() {
    return Object.values(this.collectionTemplates);
  }
  getCollectionTemplate(name: string) {
    return this.collectionTemplates[name];
  }

  // field interface
  addCollectionFieldInterfaces(interfaces: CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[]) {
    interfaces
      .map((fieldInterface) => {
        if (fieldInterface instanceof CollectionFieldInterfaceV2) {
          return fieldInterface;
        }
        return new CollectionFieldInterfaceV2(fieldInterface);
      })
      .forEach((fieldInterface) => {
        this.collectionFieldInterfaces[fieldInterface.name] = fieldInterface;
      });
  }
  getCollectionFieldInterfaces() {
    return Object.values(this.collectionFieldInterfaces);
  }
  getCollectionFieldInterfaceGroups(): { name: string; children: CollectionFieldInterfaceV2[] }[] {
    return Object.values(
      Object.values(this.collectionFieldInterfaces).reduce<
        Record<string, { name: string; children: CollectionFieldInterfaceV2[] }>
      >((memo, fieldInterface) => {
        const group = fieldInterface.group || 'basic';
        if (!memo[group]) {
          memo[group] = {
            name: group,
            children: [],
          };
        }
        memo[group].children.push(fieldInterface);
        return memo;
      }, {}),
    );
  }
  getCollectionFieldInterface(name: string) {
    return this.collectionFieldInterfaces[name];
  }
}
