/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { filter, unionBy, uniq } from 'lodash';
import type { CollectionFieldOptions, GetCollectionFieldPredicate } from '../../data-source';
import { Collection } from '../../data-source/collection/Collection';

export class InheritanceCollectionMixin extends Collection {
  protected parentCollectionsName: string[];
  protected parentCollections: Collection[];
  protected childrenCollections: { supportView?: Collection[]; notSupportView?: Collection[] } = {};
  protected childrenCollectionsName: { supportView?: string[]; notSupportView?: string[] } = {};
  protected inheritsFields: CollectionFieldOptions[];
  protected currentFields: CollectionFieldOptions[];
  protected allFields: CollectionFieldOptions[];
  protected parentCollectionFields: Record<string, CollectionFieldOptions[]> = {};
  protected allCollectionsInheritChain: string[];
  protected inheritCollectionsChain: string[];
  protected inheritChain: string[];
  protected foreignKeyFields: CollectionFieldOptions[];

  getParentCollectionsName() {
    if (this.parentCollectionsName) {
      return this.parentCollectionsName.slice();
    }

    const parents: string[] = [];
    const getParentCollectionsInner = (collectionName: string) => {
      const collection = this.collectionManager.getCollection(collectionName);
      if (collection) {
        const { inherits } = collection;
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            parents.push(collectionKey);
            getParentCollectionsInner(collectionKey);
          }
        }
      }
      return uniq(parents);
    };

    this.parentCollectionsName = getParentCollectionsInner(this.name);
    return this.parentCollectionsName;
  }

  getParentCollections() {
    if (this.parentCollections) {
      return this.parentCollections.slice();
    }
    this.parentCollections = this.getParentCollectionsName().map((collectionName) => {
      return this.collectionManager.getCollection(collectionName);
    });
    return this.parentCollections;
  }

  getChildrenCollectionsName(isSupportView = false) {
    const cacheKey = isSupportView ? 'supportView' : 'notSupportView';
    if (this.childrenCollectionsName[cacheKey]) {
      return this.childrenCollectionsName[cacheKey].slice();
    }

    const children: string[] = [];
    const collections = this.collectionManager.getCollections();
    const getChildrenCollectionsInner = (collectionName: string) => {
      const inheritCollections = collections.filter((v) => {
        return v.inherits?.includes(collectionName);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        children.push(collectionKey);
        return getChildrenCollectionsInner(collectionKey);
      });
      if (isSupportView) {
        const sourceCollections = collections.filter((v) => {
          return v.sources?.length === 1 && v?.sources[0] === collectionName;
        });
        sourceCollections.forEach((v) => {
          const collectionKey = v.name;
          children.push(v.name);
          return getChildrenCollectionsInner(collectionKey);
        });
      }
      return uniq(children);
    };

    this.childrenCollectionsName[cacheKey] = getChildrenCollectionsInner(this.name);
    return this.childrenCollectionsName[cacheKey];
  }

  getChildrenCollections(isSupportView = false) {
    const cacheKey = isSupportView ? 'supportView' : 'notSupportView';
    if (this.childrenCollections[cacheKey]) {
      return this.childrenCollections[cacheKey].slice();
    }
    this.childrenCollections[cacheKey] = this.getChildrenCollectionsName(isSupportView).map((collectionName) => {
      return this.collectionManager.getCollection(collectionName);
    });
    return this.childrenCollections[cacheKey];
  }

  getInheritedFields() {
    if (this.inheritsFields) {
      return this.inheritsFields.slice();
    }

    const parentCollections = this.getParentCollectionsName();
    this.inheritsFields = parentCollections
      .map((collectionName) => this.collectionManager.getCollection(collectionName)?.getFields())
      .flat()
      .filter(Boolean);

    return this.inheritsFields;
  }

  // override Collection
  protected getFieldsMap() {
    if (this.fieldsMap) {
      return this.fieldsMap;
    }
    this.fieldsMap = this.getAllFields().reduce((memo, field) => {
      memo[field.name] = field;
      return memo;
    }, {});
    return this.fieldsMap;
  }
  getCurrentFields(predicate?: GetCollectionFieldPredicate) {
    return super.getFields(predicate);
  }

  getParentCollectionFields(parentCollectionName: string) {
    if (!this.parentCollectionFields) {
      this.parentCollectionFields = {};
    }
    if (this.parentCollectionFields[parentCollectionName]) {
      return this.parentCollectionFields[parentCollectionName];
    }

    const currentFields = this.getCurrentFields();
    const parentCollections = this.getParentCollectionsName();
    const parentCollection = this.collectionManager.getCollection<InheritanceCollectionMixin>(parentCollectionName);
    const parentFields = parentCollection.getCurrentFields();
    const index = parentCollections.indexOf(parentCollectionName);
    let filterFields = currentFields;
    if (index > 0) {
      parentCollections.splice(index);
      parentCollections.forEach((collectionName) => {
        const collection = this.collectionManager.getCollection<InheritanceCollectionMixin>(collectionName);
        filterFields = filterFields.concat(collection.getCurrentFields());
      });
    }
    this.parentCollectionFields[parentCollectionName] = parentFields.filter((v) => {
      const targetField = filterFields.find((k) => {
        return k.name === v.name;
      });
      return targetField?.collectionName !== this.name;
    });
    return this.parentCollectionFields[parentCollectionName];
  }

  getAllCollectionsInheritChain() {
    if (this.allCollectionsInheritChain) {
      return this.allCollectionsInheritChain.slice();
    }

    const collectionsInheritChain = [this.name];
    const getInheritChain = (name: string) => {
      const collection = this.collectionManager.getCollection<InheritanceCollectionMixin>(name);
      if (collection) {
        const { inherits } = collection;
        const children = collection.getChildrenCollectionsName();
        // 搜寻祖先表
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
        // 搜寻后代表
        if (children) {
          for (let index = 0; index < children.length; index++) {
            const collection = this.collectionManager.getCollection(children[index]);
            const collectionKey = collection.name;
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    this.allCollectionsInheritChain = getInheritChain(this.name);
    return this.allCollectionsInheritChain || [];
  }

  getInheritCollectionsChain() {
    if (this.inheritCollectionsChain) {
      return this.inheritCollectionsChain.slice();
    }
    const collectionsInheritChain = [this.name];
    const getInheritChain = (name: string) => {
      const collection = this.collectionManager.getCollection(name);
      if (collection) {
        const { inherits } = collection;
        if (inherits) {
          for (let index = 0; index < inherits.length; index++) {
            const collectionKey = inherits[index];
            if (collectionsInheritChain.includes(collectionKey)) {
              continue;
            }
            collectionsInheritChain.push(collectionKey);
            getInheritChain(collectionKey);
          }
        }
      }
      return collectionsInheritChain;
    };

    this.inheritCollectionsChain = getInheritChain(this.name);

    return this.inheritCollectionsChain;
  }

  /**
   * 获取所有祖先数据表和后代数据表，不包括兄弟表。用于下面这些地方：
   * - 筛选区块链接数据区块时使用
   */
  getInheritChain() {
    if (this.inheritChain) {
      return this.inheritChain.slice();
    }

    const ancestorChain = this.getInheritCollectionsChain();
    const descendantNames = this.getChildrenCollectionsName();

    // 构建最终的链，首先包含祖先链（包括自身）
    const inheritChain = [...ancestorChain];

    // 再添加直接后代及其后代，但不包括兄弟表
    const addDescendants = (names: string[]) => {
      for (const name of names) {
        if (!inheritChain.includes(name)) {
          inheritChain.push(name);
          const childCollection = this.collectionManager.getCollection<InheritanceCollectionMixin>(name);
          if (childCollection) {
            // 递归添加每个后代的后代
            const childrenNames = childCollection.getChildrenCollectionsName();
            addDescendants(childrenNames);
          }
        }
      }
    };

    // 从当前集合的直接后代开始添加
    addDescendants(descendantNames);

    this.inheritChain = inheritChain;
    return this.inheritChain;
  }

  getAllFields(predicate?: GetCollectionFieldPredicate) {
    if (this.allFields) {
      return this.allFields.slice();
    }
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const allFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name');

    this.allFields = allFields;

    return predicate ? filter(allFields, predicate) : allFields;
  }

  getForeignKeyFields() {
    if (this.foreignKeyFields) {
      return this.foreignKeyFields.slice();
    }
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const allFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name');

    return allFields;
  }
}
