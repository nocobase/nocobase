import type { SchemaKey } from '@formily/json-schema';
import type { DataSource } from '../data-source';
import type { CollectionFieldOptions, CollectionOptions, GetCollectionFieldPredicate } from './Collection';

import { Collection } from './Collection';
import { applyMixins, collectionTransform } from './utils';

export class CollectionManager {
  public collectionInstancesMap: Record<string, Collection> = {};
  public collectionInstancesArr: Collection[] = [];

  constructor(
    collections: CollectionOptions[],
    public dataSource: DataSource,
  ) {
    this.addCollections(collections);
  }

  get dataSourceManager() {
    return this.dataSource.dataSourceManager;
  }

  get app() {
    return this.dataSourceManager.app;
  }

  protected getCollectionInstance(collection: CollectionOptions) {
    const collectionTemplateInstance =
      this.dataSource.dataSourceManager.collectionTemplateManager.getCollectionTemplate(collection.template);
    const Cls = collectionTemplateInstance?.Collection || Collection;
    const transform = collectionTemplateInstance?.transform;
    const transformedCollection = transform
      ? transform(collectionTransform(collection, this.app), this.app)
      : collectionTransform(collection, this.dataSource.dataSourceManager.app);
    const options = { ...transformedCollection, dataSource: this.dataSource.key };
    const instance = applyMixins(Cls, this.dataSourceManager.collectionMixins, options, this);
    return instance;
  }

  private getInstancesMap(collections: CollectionOptions[] = []): Record<string, Collection> {
    const instances = collections.map((collection) => this.getCollectionInstance(collection));
    return instances.reduce<Record<string, Collection>>((acc, collectionInstance) => {
      acc[collectionInstance.name] = collectionInstance;
      return acc;
    }, {});
  }

  addCollections(collections: CollectionOptions[] = []) {
    const newInstancesMap = this.getInstancesMap(collections);

    this.collectionInstancesMap = {
      ...this.collectionInstancesMap,
      ...newInstancesMap,
    };

    this.collectionInstancesArr = Object.values(this.collectionInstancesMap);
  }

  setCollections(collections: CollectionOptions[]) {
    this.collectionInstancesMap = this.getInstancesMap(collections);
    this.collectionInstancesArr = Object.values(this.collectionInstancesMap);
  }

  reAddCollections(collectionInstances: Collection[] = this.collectionInstancesArr) {
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
  getCollection<Mixins = {}>(path: SchemaKey | CollectionOptions): (Mixins & Collection) | undefined {
    if (!path) return undefined;

    if (typeof path === 'object') {
      return this.getCollectionInstance(path) as Mixins & Collection;
    }

    if (String(path).split('.').length > 1) {
      const associationField = this.getCollectionField(path);
      if (!associationField) return undefined;
      return this.getCollection(associationField.target);
    }

    return this.collectionInstancesMap[path] as Mixins & Collection;
  }

  getCollections(predicate?: (collection: Collection) => boolean) {
    if (predicate) {
      return this.collectionInstancesArr.filter(predicate);
    }
    return this.collectionInstancesArr;
  }

  getCollectionName(path: SchemaKey | CollectionOptions): string | undefined {
    const res = this.getCollection(path);
    return res?.name;
  }

  /**
   * Get collection field
   * @example
   * getField('users.username'); // Get the 'username' field of the 'users' collection
   * getField('a.b.c'); // Get the associated collection of the 'c' field in the 'a' collection, which is associated with the 'b' field in the 'a' collection
   */
  getCollectionField(path: SchemaKey | CollectionFieldOptions) {
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

  getCollectionFields(collectionName: string, predicate?: GetCollectionFieldPredicate) {
    return this.getCollection(collectionName)?.getFields(predicate) || [];
  }

  /**
   * @internal
   */
  clone(collections: CollectionOptions[] = []) {
    const collectionManager = new CollectionManager([], this.dataSource);

    collectionManager.collectionInstancesArr = this.collectionInstancesArr;
    collectionManager.collectionInstancesMap = this.collectionInstancesMap;

    collectionManager.addCollections(collections);
    return collectionManager;
  }
}
