import { filter } from 'lodash';

import { CollectionFieldOptions, CollectionOptions } from '../../collection-manager';
import { CollectionFieldInterfaceOptions, CollectionFieldInterfaceV2 } from './CollectionFieldInterface';
import { CollectionTemplateOptions, CollectionTemplateV2 } from './CollectionTemplate';
import { CollectionV2 } from './Collection';

import { generalTemplate } from './templates';

export const DEFAULT_COLLECTION_NAMESPACE_TITLE = '{{t("main")}}';
export const DEFAULT_COLLECTION_NAMESPACE_NAME = 'main';

interface GetCollectionOptions {
  ns?: string;
}

export interface CollectionManagerOptionsV2 {
  collections?: Record<string, CollectionV2[] | CollectionOptions[]> | CollectionV2[] | CollectionOptions[];
  collectionTemplates?: CollectionTemplateV2[] | CollectionTemplateOptions[];
  collectionFieldInterfaces?: CollectionFieldInterfaceV2[] | CollectionFieldInterfaceOptions[];
  collectionNamespaces?: Record<string, string>;
}

export class CollectionManagerV2 {
  protected collections: Record<string, Record<string, CollectionV2>> = {};
  protected collectionTemplates: Record<string, CollectionTemplateV2> = {
    [generalTemplate.name]: generalTemplate,
  };
  protected collectionFieldInterfaces: Record<string, CollectionFieldInterfaceV2> = {};
  protected collectionNamespaces: Record<string, string> = {
    [DEFAULT_COLLECTION_NAMESPACE_NAME]: DEFAULT_COLLECTION_NAMESPACE_TITLE,
  };

  constructor(options: CollectionManagerOptionsV2 = {}) {
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
  addCollections(collections: (CollectionOptions | CollectionV2)[], options: GetCollectionOptions = {}) {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    collections
      .map((collection) => {
        if (collection instanceof CollectionV2) {
          return collection;
        }
        const collectionTemplateInstance = collection.template
          ? this.getCollectionTemplate(collection.template)
          : generalTemplate;
        return new collectionTemplateInstance.Collection(collection);
      })
      .forEach((collectionInstance) => {
        if (!this.collections[ns]) {
          this.collections[ns] = {};
        }
        this.collections[ns][collectionInstance.name] = collectionInstance;
      });
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
  getCollection(path: string, options: GetCollectionOptions = {}): CollectionV2 | undefined {
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options;
    this.checkNamespace(ns);
    if (path.split('.').length > 1) {
      // 获取到关联字段
      const associationField = this.getCollectionField(path);

      return this.getCollection(associationField.target, { ns });
    }
    return this.collections[ns]?.[path];
  }
  getCollectionName(path: string, options: GetCollectionOptions = {}) {
    return this.getCollection(path, options)?.name;
  }
  /**
   * 获取数据表字段
   * @example
   * getCollection('users.username'); // 获取 users 表的 username 字段
   * getCollection('a.b.c'); // 获取 a 表的 b 字段的关联表，然后 b.target 表对应的 c 字段
   */
  getCollectionField(path: string, options: GetCollectionOptions = {}): CollectionFieldOptions | undefined {
    const arr = path.split('.');
    if (arr.length < 2) {
      return;
    }
    const [collectionName, fieldName, ...otherFieldNames] = path.split('.');
    const { ns = DEFAULT_COLLECTION_NAMESPACE_NAME } = options || {};
    this.checkNamespace(ns);
    const collection = this.getCollection(collectionName, { ns });
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
  addCollectionTemplates(templates: CollectionTemplateV2[] | CollectionTemplateOptions[]) {
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
  getCollectionTemplate(name: string = generalTemplate.name) {
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
  getCollectionFieldInterface(name: string) {
    return this.collectionFieldInterfaces[name];
  }
}
