import { Application } from '@nocobase/client';
import { CollectionManager } from '../../../data-source/collection/CollectionManager';
import { InheritanceCollectionMixin } from '../InheritanceCollectionMixin';

describe('InheritanceCollectionMixin', () => {
  let app: Application;
  let collectionManager: CollectionManager;

  beforeEach(() => {
    app = new Application({
      dataSourceManager: {
        collectionMixins: [InheritanceCollectionMixin],
      },
    });
    collectionManager = app.getCollectionManager();
  });

  describe('getInheritChain', () => {
    it('should return itself when there are no ancestors or descendants', () => {
      const options = {
        name: 'test',
        fields: [{ name: 'field1', interface: 'input' }],
      };

      collectionManager.addCollections([options]);
      const collection = collectionManager.getCollection<InheritanceCollectionMixin>('test');

      const inheritChain = collection.getInheritChain();
      expect(inheritChain).toEqual(['test']);
    });

    it('should return a chain including all ancestor tables', () => {
      // 创建三代数据表结构：grandparent -> parent -> child
      const grandparentOptions = {
        name: 'grandparent',
        fields: [{ name: 'field1', interface: 'input' }],
      };
      const parentOptions = {
        name: 'parent',
        inherits: ['grandparent'],
        fields: [{ name: 'field2', interface: 'input' }],
      };
      const childOptions = {
        name: 'child',
        inherits: ['parent'],
        fields: [{ name: 'field3', interface: 'input' }],
      };

      // 先将所有集合添加到 collectionManager
      collectionManager.addCollections([grandparentOptions, parentOptions, childOptions]);

      // 获取最终的集合实例以调用方法
      const child = collectionManager.getCollection<InheritanceCollectionMixin>('child');

      // 测试 child 的继承链包含所有祖先表
      const inheritChain = child.getInheritChain();
      expect(inheritChain).toContain('child');
      expect(inheritChain).toContain('parent');
      expect(inheritChain).toContain('grandparent');
      expect(inheritChain.length).toBe(3);
    });

    it('should include all descendant tables, but not sibling tables', () => {
      // 创建具有兄弟和后代关系的数据表结构
      // parent (祖先表)
      //  |-- child1 (子表)
      //  |     |-- grandChild1 (孙表1)
      //  |     |-- grandChild2 (孙表2)
      //  |-- child2 (兄弟表)
      //        |-- grandChild3 (兄弟的子表，不应该包括在测试集合的继承链中)

      const collections = [
        {
          name: 'parent',
          fields: [{ name: 'parentField', interface: 'input' }],
        },
        {
          name: 'child1',
          inherits: ['parent'],
          fields: [{ name: 'child1Field', interface: 'input' }],
        },
        {
          name: 'child2',
          inherits: ['parent'],
          fields: [{ name: 'child2Field', interface: 'input' }],
        },
        {
          name: 'grandChild1',
          inherits: ['child1'],
          fields: [{ name: 'grandChild1Field', interface: 'input' }],
        },
        {
          name: 'grandChild2',
          inherits: ['child1'],
          fields: [{ name: 'grandChild2Field', interface: 'input' }],
        },
        {
          name: 'grandChild3',
          inherits: ['child2'],
          fields: [{ name: 'grandChild3Field', interface: 'input' }],
        },
      ];

      // 一次性添加所有集合
      collectionManager.addCollections(collections);

      // 获取要测试的集合实例
      const child1 = collectionManager.getCollection<InheritanceCollectionMixin>('child1');

      // 测试 child1 的继承链
      const child1InheritChain = child1.getInheritChain();

      // 应该包含自身、父表和子表
      expect(child1InheritChain).toContain('child1');
      expect(child1InheritChain).toContain('parent');
      expect(child1InheritChain).toContain('grandChild1');
      expect(child1InheritChain).toContain('grandChild2');

      // 不应该包含兄弟表及其子表
      expect(child1InheritChain).not.toContain('child2');
      expect(child1InheritChain).not.toContain('grandChild3');

      // 检查总数量是否正确 (parent, child1, grandChild1, grandChild2)
      expect(child1InheritChain.length).toBe(4);
    });

    it('should properly handle multiple inheritance', () => {
      // 创建多重继承的数据表结构
      // parent1   parent2
      //   \        /
      //    \      /
      //     child
      //      |
      //  grandChild

      const collections = [
        {
          name: 'parent1',
          fields: [{ name: 'parent1Field', interface: 'input' }],
        },
        {
          name: 'parent2',
          fields: [{ name: 'parent2Field', interface: 'input' }],
        },
        {
          name: 'child',
          inherits: ['parent1', 'parent2'],
          fields: [{ name: 'childField', interface: 'input' }],
        },
        {
          name: 'grandChild',
          inherits: ['child'],
          fields: [{ name: 'grandChildField', interface: 'input' }],
        },
      ];

      // 一次性添加所有集合
      collectionManager.addCollections(collections);

      // 获取要测试的集合实例
      const child = collectionManager.getCollection<InheritanceCollectionMixin>('child');
      const grandChild = collectionManager.getCollection<InheritanceCollectionMixin>('grandChild');

      // 测试 child 的继承链
      const childInheritChain = child.getInheritChain();

      // 应该包含自身、两个父表和子表
      expect(childInheritChain).toContain('child');
      expect(childInheritChain).toContain('parent1');
      expect(childInheritChain).toContain('parent2');
      expect(childInheritChain).toContain('grandChild');

      // 检查总数量是否正确 (child, parent1, parent2, grandChild)
      expect(childInheritChain.length).toBe(4);

      // 测试 grandChild 的继承链
      const grandChildInheritChain = grandChild.getInheritChain();

      // 应该包含自身及所有祖先表
      expect(grandChildInheritChain).toContain('grandChild');
      expect(grandChildInheritChain).toContain('child');
      expect(grandChildInheritChain).toContain('parent1');
      expect(grandChildInheritChain).toContain('parent2');

      // 检查总数量是否正确 (grandChild, child, parent1, parent2)
      expect(grandChildInheritChain.length).toBe(4);
    });
  });
});
