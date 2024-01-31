import { CollectionFieldInterface, isTitleField } from '../../collection';
import { Application } from '../../Application';
import collections from './collections.json';

describe('utils', () => {
  describe('isTitleField', () => {
    class Demo1FieldInterface extends CollectionFieldInterface {
      name = 'demo1';
      titleUsable = false;
    }
    class Demo2FieldInterface extends CollectionFieldInterface {
      name = 'demo2';
      titleUsable = true;
    }

    const cm = new Application({
      collectionManager: {
        collections: collections as any,
        fieldInterfaces: [Demo1FieldInterface, Demo2FieldInterface],
      },
    }).collectionManager;

    it('should return false when field is foreign key', () => {
      const field = {
        isForeignKey: true,
      };
      expect(isTitleField(cm, field)).toBeFalsy();
    });

    it('should return false when field interface is not title usable', () => {
      const field = {
        isForeignKey: false,
        interface: 'demo1',
      };
      expect(isTitleField(cm, field)).toBeFalsy();
    });

    it('should return true when field is not foreign key and field interface is title usable', () => {
      const field = {
        isForeignKey: false,
        interface: 'demo2',
      };
      expect(isTitleField(cm, field)).toBeTruthy();
    });
  });
});
