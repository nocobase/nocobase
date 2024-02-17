import type { SchemaKey } from '@formily/json-schema';
import type { DataSourceV2 } from '../data-source';
import type { CollectionFieldOptionsV2, CollectionOptionsV2, GetCollectionFieldPredicateV2 } from './Collection';

import { CollectionV2 } from './Collection';
import { applyMixins, collectionTransform } from './utils';

export class CollectionManagerV2 {
  public collectionInstancesMap: Record<string, CollectionV2> = {};
  public collectionInstancesArr: CollectionV2[] = [];

  constructor(
    collections: CollectionOptionsV2[],
    public dataSource: DataSourceV2,
  ) {
    this.addCollections(collections);
  }

  get dataSourceManager() {
    return this.dataSource.dataSourceManager;
  }

  get app() {
    return this.dataSourceManager.app;
  }

  protected getCollectionInstance(collection: CollectionOptionsV2) {
    const collectionTemplateInstance =
      this.dataSource.dataSourceManager.collectionTemplateManager.getCollectionTemplate(collection.template);
    const Cls = collectionTemplateInstance?.Collection || CollectionV2;
    const transform = collectionTemplateInstance?.transform;
    const transformedCollection = transform
      ? transform(collectionTransform(collection, this.app), this.app)
      : collectionTransform(collection, this.dataSource.dataSourceManager.app);
    const instance = new Cls({ ...transformedCollection, dataSource: this.dataSource.key }, this);
    applyMixins(instance, this.dataSourceManager.collectionMixins);
    return instance;
  }

  private getInstancesMap(collections: CollectionOptionsV2[] = []): Record<string, CollectionV2> {
    const instances = collections.map((collection) => this.getCollectionInstance(collection));
    return instances.reduce<Record<string, CollectionV2>>((acc, collectionInstance) => {
      acc[collectionInstance.name] = collectionInstance;
      return acc;
    }, {});
  }

  addCollections(collections: CollectionOptionsV2[] = []) {
    const newInstancesMap = this.getInstancesMap(collections);

    this.collectionInstancesMap = {
      ...this.collectionInstancesMap,
      ...newInstancesMap,
    };

    this.collectionInstancesArr = Object.values(this.collectionInstancesMap);
  }

  setCollections(collections: CollectionOptionsV2[]) {
    this.collectionInstancesMap = this.getInstancesMap(collections);
    this.collectionInstancesArr = Object.values(this.collectionInstancesMap);
  }

  reAddCollections(collectionInstances: CollectionV2[] = this.collectionInstancesArr) {
    const collectionOptions = collectionInstances.map((collection) => collection.getOptions());
    this.addCollections(collectionOptions);
  }

  /**
   * Get a collection
   * @example
   * getCollection('users'); // Get the 'users' collection
   * getCollection('users.profile'); // Get the associated collection of the 'profile' field in the 'users' collection
   * getCollection('a.b.c'); // Get the associated collection of the 'c' field in the 'a' collection, which is associated with the 'b'  field in the 'a' collection
   */
  getCollection<Mixins = {}>(path: SchemaKey | CollectionOptionsV2): (Mixins & CollectionV2) | undefined {
    if (!path) return undefined;

    if (typeof path === 'object') {
      return this.getCollectionInstance(path) as Mixins & CollectionV2;
    }

    if (String(path).split('.').length > 1) {
      const associationField = this.getCollectionField(path);
      if (!associationField) return undefined;
      return this.getCollection(associationField.target);
    }

    return this.collectionInstancesMap[path] as Mixins & CollectionV2;
  }

  getCollections(predicate?: (collection: CollectionV2) => boolean) {
    if (predicate) {
      return this.collectionInstancesArr.filter(predicate);
    }
    return this.collectionInstancesArr;
  }

  getCollectionName(path: SchemaKey | CollectionOptionsV2): string | undefined {
    const res = this.getCollection(path);
    return res?.name;
  }

  /**
   * Get collection field
   * @example
   * getField('users.username'); // Get the 'username' field of the 'users' collection
   * getField('a.b.c'); // Get the associated collection of the 'c' field in the 'a' collection, which is associated with the 'b' field in the 'a' collection
   */
  getCollectionField(path: SchemaKey | CollectionFieldOptionsV2) {
    if (!path) return;

    if (typeof path === 'object') {
      return path;
    }

    if (String(path).split('.').length < 2) {
      console.error(`[@nocobase/client]: CollectionManager.getField() path "${path}" is invalid`);
      return;
    }

    const [collectionName, ...fieldNames] = String(path).split('.');
    const collection = this.getCollection(collectionName);
    if (!collection) {
      return;
    }
    return collection.getField(fieldNames.join('.'));
  }

  getCollectionFields(collectionName: string, predicate?: GetCollectionFieldPredicateV2) {
    return this.getCollection(collectionName)?.getFields(predicate) || [];
  }

  clone(collections: CollectionOptionsV2[] = []) {
    const collectionManager = new CollectionManagerV2([], this.dataSource);

    collectionManager.collectionInstancesArr = this.collectionInstancesArr;
    collectionManager.collectionInstancesMap = this.collectionInstancesMap;

    collectionManager.addCollections(collections);
    return collectionManager;
  }
}
