import { Application, CollectionManager, CollectionTemplate, Collection } from '@nocobase/client';
import collections from '../collections.json';
import { app } from '../../../application/demos/demo3';

describe('CollectionManager', () => {
  let collectionManager: CollectionManager;

  beforeEach(() => {
    const app = new Application({});
    collectionManager = app.getCollectionManager();
  });
  describe('constructor', () => {
    it('should initialize with empty collections', () => {
      expect(collectionManager.collectionInstancesMap).toEqual({});
      expect(collectionManager.collectionInstancesArr).toEqual([]);
    });
  });

  describe('addCollections', () => {
    it('should add new collections', () => {
      const collections = [{ name: 'test' }];
      collectionManager.addCollections(collections as any[]);
      expect(collectionManager.collectionInstancesArr.length).toBe(1);
      expect(collectionManager.collectionInstancesMap['test']).instanceOf(Collection);
    });

    it('should merge with existing collections', () => {
      const initialCollections = [{ name: 'initial' }];
      const additionalCollections = [{ name: 'additional' }];
      collectionManager.addCollections(initialCollections as any[]);
      collectionManager.addCollections(additionalCollections as any[]);
      expect(collectionManager.collectionInstancesArr.length).toBe(2);
    });

    it('should not add duplicate collections', () => {
      const collections = [{ name: 'test' }, { name: 'test' }];
      collectionManager.addCollections(collections as any[]);
      expect(collectionManager.collectionInstancesArr.length).toBe(1);
    });

    it('custom Collection class', () => {
      class CustomCollection extends Collection {}

      class CustomTemplate extends CollectionTemplate {
        name = 'custom';
        Collection = CustomCollection;
      }

      const collections = [{ name: 'test', template: 'custom' }];
      collectionManager.dataSourceManager.addCollectionTemplates([CustomTemplate]);
      collectionManager.addCollections(collections as any[]);
      const collection = collectionManager.getCollection('test');
      expect(collection).instanceOf(CustomCollection);
    });

    it('custom Template with transform', () => {
      class CustomTemplate extends CollectionTemplate {
        name = 'custom';
        transform(collection) {
          collection.test = 'transformed';
          return collection;
        }
      }

      const collections = [{ name: 'test', template: 'custom' }];
      collectionManager.dataSourceManager.addCollectionTemplates([CustomTemplate]);
      collectionManager.addCollections(collections as any[]);
      const collection = collectionManager.getCollection<{ test: string }>('test');
      expect(collection.getOption('test')).toBe('transformed');
    });
  });

  describe('setCollections', () => {
    it('should replace existing collections', () => {
      const initialCollections = [{ name: 'initial' }];
      const newCollections = [{ name: 'new' }];
      collectionManager.addCollections(initialCollections as any[]);
      collectionManager.setCollections(newCollections as any[]);
      expect(collectionManager.collectionInstancesArr.length).toBe(1);
      expect(Object.keys(collectionManager.collectionInstancesMap)).toEqual(['new']);
    });
  });

  describe('reAddCollections', () => {
    it('should re-add existing collections', () => {
      const initialCollections = [
        { name: 'a', rawTitle: 'aa' },
        { name: 'b', rawTitle: 'bb' },
      ];

      collectionManager.addCollections(initialCollections as any[]);

      collectionManager.getCollection('a');

      const spy = vitest.spyOn(collectionManager, 'addCollections');
      collectionManager.reAddCollections();
      expect(collectionManager.collectionInstancesArr.length).toBe(2);

      expect(spy).toHaveBeenCalledWith([
        collectionManager.getCollection('a').getOptions(),
        collectionManager.getCollection('b').getOptions(),
      ]);
    });

    it('should re-add specified collections with filter', () => {
      const initialCollections = [
        { name: 'a', rawTitle: 'aa' },
        { name: 'b', rawTitle: 'bb' },
      ];

      collectionManager.addCollections(initialCollections as any[]);

      const spy = vitest.spyOn(collectionManager, 'addCollections');
      collectionManager.reAddCollections([collectionManager.getCollection('a')]);
      expect(collectionManager.collectionInstancesArr.length).toBe(2);

      expect(spy).toHaveBeenCalledWith([collectionManager.getCollection('a').getOptions()]);
    });
  });

  describe('getCollection', () => {
    it('should get a collection by name', () => {
      const collections = [{ name: 'test' }];
      collectionManager.addCollections(collections as any[]);
      const collection = collectionManager.getCollection('test');
      expect(collection).toBeDefined();
    });

    it('should return undefined for non-existing collection', () => {
      const collection = collectionManager.getCollection('nonExisting');
      expect(collection).toBeUndefined();
    });

    it('should handle path with associations', () => {
      collectionManager.addCollections(collections as any[]);
      const collection = collectionManager.getCollection('users.roles');
      expect(collection).toBeDefined();
    });

    it('if collection is object, should return the collection instance', () => {
      const collection = collectionManager.getCollection({ name: 'test' });
      expect(collection).instanceOf(Collection);
      expect(collection.name).toBe('test');
    });
  });

  describe('getCollections', () => {
    it('should return all collections', () => {
      const collections = [{ name: 'test1' }, { name: 'test2' }];
      collectionManager.addCollections(collections as any[]);
      const allCollections = collectionManager.getCollections();
      expect(allCollections.length).toBe(2);
    });

    it('should return filtered collections', () => {
      const collections = [{ name: 'test1' }, { name: 'test2' }];
      collectionManager.addCollections(collections as any[]);
      const filteredCollections = collectionManager.getCollections((c) => c.name === 'test1');
      expect(filteredCollections.length).toBe(1);
      expect(filteredCollections[0].name).toBe('test1');
    });
  });

  describe('getCollectionName', () => {
    it('should return the name of a collection', () => {
      const collections = [{ name: 'test' }];
      collectionManager.addCollections(collections as any[]);
      const name = collectionManager.getCollectionName('test');
      expect(name).toBe('test');
    });
  });

  describe('getCollectionField', () => {
    beforeEach(() => {
      collectionManager.addCollections(collections as any[]);
    });

    it('should return undefined for invalid path', () => {
      const field = collectionManager.getCollectionField('invalid');
      expect(field).toBeUndefined();

      const field2 = collectionManager.getCollectionField(undefined);
      expect(field2).toBeUndefined();
    });

    it('should return a collection field by path', () => {
      const field = collectionManager.getCollectionField('users.nickname');
      expect(field).toBeDefined();
      expect(field.name).toBe('nickname');
    });

    it('if collection not found, should return undefined', () => {
      const field = collectionManager.getCollectionField('invalid.nickname');
      expect(field).toBeUndefined();
    });

    it('if field is object, should return the field', () => {
      const field = collectionManager.getCollectionField({ name: 'nickname' });
      expect(field).toEqual({ name: 'nickname' });
    });
  });

  describe('getCollectionFields', () => {
    beforeEach(() => {
      collectionManager.addCollections(collections as any[]);
    });

    it('should return fields of a specified collection', () => {
      const fields = collectionManager.getCollectionFields('users');
      expect(fields.length).greaterThan(1);
    });

    it('if collection not found, should return an empty array', () => {
      const fields = collectionManager.getCollectionFields('invalid');
      expect(fields).toEqual([]);
    });
  });

  describe('clone', () => {
    it('should create a clone of the collection manager', () => {
      const collections = [{ name: 'test' }];
      collectionManager.addCollections(collections as any[]);
      const clone = collectionManager.clone();
      expect(clone).not.toBe(collectionManager);
      expect(clone.collectionInstancesArr).toEqual(collectionManager.collectionInstancesArr);
      expect(clone.collectionInstancesMap).toEqual(collectionManager.collectionInstancesMap);
      expect(clone.dataSource).toBe(collectionManager.dataSource);
    });
  });
});
