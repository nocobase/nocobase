/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { SchemaKey } from '@formily/json-schema';
import qs from 'qs';
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

  getCollectionAllFields(collectionName: string, predicate?: GetCollectionFieldPredicate) {
    return this.getCollection(collectionName)?.getAllFields(predicate) || [];
  }

  /**
   * @example
   * getFilterByTK('users', { id: 1 }); // 1
   * getFilterByTK('users.profile', { name: 'name' }); // name
   *
   * @param collectionOrAssociation - collection name or association name
   * @param collectionRecordOrAssociationRecord - collection record or association record
   * @returns the value of the filterByTK
   */
  getFilterByTK(
    collectionOrAssociation: string | Collection,
    collectionRecordOrAssociationRecord: Record<string, any>,
  ) {
    if (!collectionOrAssociation || !collectionRecordOrAssociationRecord) {
      console.error(
        '@nocobase/client]: CollectionManager.getFilterByTK() collectionOrAssociation or collectionRecordOrAssociationRecord is invalid',
      );
      return;
    }

    const buildFilterByTk = (targetKey: string | string[], record: Record<string, any>) => {
      if (Array.isArray(targetKey)) {
        const filterByTk = {};
        targetKey.forEach((key) => {
          filterByTk[key] = record[key];
        });
        return qs.stringify(filterByTk);
      } else {
        return record[targetKey];
      }
    };

    if (collectionOrAssociation instanceof Collection) {
      const targetKey = collectionOrAssociation.getFilterTargetKey();
      return buildFilterByTk(targetKey, collectionRecordOrAssociationRecord);
    }

    if (collectionOrAssociation.includes('.')) {
      const field = this.getCollectionField(collectionOrAssociation);
      // 字段不存在，返回空
      if (!field) {
        console.error(
          `[@nocobase/client]: CollectionManager.getFilterByTK() field "${collectionOrAssociation}" is invalid`,
        );
        return;
      }
      if (field.targetKey) {
        return collectionRecordOrAssociationRecord[field.targetKey];
      }
    }
    const targetCollection = this.getCollection(collectionOrAssociation);

    if (!targetCollection) {
      console.error(
        `[@nocobase/client]: CollectionManager.getFilterByTK() collection "${collectionOrAssociation}" is invalid`,
      );
      return;
    }
    const targetKey = targetCollection.getFilterTargetKey();
    return buildFilterByTk(targetKey, collectionRecordOrAssociationRecord);
  }

  getSourceKeyByAssociation(associationName: string) {
    if (!associationName) {
      return;
    }
    const field = this.getCollectionField(associationName);
    // 字段不存在，返回空
    if (!field) {
      return;
    }
    // hasOne 和 hasMany 和 belongsToMany 的字段存在 sourceKey，所以会直接返回 sourceKey；
    if (field.sourceKey) {
      return field.sourceKey;
    }
    // belongsTo 不存在 sourceKey，所以会使用 filterTargetKey；
    const sourceCollection = this.getCollection(associationName.split('.')[0]);
    // source collection 不存在，返回空
    if (!sourceCollection) {
      return;
    }
    // 后面的主键和 id 是为了保险起见加上的；
    return sourceCollection.filterTargetKey || sourceCollection.getPrimaryKey() || 'id';
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
