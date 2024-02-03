import type { SchemaKey } from '@formily/json-schema';
import type { Application } from '../../Application';
import type { DataSourceV3, DataSourceManagerV3 } from '../data-source';
import type { CollectionFieldOptionsV3, CollectionOptionsV3 } from './Collection';

import { CollectionV3 } from './Collection';
import { applyMixins, collectionTransform } from './utils';

export class CollectionManagerV3 {
  public collectionInstancesMap: Record<string, CollectionV3> = {};
  public collectionInstancesArr: CollectionV3[] = [];

  constructor(
    collections: CollectionOptionsV3[],
    public app: Application,
    public dataSourceManager: DataSourceManagerV3,
    public dataSource: DataSourceV3,
  ) {
    this.addCollections(collections);
  }

  protected getCollectionInstance(collection: CollectionOptionsV3) {
    const collectionTemplateInstance = this.dataSourceManager.collectionTemplateManager.getCollectionTemplate(
      collection.template,
    );
    const Cls = collectionTemplateInstance?.Collection || CollectionV3;
    const transform = collectionTemplateInstance?.transform;
    const transformedCollection = transform
      ? transform(collectionTransform(collection, this.app), this.app)
      : collectionTransform(collection, this.app);
    const instance = new Cls(
      { ...transformedCollection, dataSource: this.dataSource.key },
      this.app,
      this.dataSourceManager,
      this.dataSource,
      this,
    );
    applyMixins(instance, this.dataSourceManager.collectionMixins);
    return instance;
  }

  addCollections(collections: CollectionOptionsV3[] = []) {
    this.collectionInstancesArr = collections.map((collection) => this.getCollectionInstance(collection));

    this.collectionInstancesMap = this.collectionInstancesArr.reduce((acc, collectionInstance) => {
      acc[collectionInstance.name] = collectionInstance;
      return acc;
    }, {});
  }

  /**
   * Get a collection
   * @example
   * getCollection('users'); // Get the 'users' collection
   * getCollection('users.profile'); // Get the associated collection of the 'profile' field in the 'users' collection
   * getCollection('a.b.c'); // Get the associated collection of the 'c' field in the 'a' collection, which is associated with the 'b'  field in the 'a' collection
   */
  getCollection<Mixins = {}>(path: SchemaKey | CollectionOptionsV3): (Mixins & CollectionV3) | undefined {
    if (!path) return undefined;

    if (typeof path === 'object') {
      return this.getCollectionInstance(path) as Mixins & CollectionV3;
    }

    if (String(path).split('.').length > 1) {
      const associationField = this.getCollectionField(path);
      if (!associationField) return undefined;
      return this.getCollection(associationField.target);
    }

    return this.collectionInstancesMap[path] as Mixins & CollectionV3;
  }

  getCollections(predicate?: (collection: CollectionV3) => boolean) {
    if (predicate) {
      return this.collectionInstancesArr.filter(predicate);
    }
    return this.collectionInstancesArr;
  }

  getCollectionName(path: SchemaKey | CollectionOptionsV3): string | undefined {
    const res = this.getCollection(path);
    return res?.name;
  }

  /**
   * Get collection field
   * @example
   * getField('users.username'); // Get the 'username' field of the 'users' collection
   * getField('a.b.c'); // Get the associated collection of the 'c' field in the 'a' collection, which is associated with the 'b' field in the 'a' collection
   */
  getCollectionField(path: SchemaKey | CollectionFieldOptionsV3) {
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

  getCollectionFields(collectionName: string) {
    return this.getCollection(collectionName)?.getFields() || [];
  }

  clone(collections: CollectionOptionsV3[] = []) {
    const collectionManager = new CollectionManagerV3([], this.app, this.dataSourceManager, this.dataSource);

    collectionManager.collectionInstancesArr = this.collectionInstancesArr;
    collectionManager.collectionInstancesMap = this.collectionInstancesMap;

    collectionManager.addCollections(collections);
    return collectionManager;
  }
}
