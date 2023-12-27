import { CollectionManagerV2, CollectionV2 } from '../../application';
import _, { unionBy, uniq, uniqBy } from 'lodash';

export class InheritanceCollectionMixin extends CollectionV2 {
  public declare collectionManager: CollectionManagerV2<InheritanceCollectionMixin>;

  get inherits() {
    return this.options.inherits;
  }

  init() {
    this.fields = this.getFields().reduce((memo, field) => {
      memo[field.name] = field;
      return memo;
    }, {});
  }

  getParentCollections() {
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

    return getParentCollectionsInner(this.name);
  }

  getChildrenCollections(isSupportView = false) {
    const children: string[] = [];
    const collections = this.collectionManager.getCollections();
    const getChildrenCollectionsInner = (collectionName: string) => {
      const inheritCollections = collections.filter((v) => {
        return v.inherits?.includes(collectionName);
      });
      inheritCollections.forEach((v) => {
        const collectionKey = v.name;
        children.push(v.name);
        return getChildrenCollectionsInner(collectionKey);
      });
      if (isSupportView) {
        const sourceCollections = collections.filter((v) => {
          return v.sources?.length === 1 && v?.sources[0] === name;
        });
        sourceCollections.forEach((v) => {
          const collectionKey = v.name;
          children.push(v.name);
          return getChildrenCollectionsInner(collectionKey);
        });
      }
      return uniqBy(children, 'key');
    };

    return getChildrenCollectionsInner(this.name);
  }

  getInheritedFields() {
    const parentCollections = this.getParentCollections();
    return parentCollections
      .map((collectionName) => this.collectionManager.getCollection(collectionName)?.getFields())
      .flat()
      .filter(Boolean);
  }

  getCurrentFields() {
    return this.options.fields || [];
  }

  getFields() {
    const currentFields = this.getCurrentFields();
    const inheritedFields = this.getInheritedFields();
    const totalFields = unionBy(currentFields?.concat(inheritedFields) || [], 'name').filter((v: any) => {
      return !v.isForeignKey;
    });
    return totalFields;
  }

  getParentCollectionFields(parentCollectionName: string) {
    const currentFields = this.getCurrentFields();
    const parentCollections = this.getParentCollections();
    const parentCollection = this.collectionManager.getCollection(parentCollectionName);
    const parentFields = parentCollection.getCurrentFields();
    const index = parentCollections.indexOf(parentCollectionName);
    let filterFields = currentFields;
    if (index > 0) {
      parentCollections.splice(index);
      parentCollections.forEach((collectionName) => {
        const collection = this.collectionManager.getCollection(collectionName);
        filterFields = filterFields.concat(collection.getCurrentFields());
      });
    }
    return parentFields.filter((v) => {
      return !filterFields.find((k) => {
        return k.name === v.name;
      });
    });
  }

  getAllCollectionsInheritChain() {
    const collectionsInheritChain = [this.name];
    const getInheritChain = (name: string) => {
      const collection = this.collectionManager.getCollection(name);
      if (collection) {
        const { inherits } = collection;
        const children = collection.getChildrenCollections();
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

    return getInheritChain(this.name);
  }

  getInheritCollectionsChain() {
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

    return getInheritChain(this.name);
  }
}
