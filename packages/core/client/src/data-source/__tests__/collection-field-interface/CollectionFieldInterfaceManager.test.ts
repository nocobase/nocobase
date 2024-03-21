import { Application, CollectionFieldInterface, CollectionFieldInterfaceManager } from '@nocobase/client';

describe('CollectionFieldInterfaceManager', () => {
  let collectionFieldInterfaceManager: CollectionFieldInterfaceManager;

  beforeEach(() => {
    const app = new Application();
    collectionFieldInterfaceManager = app.dataSourceManager.collectionFieldInterfaceManager;
  });

  describe('addFieldInterfaces', () => {
    it('should add field interfaces correctly', () => {
      class A extends CollectionFieldInterface {
        name = 'a';
      }
      class B extends CollectionFieldInterface {
        name = 'b';
      }
      collectionFieldInterfaceManager.addFieldInterfaces([A, B]);

      const a = collectionFieldInterfaceManager.getFieldInterface('a');
      const b = collectionFieldInterfaceManager.getFieldInterface('b');
      expect(a).instanceOf(A);
      expect(b).instanceOf(B);
    });

    it('should override duplicates', () => {
      class A extends CollectionFieldInterface {
        name = 'a';
      }
      class B extends CollectionFieldInterface {
        name = 'a';
      }
      collectionFieldInterfaceManager.addFieldInterfaces([A, B]);

      const a = collectionFieldInterfaceManager.getFieldInterface('a');
      expect(a).instanceOf(B);
    });
  });

  describe('getFieldInterface', () => {
    beforeEach(() => {
      class A extends CollectionFieldInterface {
        name = 'a';
      }
      collectionFieldInterfaceManager.addFieldInterfaces([A]);
    });

    it('should return the correct interface by name', () => {
      const fieldInterface = collectionFieldInterfaceManager.getFieldInterface('a');
      expect(fieldInterface.name).toBe('a');
    });

    it('should return undefined for a non-existent interface', () => {
      const fieldInterface = collectionFieldInterfaceManager.getFieldInterface('nonExistentInterface');
      expect(fieldInterface).toBeUndefined();
    });
  });

  describe('getFieldInterfaces', () => {
    beforeEach(() => {
      class A extends CollectionFieldInterface {
        name = 'a';
        supportDataSourceType = ['sourceA'];
      }
      class B extends CollectionFieldInterface {
        name = 'b';
        notSupportDataSourceType = ['sourceA'];
      }

      class C extends CollectionFieldInterface {
        name = 'c';
      }

      collectionFieldInterfaceManager.addFieldInterfaces([A, B, C]);
    });

    it('should return all stored interfaces when no dataSourceType is provided', () => {
      const interfaces = collectionFieldInterfaceManager.getFieldInterfaces();
      expect(interfaces.length).toBe(3);
    });

    it('should return supported interface when dataSourceType is provided', () => {
      const interfaces = collectionFieldInterfaceManager.getFieldInterfaces('sourceA');
      expect(interfaces.length).toBe(2);
      expect(interfaces[0].name).toBe('a');
      expect(interfaces[1].name).toBe('c');
    });

    it('should return empty array when an unsupported dataSourceType is provided', () => {
      const interfaces = collectionFieldInterfaceManager.getFieldInterfaces('sourceB');
      expect(interfaces.length).toBe(2);
      expect(interfaces[0].name).toBe('b');
      expect(interfaces[1].name).toBe('c');
    });
  });

  describe('addFieldInterfaceGroups', () => {
    it('should add field interface groups', () => {
      const groups = { group1: { label: 'Group 1', order: 1 } };
      collectionFieldInterfaceManager.addFieldInterfaceGroups(groups);
      expect(collectionFieldInterfaceManager.getFieldInterfaceGroup('group1')).toEqual(groups.group1);
    });
  });

  describe('getFieldInterfaceGroups', () => {
    it('should return all field interface groups', () => {
      expect(collectionFieldInterfaceManager.getFieldInterfaceGroups()).toEqual({});
      const groups = { group1: { label: 'Group 1', order: 1 } };
      collectionFieldInterfaceManager.addFieldInterfaceGroups(groups);
      expect(collectionFieldInterfaceManager.getFieldInterfaceGroups()).toEqual(groups);
    });
  });

  describe('getFieldInterfaceGroup', () => {
    it('should return the correct group by name', () => {
      const groups = { group1: { label: 'Group 1', order: 1 } };
      collectionFieldInterfaceManager.addFieldInterfaceGroups(groups);
      expect(collectionFieldInterfaceManager.getFieldInterfaceGroup('group1')).toEqual(groups.group1);
    });

    it('should return undefined when the group does not exist', () => {
      expect(collectionFieldInterfaceManager.getFieldInterfaceGroup('nonExistentGroup')).toBeUndefined();
    });
  });
});
