import { Application, CollectionTemplate, CollectionTemplateManager, Collection } from '@nocobase/client';

describe('CollectionTemplateManager', () => {
  let collectionTemplateManager: CollectionTemplateManager;

  beforeEach(() => {
    const app = new Application();
    collectionTemplateManager = app.dataSourceManager.collectionTemplateManager;
  });

  it('adds new templates', () => {
    class A extends CollectionTemplate {
      name = 'a';
    }
    collectionTemplateManager.addCollectionTemplates([A]);

    expect(collectionTemplateManager.getCollectionTemplate('a')).instanceOf(A);
    expect(collectionTemplateManager.getCollectionTemplates()).toHaveLength(1);

    class B extends CollectionTemplate {
      name = 'b';
    }
    collectionTemplateManager.addCollectionTemplates([B]);

    expect(collectionTemplateManager.getCollectionTemplate('b')).instanceOf(B);
    expect(collectionTemplateManager.getCollectionTemplates()).toHaveLength(2);
  });

  it('overrides duplicates', () => {
    class A extends CollectionTemplate {
      name = 'a';
    }
    class B extends CollectionTemplate {
      name = 'a';
    }
    collectionTemplateManager.addCollectionTemplates([A, B]);

    expect(collectionTemplateManager.getCollectionTemplate('a')).instanceOf(B);
    expect(collectionTemplateManager.getCollectionTemplates()).toHaveLength(1);
  });

  it('should re-add collections', () => {
    class CollectionTest extends Collection {}

    class A extends CollectionTemplate {
      name = 'a';
      Collection = CollectionTest;
    }

    const collectionA = {
      name: 'collectionA',
      template: 'a',
    };
    collectionTemplateManager.dataSourceManager.getDataSource().collectionManager.addCollections([collectionA]);
    expect(
      collectionTemplateManager.dataSourceManager.getDataSource().collectionManager.getCollection('collectionA'),
    ).instanceOf(Collection);
    collectionTemplateManager.addCollectionTemplates([A]);
    expect(
      collectionTemplateManager.dataSourceManager.getDataSource().collectionManager.getCollection('collectionA'),
    ).instanceOf(CollectionTest);
  });

  describe('getCollectionTemplates', () => {
    beforeEach(() => {
      class A extends CollectionTemplate {
        name = 'a';
        supportDataSourceType = ['sourceA'];
      }
      class B extends CollectionTemplate {
        name = 'b';
        notSupportDataSourceType = ['sourceA'];
      }
      class C extends CollectionTemplate {
        name = 'c';
      }
      collectionTemplateManager.addCollectionTemplates([A, B, C]);
    });

    it('should return all stored templates when no dataSourceType is provided', () => {
      const templates = collectionTemplateManager.getCollectionTemplates();
      expect(templates.length).toBe(3);
    });

    it('should return supported templates when dataSourceType is provided', () => {
      const templates = collectionTemplateManager.getCollectionTemplates('sourceA');
      expect(templates.length).toBe(2);
      expect(templates[0].name).toBe('a');
      expect(templates[1].name).toBe('c');
    });

    it('should return empty array when an unsupported dataSourceType is provided', () => {
      const templates = collectionTemplateManager.getCollectionTemplates('sourceB');
      expect(templates.length).toBe(2);
      expect(templates[0].name).toBe('b');
      expect(templates[1].name).toBe('c');
    });
  });
});
