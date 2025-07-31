/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRecordProxyContext } from '../createRecordProxyContext';
import { Collection } from '../../data-source';
import { FlowEngine } from '../../flowEngine';
import { FlowModel } from '../../models/flowModel';
import { FlowContext } from '../../flowContext';

/**
 * createRecordProxyContext 测试套件
 *
 * createRecordProxyContext 是用于 FlowContext.defineProperty 的工具函数，
 * 它创建一个包含 get 和 meta 属性的对象，用于在流上下文中定义 Record 代理。
 *
 * 核心功能：
 * 1. **meta 数据生成**: 为流程设计器提供字段类型和结构信息
 * 2. **函数式 Record 支持**: 支持静态 Record 对象和动态 Record 工厂函数
 * 3. **类型映射**: 将 Collection 字段类型映射为元数据类型
 *
 * 测试场景：
 * - metadata generation: 元数据生成和字段映射
 * - function-based records: 函数式 Record 支持
 */
describe('createRecordProxyContext', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let postsCollection: Collection;
  let usersCollection: Collection;
  let mockApiRequest: any;

  const getChildren = async (node: any) => {
    if (typeof node.children === 'function') {
      return await node.children();
    }
    return node.children || [];
  };

  beforeEach(() => {
    // Setup FlowEngine and Model
    engine = new FlowEngine();
    model = new FlowModel({
      uid: 'test-model',
      flowEngine: engine,
    });

    // Access the data source manager from the engine's context
    const dataSourceManager = engine.context.dataSourceManager;
    const dataSource = dataSourceManager.getDataSource('main');

    // Setup Collections for testing
    postsCollection = new Collection({
      name: 'posts',
      title: 'Posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', title: 'ID', interface: 'number' },
        { name: 'title', type: 'string', title: 'Title', interface: 'input' },
        { name: 'content', type: 'text', title: 'Content', interface: 'textarea' },
        { name: 'author', type: 'belongsTo', title: 'Author', target: 'users', interface: 'select' },
        { name: 'tags', type: 'hasMany', title: 'Tags', target: 'tags', interface: 'multiSelect' },
        { name: 'hiddenField', type: 'string', title: 'Hidden Field', options: { hidden: true } },
      ],
    });

    usersCollection = new Collection({
      name: 'users',
      title: 'Users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', title: 'ID' },
        { name: 'name', type: 'string', title: 'Name' },
        { name: 'email', type: 'string', title: 'Email' },
      ],
    });

    const tagsCollection = new Collection({
      name: 'tags',
      title: 'Tags',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', title: 'ID' },
        { name: 'name', type: 'string', title: 'Name' },
      ],
    });

    // Add collections to the data source
    dataSource.addCollection(postsCollection);
    dataSource.addCollection(usersCollection);
    dataSource.addCollection(tagsCollection);

    // Mock APIClient request method
    mockApiRequest = vi.fn();
    model.context.defineProperty('api', {
      get: () => ({
        request: mockApiRequest,
      }),
    });
  });

  /**
   * 元数据生成和字段映射测试组
   *
   * 使用真实的 FlowContext 集成流程测试元数据生成功能
   * 验证 defineProperty + getPropertyMetaTree 的完整集成
   */
  describe('metadata generation via FlowContext integration', () => {
    /**
     * 测试通过 FlowContext 生成的元数据树包含所有字段
     * 场景：变量组件通过 flowContext.getPropertyMetaTree() 获取可用字段列表
     * 预期：包含Collection定义的所有非关联字段，无论 Record 实例中是否包含
     * 核心功能：验证 FlowContext 集成和字段类型映射
     */
    it('should generate complete metadata tree through FlowContext integration', async () => {
      const record = { id: 1, title: 'Test Post' }; // 注意：不包含 content 和 hiddenField
      const flowContext = new FlowContext();

      // 使用真实的集成流程
      const recordContext = createRecordProxyContext(record, postsCollection);
      flowContext.defineProperty('currentRecord', recordContext);

      // 获取元数据树
      const metaTree = flowContext.getPropertyMetaTree();

      // 查找我们定义的记录属性
      const currentRecordNode = metaTree.find((node) => node.name === 'currentRecord');
      expect(currentRecordNode).toBeDefined();
      expect(currentRecordNode.type).toBe('object');
      expect(currentRecordNode.title).toBe('currentRecord'); // 延迟加载使用属性名作为默认 title

      // children 是一个异步函数，需要调用它来获取实际的字段数组
      expect(typeof currentRecordNode.children).toBe('function');
      const fields = await getChildren(currentRecordNode);
      expect(Array.isArray(fields)).toBe(true);

      const fieldNames = fields.map((field) => field.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('content'); // 即使 Record 中不存在
      expect(fieldNames).toContain('hiddenField'); // 即使 Record 中不存在

      // 验证字段类型映射
      const idField = fields.find((field) => field.name === 'id');
      expect(idField).toEqual({
        name: 'id',
        type: 'number',
        title: 'ID',
        interface: 'number',
        uiSchema: {},
        children: undefined,
      });

      const titleField = fields.find((field) => field.name === 'title');
      expect(titleField).toEqual({
        name: 'title',
        type: 'string',
        title: 'Title',
        interface: 'input',
        uiSchema: {},
        children: undefined,
      });

      const contentField = fields.find((field) => field.name === 'content');
      expect(contentField).toEqual({
        name: 'content',
        type: 'string',
        title: 'Content',
        interface: 'textarea',
        uiSchema: {},
        children: undefined,
      });
    });

    /**
     * 测试关联字段在 meta 树中的表示
     * 场景：变量组件显示关联字段，支持深层关联访问如 post.comments.author
     * 预期：所有关联字段统一生成 object 类型，都包含子属性描述目标结构
     * 核心功能：验证关联字段类型统一化和子属性生成（to-one 和 to-many 都支持）
     */
    it('should include association fields in metadata tree with correct types', async () => {
      const record = { id: 1, title: 'Test Post' };
      const flowContext = new FlowContext();

      const recordContext = createRecordProxyContext(record, postsCollection);
      flowContext.defineProperty('currentRecord', recordContext);

      const metaTree = flowContext.getPropertyMetaTree();
      const currentRecordNode = metaTree.find((node) => node.name === 'currentRecord');

      // children 是异步函数，需要调用来获取字段数组
      const fields = await getChildren(currentRecordNode);

      // belongsTo association (to-one)
      const authorField = fields.find((field) => field.name === 'author');
      expect(authorField).toBeDefined();
      expect(authorField.type).toBe('object');
      expect(authorField.title).toBe('Author');
      expect(authorField.interface).toBe('select');
      expect(typeof authorField.children).toBe('function'); // should have async sub-properties function

      // Verify author sub-properties by calling the async function
      const authorChildren = await getChildren(authorField);
      expect(Array.isArray(authorChildren)).toBe(true);
      const authorFieldNames = authorChildren.map((child) => child.name);
      expect(authorFieldNames).toContain('id');
      expect(authorFieldNames).toContain('name');
      expect(authorFieldNames).toContain('email');

      // hasMany association (to-many)
      const tagsField = fields.find((field) => field.name === 'tags');
      expect(tagsField).toBeDefined();
      expect(tagsField.type).toBe('object'); // 所有关系字段统一为 object 类型
      expect(tagsField.title).toBe('Tags');
      expect(tagsField.interface).toBe('multiSelect');
      expect(typeof tagsField.children).toBe('function'); // to-many 也需要子属性描述元素结构

      // Verify tags sub-properties by calling the async function
      const tagsChildren = await getChildren(tagsField);
      expect(Array.isArray(tagsChildren)).toBe(true);
      const tagsFieldNames = tagsChildren.map((child) => child.name);
      expect(tagsFieldNames).toContain('id');
      expect(tagsFieldNames).toContain('name');
    });

    /**
     * 测试集合标题的回退机制在元数据树中的表现
     * 场景：某些集合可能没有设置 title，使用 name 作为回退
     * 预期：当集合没有 title 时，元数据树节点使用 name 作为标题
     * 核心功能：验证标题回退逻辑在完整集成中的正确性
     */
    it('should use collection name as title fallback in metadata tree', () => {
      const record = { id: 1, title: 'Test Post' };
      const collectionWithoutTitle = new Collection({
        name: 'posts',
        // title: undefined, // No title set
        filterTargetKey: 'id',
        fields: [
          { name: 'id', type: 'integer' },
          { name: 'title', type: 'string' },
        ],
      });

      const flowContext = new FlowContext();
      const recordContext = createRecordProxyContext(record, collectionWithoutTitle);
      flowContext.defineProperty('testRecord', recordContext);

      const metaTree = flowContext.getPropertyMetaTree();
      const testRecordNode = metaTree.find((node) => node.name === 'testRecord');

      expect(testRecordNode).toBeDefined();
      expect(testRecordNode.title).toBe('testRecord'); // 延迟加载使用属性名作为默认 title
    });
  });

  /**
   * 函数式 Record 支持测试组
   *
   * 测试动态 Record 生成功能，支持工厂函数模式
   * 验证延迟执行、元数据生成策略和向后兼容性
   */
  describe('function-based records', () => {
    /**
     * 测试函数式 Record 在元数据树中的表现
     * 场景：流程中使用动态计算的 Record，如 () => getCurrentUser()
     * 预期：与静态 Record 一致，包含Collection定义的所有非关联字段
     * 核心功能：验证函数式 Record 与静态 Record 的元数据生成行为一致
     */
    it('should generate same metadata tree for function-based records as static records', async () => {
      const recordFactory = vi.fn(() => ({
        id: 42,
        title: 'Dynamic Record',
      }));

      const flowContext = new FlowContext();
      const recordContext = createRecordProxyContext(recordFactory, postsCollection);
      flowContext.defineProperty('dynamicRecord', recordContext);

      const metaTree = flowContext.getPropertyMetaTree();
      const dynamicRecordNode = metaTree.find((node) => node.name === 'dynamicRecord');

      expect(dynamicRecordNode).toBeDefined();
      expect(dynamicRecordNode.type).toBe('object');
      expect(dynamicRecordNode.title).toBe('dynamicRecord'); // 延迟加载使用属性名作为默认 title

      // children 是异步函数，需要调用来获取字段数组
      expect(typeof dynamicRecordNode.children).toBe('function');
      const fields = await getChildren(dynamicRecordNode);
      expect(Array.isArray(fields)).toBe(true);

      const fieldNames = fields.map((field) => field.name);

      // Should include all non-association fields defined in collection (same as static records)
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('title');
      expect(fieldNames).toContain('content'); // Should include even if not in factory result
      expect(fieldNames).toContain('hiddenField'); // Should include hidden fields too

      // Should still include association fields
      expect(fieldNames).toContain('author');
      expect(fieldNames).toContain('tags');
    });

    /**
     * 测试函数式 Record 的 RecordProxy 创建和延迟执行
     * 场景：流程运行时访问动态 Record 的关联数据
     * 预期：RecordProxy 正确执行工厂函数并使用返回值进行 API 请求
     * 核心功能：验证函数式 Record 与 RecordProxy 的完整集成
     */
    it('should create working RecordProxy for function-based records', async () => {
      const recordFactory = vi.fn(() => ({
        id: 42,
        title: 'Dynamic Record',
      }));
      const authorData = { id: 10, name: 'Dynamic Author' };

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 42,
            title: 'Dynamic Record',
            author: authorData,
          },
        },
      });

      const context = createRecordProxyContext(recordFactory, postsCollection);
      const proxy = context.get(model.context);

      // Function should not be called during proxy creation
      expect(recordFactory).not.toHaveBeenCalled();

      // API request should use the factory result
      const author = await proxy.author;
      expect(recordFactory).toHaveBeenCalled();
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            filterByTk: 42,
            appends: ['author'],
          }),
        }),
      );
      expect(author).toEqual(authorData);
    });
  });
});
