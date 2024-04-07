import type { CollectionFieldOptions, GetCollectionFieldPredicate } from '../../data-source';
import { Collection } from '../../data-source/collection/Collection';
import _, { filter, unionBy, uniq } from 'lodash';

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
      return !filterFields.find((k) => {
        return k.name === v.name;
      });
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

  getAllFields(predicate?: GetCollectionFieldPredicate) {
    if (this.allFields) {
      return this.allFields.slice();
    }
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const allFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name').filter((v: any) => {
      return !v.isForeignKey;
    });

    this.allFields = allFields;

    return predicate ? filter(allFields, predicate) : allFields;
  }

  getForeignKeyFields() {
    if (this.foreignKeyFields) {
      return this.foreignKeyFields.slice();
    }
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const allFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name').filter((v: any) => {
      return v.isForeignKey;
    });

    return allFields;
  }
}
