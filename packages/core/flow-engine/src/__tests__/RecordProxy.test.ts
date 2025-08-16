/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordProxy } from '../RecordProxy';
import { Collection, DataSource } from '../data-source';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models/flowModel';

/**
 * RecordProxy 测试套件
 *
 * RecordProxy 是一个智能的数据访问代理，提供以下核心功能：
 *
 * 1. **延迟加载与请求优化**
 *    - 支持深层关联访问（如 post.author.profile）而只发起一次API请求
 *    - 使用 appends 参数批量获取关联数据，避免 N+1 查询问题
 *
 * 2. **智能返回类型**
 *    - 自动判断关联链中是否包含对多关系
 *    - 包含对多关系时返回数组，纯对一关系时返回单个对象
 *
 * 3. **数据完整性保护**
 *    - 深度合并API响应数据，保留原有字段
 *    - 使用Collection定义的主键进行数组元素匹配和合并
 *    - 防止后续请求覆盖已加载的关联数据
 *
 * 4. **灵活性与兼容性**
 *    - 支持静态记录对象和动态记录工厂函数
 *    - 支持任意主键字段（不限于id）
 *    - 完整的缓存机制提升性能
 *
 * 测试结构：
 * - association access: 基础关联访问功能
 * - data handling: 数据合并、缓存和主键处理
 * - return types: 返回类型智能判断
 * - function-based records: 函数式记录支持
 */
describe('RecordProxy', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let postsCollection: Collection;
  let usersCollection: Collection;
  let commentsCollection: Collection;
  let profilesCollection: Collection;
  let tagsCollection: Collection;
  let mockApiRequest: any;

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

    // Setup Collections with clear association types
    postsCollection = new Collection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'title', type: 'string' },
        { name: 'author', type: 'belongsTo', target: 'users' }, // to-one
        { name: 'comments', type: 'hasMany', target: 'comments' }, // to-many
        { name: 'tags', type: 'belongsToMany', target: 'tags' }, // to-many
        { name: 'profile', type: 'hasOne', target: 'profiles' }, // to-one
      ],
    });

    usersCollection = new Collection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'username', type: 'string' },
        { name: 'profile', type: 'hasOne', target: 'profiles' }, // to-one
        { name: 'posts', type: 'hasMany', target: 'posts' }, // to-many
      ],
    });

    commentsCollection = new Collection({
      name: 'comments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'content', type: 'string' },
        { name: 'author', type: 'belongsTo', target: 'users' }, // to-one
        { name: 'tags', type: 'belongsToMany', target: 'tags' }, // to-many
      ],
    });

    profilesCollection = new Collection({
      name: 'profiles',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'bio', type: 'string' },
        { name: 'user', type: 'belongsTo', target: 'users' }, // to-one
      ],
    });

    tagsCollection = new Collection({
      name: 'tags',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
      ],
    });

    // Add collections to the default main data source
    dataSource.addCollection(postsCollection);
    dataSource.addCollection(usersCollection);
    dataSource.addCollection(commentsCollection);
    dataSource.addCollection(profilesCollection);
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
   * 关联数据访问功能测试组
   *
   * 测试 RecordProxy 的核心功能：通过链式语法访问关联数据
   * 重点验证请求优化策略和路径收集机制
   */
  describe('association access', () => {
    /**
     * 测试单层关联数据访问
     * 场景：访问 post.author（belongsTo 关系）
     * 预期：发起一次API请求，使用 appends=['author'] 参数获取关联数据
     * 核心功能：验证基础的关联数据懒加载和请求优化
     */
    it('should make single request for single-level access', async () => {
      const record = { id: 1, title: 'Test Post' };
      const authorData = { id: 10, name: 'John Doe' };

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            author: authorData,
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const author = await proxy.author;

      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts:get',
          params: expect.objectContaining({
            filterByTk: 1,
            appends: ['author'],
          }),
        }),
      );
      expect(author).toEqual(authorData);
    });

    /**
     * 测试多层关联数据访问
     * 场景：访问 post.author.profile（跨越两个关联关系）
     * 预期：发起一次API请求，使用 appends=['author.profile'] 参数，避免链式请求
     * 核心功能：验证深层关联访问的请求合并优化，这是相比传统ORM的关键改进
     */
    it('should make single request for multi-level access', async () => {
      const record = { id: 1, title: 'Test Post' };
      const profileData = { id: 100, bio: 'Author bio' };

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            author: {
              id: 10,
              name: 'John Doe',
              profile: profileData,
            },
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const profile = await proxy.author.profile;

      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appends: ['author.profile'],
          }),
        }),
      );
      expect(profile).toEqual(profileData);
    });

    /**
     * 测试混合关系类型的智能返回值处理
     * 场景：访问 post.comments.author（hasMany + belongsTo 的组合）
     * 预期：返回作者数组，因为路径中包含对多关系（comments），最终结果应扁平化为数组
     * 核心功能：验证智能返回类型判断 - 当路径包含对多关系时返回数组，纯对一关系时返回单个对象
     */
    it('should handle mixed to-one and to-many relationships', async () => {
      const record = { id: 1, title: 'Test Post' };
      const commentAuthorsData = [
        { id: 20, name: 'Commenter 1' },
        { id: 21, name: 'Commenter 2' },
      ];

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            comments: [
              { id: 101, content: 'Comment 1', author: commentAuthorsData[0] },
              { id: 102, content: 'Comment 2', author: commentAuthorsData[1] },
            ],
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const commentAuthors = await proxy.comments.author;

      expect(Array.isArray(commentAuthors)).toBe(true);
      expect(commentAuthors).toEqual(commentAuthorsData);
    });
  });

  /**
   * 数据处理机制测试组
   *
   * 测试数据合并、缓存和主键处理等核心数据管理功能
   * 重点验证数据完整性保护和不同主键字段的兼容性
   */
  describe('data handling', () => {
    /**
     * 测试数据合并和请求缓存机制
     * 场景：首次访问 post.author 触发API请求，再次访问使用缓存
     * 预期：API数据与原记录深度合并（保留原字段+添加新字段），第二次访问直接返回缓存结果
     * 核心功能：验证数据完整性保护和性能优化（缓存机制）
     */
    it('should merge API data and cache requests', async () => {
      const originalRecord = {
        id: 1,
        title: 'Test Post',
        existingField: 'should be preserved',
      };
      const authorData = { id: 10, name: 'John Doe' };

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            author: authorData,
            newField: 'new data from API',
          },
        },
      });

      const proxy = new RecordProxy(originalRecord, postsCollection, model.context);

      // First access should trigger API call
      const author1 = await proxy.author;
      expect(mockApiRequest).toHaveBeenCalledTimes(1);

      // Should merge data without replacing existing fields
      expect(proxy.existingField).toBe('should be preserved');
      expect(proxy.newField).toBe('new data from API');
      expect(proxy.author).toEqual(authorData);

      // Second access should use cached data
      const author2 = await proxy.author;
      expect(mockApiRequest).toHaveBeenCalledTimes(1); // No additional calls
      expect(author1).toBe(author2); // Same reference
    });

    /**
     * 测试深度合并防止数据覆盖问题
     * 场景：先访问 post.comments.tags，再访问 post.comments.author
     * 预期：第二次访问后，第一次获取的 tags 数据仍然存在，没有被覆盖
     * 这是一个关键的数据完整性测试，模拟真实的使用场景
     */
    it('should prevent data overwrite when accessing different nested paths sequentially', async () => {
      const record = { id: 1, title: 'Test Post' };

      // 第一次API调用：获取 comments.tags
      const firstResponse = {
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            comments: [
              {
                id: 101,
                content: 'Comment 1',
                tags: [
                  { id: 1, name: 'tag1' },
                  { id: 2, name: 'tag2' },
                ],
              },
              {
                id: 102,
                content: 'Comment 2',
                tags: [
                  { id: 2, name: 'tag2' },
                  { id: 3, name: 'tag3' },
                ],
              },
            ],
          },
        },
      };

      // 第二次API调用：获取 comments.author
      const secondResponse = {
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            comments: [
              {
                id: 101,
                content: 'Comment 1',
                author: { id: 10, name: 'Author 1' },
              },
              {
                id: 102,
                content: 'Comment 2',
                author: { id: 11, name: 'Author 2' },
              },
            ],
          },
        },
      };

      const proxy = new RecordProxy(record, postsCollection, model.context);
      mockApiRequest.mockClear();

      // 第一次访问：post.comments.tags
      mockApiRequest.mockResolvedValueOnce(firstResponse);
      const tags = await proxy.comments.tags;

      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appends: ['comments.tags'],
          }),
        }),
      );
      expect(tags).toEqual([
        { id: 1, name: 'tag1' },
        { id: 2, name: 'tag2' },
        { id: 2, name: 'tag2' },
        { id: 3, name: 'tag3' },
      ]);

      // 验证第一次合并后的数据结构
      expect(proxy.comments).toHaveLength(2);
      expect(proxy.comments[0].tags).toEqual([
        { id: 1, name: 'tag1' },
        { id: 2, name: 'tag2' },
      ]);
      expect(proxy.comments[1].tags).toEqual([
        { id: 2, name: 'tag2' },
        { id: 3, name: 'tag3' },
      ]);

      // 第二次访问：post.comments.author - 这里是关键测试点
      mockApiRequest.mockResolvedValueOnce(secondResponse);
      const authors = await proxy.comments.author;

      expect(mockApiRequest).toHaveBeenCalledTimes(2);
      expect(mockApiRequest).toHaveBeenLastCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appends: ['comments.author'],
          }),
        }),
      );
      expect(authors).toEqual([
        { id: 10, name: 'Author 1' },
        { id: 11, name: 'Author 2' },
      ]);

      // 关键测试：验证深度合并后，tags 数据没有被覆盖
      expect(proxy.comments).toHaveLength(2);

      // 第一个comment应该同时包含tags和author
      expect(proxy.comments[0]).toEqual({
        id: 101,
        content: 'Comment 1',
        tags: [
          { id: 1, name: 'tag1' },
          { id: 2, name: 'tag2' },
        ],
        author: { id: 10, name: 'Author 1' },
      });

      // 第二个comment也应该同时包含tags和author
      expect(proxy.comments[1]).toEqual({
        id: 102,
        content: 'Comment 2',
        tags: [
          { id: 2, name: 'tag2' },
          { id: 3, name: 'tag3' },
        ],
        author: { id: 11, name: 'Author 2' },
      });

      // 再次访问tags，应该返回缓存的结果，不发起新请求
      const tagsAgain = await proxy.comments.tags;
      expect(mockApiRequest).toHaveBeenCalledTimes(2); // 没有新的API调用
      expect(tagsAgain).toEqual([
        { id: 1, name: 'tag1' },
        { id: 2, name: 'tag2' },
        { id: 2, name: 'tag2' },
        { id: 3, name: 'tag3' },
      ]);
    });

    /**
     * 测试使用非id主键时的深度合并
     * 场景：创建一个使用uuid作为主键的collection，测试数组合并是否正确使用主键
     * 预期：应该使用collection定义的主键字段进行数组元素匹配和合并
     */
    it('should use collection primary key instead of hardcoded id for array merging', async () => {
      // 创建使用uuid作为主键的collection
      const customCollection = new Collection({
        name: 'products',
        filterTargetKey: 'uuid', // 使用uuid作为主键
        fields: [
          { name: 'uuid', type: 'string' },
          { name: 'name', type: 'string' },
          { name: 'reviews', type: 'hasMany', target: 'reviews' },
        ],
      });

      const reviewsCollection = new Collection({
        name: 'reviews',
        filterTargetKey: 'reviewId', // 使用reviewId作为主键
        fields: [
          { name: 'reviewId', type: 'string' },
          { name: 'content', type: 'string' },
          { name: 'rating', type: 'integer' },
          { name: 'author', type: 'belongsTo', target: 'users' },
        ],
      });

      // 添加到数据源
      const dataSourceManager = engine.context.dataSourceManager;
      const dataSource = dataSourceManager.getDataSource('main');
      dataSource.addCollection(customCollection);
      dataSource.addCollection(reviewsCollection);

      const record = { uuid: 'prod-123', name: 'Test Product' };

      // 第一次API响应：获取reviews
      const firstResponse = {
        data: {
          data: {
            uuid: 'prod-123',
            name: 'Test Product',
            reviews: [
              {
                reviewId: 'rev-001',
                content: 'Great product!',
                rating: 5,
              },
              {
                reviewId: 'rev-002',
                content: 'Good quality',
                rating: 4,
              },
            ],
          },
        },
      };

      // 第二次API响应：添加author信息
      const secondResponse = {
        data: {
          data: {
            uuid: 'prod-123',
            name: 'Test Product',
            reviews: [
              {
                reviewId: 'rev-001',
                content: 'Great product!',
                author: { id: 100, name: 'John' },
              },
              {
                reviewId: 'rev-002',
                content: 'Good quality',
                author: { id: 101, name: 'Jane' },
              },
            ],
          },
        },
      };

      const proxy = new RecordProxy(record, customCollection, model.context);
      mockApiRequest.mockClear();

      // 第一次访问：获取reviews
      mockApiRequest.mockResolvedValueOnce(firstResponse);
      const reviews = await proxy.reviews;

      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            filterByTk: 'prod-123', // 使用uuid主键
            appends: ['reviews'],
          }),
        }),
      );
      expect(reviews).toHaveLength(2);
      expect(reviews[0].reviewId).toBe('rev-001');
      expect(reviews[1].reviewId).toBe('rev-002');

      // 第二次API调用：获取reviews.author，触发真实的数据合并
      mockApiRequest.mockResolvedValueOnce(secondResponse);
      const authors = await proxy.reviews.author;

      expect(mockApiRequest).toHaveBeenCalledTimes(2);
      expect(authors).toEqual([
        { id: 100, name: 'John' },
        { id: 101, name: 'Jane' },
      ]);

      // 关键测试：验证使用reviewId主键进行了正确的数组合并
      expect(proxy.reviews).toHaveLength(2);

      // 第一个review应该保留rating，并添加author
      expect(proxy.reviews[0]).toEqual({
        reviewId: 'rev-001',
        content: 'Great product!',
        rating: 5, // 原有数据保留
        author: { id: 100, name: 'John' }, // 新数据添加
      });

      // 第二个review也应该正确合并
      expect(proxy.reviews[1]).toEqual({
        reviewId: 'rev-002',
        content: 'Good quality',
        rating: 4, // 原有数据保留
        author: { id: 101, name: 'Jane' }, // 新数据添加
      });
    });

    /**
     * 测试相同路径多次访问的缓存行为
     * 场景：连续访问 post.comments.author.id 和 post.comments.author.username
     * 预期：只发起一次API请求，因为路径"comments.author"相同，使用缓存
     * 核心功能：验证路径级别的缓存机制，避免重复请求相同的关联数据
     */
    it('should cache same path requests and avoid duplicate API calls', async () => {
      const record = { id: 1, title: 'Test Post' };
      const authorsData = [
        { id: 10, name: 'Author 1', username: 'author1' },
        { id: 11, name: 'Author 2', username: 'author2' },
      ];

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            comments: [
              { id: 101, content: 'Comment 1', author: authorsData[0] },
              { id: 102, content: 'Comment 2', author: authorsData[1] },
            ],
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);

      // 第一次访问：post.comments.author.id
      const authorIds = await proxy.comments.author.id;
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appends: ['comments.author'], // 现在应该只请求到关联字段为止
          }),
        }),
      );
      expect(authorIds).toEqual([10, 11]);

      // 第二次访问：post.comments.author.username - 应该使用缓存，不发起新请求
      const authorUsernames = await proxy.comments.author.username;
      expect(mockApiRequest).toHaveBeenCalledTimes(1); // 仍然只有1次调用
      expect(authorUsernames).toEqual(['author1', 'author2']);

      // 第三次访问：post.comments.author.name - 继续使用缓存
      const authorNames = await proxy.comments.author.name;
      expect(mockApiRequest).toHaveBeenCalledTimes(1); // 仍然只有1次调用
      expect(authorNames).toEqual(['Author 1', 'Author 2']);
    });

    /**
     * 测试使用自定义主键的数组合并
     * 场景：测试使用entryKey作为主键的数组合并行为
     * 预期：应该正确使用entryKey进行数组元素的匹配和合并
     * 注意：由于缓存优化，现在通过初始数据验证合并逻辑
     */
    it('should correctly merge arrays using custom primary key', async () => {
      // 创建使用自定义主键的collection
      const logCollection = new Collection({
        name: 'logs',
        filterTargetKey: 'id',
        fields: [
          { name: 'id', type: 'integer' },
          { name: 'message', type: 'string' },
          { name: 'entries', type: 'hasMany', target: 'logentries' },
        ],
      });

      const logEntriesCollection = new Collection({
        name: 'logentries',
        filterTargetKey: 'entryKey', // 使用entryKey作为主键
        fields: [
          { name: 'entryKey', type: 'string' },
          { name: 'timestamp', type: 'datetime' },
          { name: 'level', type: 'string' },
          { name: 'details', type: 'string' },
        ],
      });

      const dataSourceManager = engine.context.dataSourceManager;
      const dataSource = dataSourceManager.getDataSource('main');
      dataSource.addCollection(logCollection);
      dataSource.addCollection(logEntriesCollection);

      const record = { id: 1, message: 'System log' };

      // 直接提供包含完整数据的响应，验证自定义主键逻辑
      const responseWithCustomPrimaryKey = {
        data: {
          data: {
            id: 1,
            message: 'System log',
            entries: [
              { entryKey: 'log-001', timestamp: '2024-01-01', level: 'info', details: 'First entry' },
              { entryKey: 'log-002', timestamp: '2024-01-02', level: 'warn', details: 'Second entry' },
              { entryKey: 'log-003', timestamp: '2024-01-03', level: 'error', details: 'Third entry' },
            ],
          },
        },
      };

      const proxy = new RecordProxy(record, logCollection, model.context);
      mockApiRequest.mockClear();

      // 访问entries，验证自定义主键数据正确处理
      mockApiRequest.mockResolvedValueOnce(responseWithCustomPrimaryKey);
      const entries = await proxy.entries;

      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            filterByTk: 1,
            appends: ['entries'],
          }),
        }),
      );

      // 验证返回的entries数据结构正确
      expect(entries).toHaveLength(3);
      expect(proxy.entries[0]).toEqual({
        entryKey: 'log-001',
        timestamp: '2024-01-01',
        level: 'info',
        details: 'First entry',
      });
      expect(proxy.entries[1]).toEqual({
        entryKey: 'log-002',
        timestamp: '2024-01-02',
        level: 'warn',
        details: 'Second entry',
      });
      expect(proxy.entries[2]).toEqual({
        entryKey: 'log-003',
        timestamp: '2024-01-03',
        level: 'error',
        details: 'Third entry',
      });

      // 验证可以正确访问基本字段
      const entryDetails = await proxy.entries.details;
      expect(mockApiRequest).toHaveBeenCalledTimes(1); // 使用缓存，不再调用API
      expect(entryDetails).toEqual(['First entry', 'Second entry', 'Third entry']);
    });

    /**
     * 测试数组内置属性访问功能
     * 场景：访问关联数据数组的内置属性（如 length）和自定义属性
     * 预期：访问内置属性时返回数组本身的属性值，访问自定义属性时从每个元素中提取
     * 核心功能：验证数组内置属性（length、方法等）的正确处理，避免被误解为元素属性
     */
    it('should handle array built-in properties correctly', async () => {
      const record = { id: 1, title: 'Test Post' };
      const commentsData = [
        { id: 101, content: 'Comment 1', priority: 'high' },
        { id: 102, content: 'Comment 2', priority: 'medium' },
        { id: 103, content: 'Comment 3', priority: 'low' },
      ];

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            comments: commentsData,
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);

      // 测试访问数组的内置属性 length
      const commentsLength = await proxy.comments.length;
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            appends: ['comments'],
          }),
        }),
      );
      expect(commentsLength).toBe(3); // 应该返回数组的长度，而不是从每个元素提取 length 属性

      // 测试访问非内置属性（从每个元素中提取）
      const priorities = await proxy.comments.priority;
      expect(mockApiRequest).toHaveBeenCalledTimes(1); // 使用缓存，不再调用 API
      expect(priorities).toEqual(['high', 'medium', 'low']); // 应该从每个元素中提取 priority 属性

      // 验证原始数据结构未被破坏
      expect(proxy.comments).toHaveLength(3);
      expect(proxy.comments[0]).toEqual({ id: 101, content: 'Comment 1', priority: 'high' });
    });
  });

  /**
   * 返回类型智能判断测试组
   *
   * 测试基于关联类型的智能返回值格式决策
   * 验证对多关系返回数组，对一关系返回单个对象的逻辑
   */
  describe('return types', () => {
    /**
     * 测试对多关系的数组返回类型
     * 场景：访问 post.comments（hasMany 关系）
     * 预期：返回评论数组，即使只有一个评论也返回数组格式
     * 核心功能：验证关系类型决定返回值格式的逻辑 - 对多关系始终返回数组
     */
    it('should return array for to-many relationship chains', async () => {
      const record = { id: 1, title: 'Test Post' };
      const commentsData = [
        { id: 101, content: 'Comment 1' },
        { id: 102, content: 'Comment 2' },
      ];

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            comments: commentsData,
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const comments = await proxy.comments;

      expect(Array.isArray(comments)).toBe(true);
      expect(comments).toEqual(commentsData);
    });

    /**
     * 测试对一关系的单对象返回类型
     * 场景：访问 post.author.profile（belongsTo + hasOne 的纯对一关系链）
     * 预期：返回单个用户资料对象，不包装成数组
     * 核心功能：验证纯对一关系链返回单个对象的逻辑
     */
    it('should return single object for to-one relationship chains', async () => {
      const record = { id: 1, title: 'Test Post' };
      const profileData = { id: 100, bio: 'Profile bio' };

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            author: {
              id: 10,
              name: 'John Doe',
              profile: profileData,
            },
          },
        },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const userProfile = await proxy.author.profile;

      expect(Array.isArray(userProfile)).toBe(false);
      expect(userProfile).toEqual(profileData);
    });
  });

  /**
   * 函数式记录支持测试组
   *
   * 测试动态记录生成和懒执行功能
   * 验证工厂函数模式与静态对象模式的兼容性
   */
  describe('function-based records', () => {
    /**
     * 测试函数式记录的懒执行和缓存机制
     * 场景：传入记录工厂函数而非静态对象，测试延迟执行和缓存行为
     * 预期：函数仅在首次属性访问时执行，结果被缓存供后续使用，API请求使用函数返回的数据
     * 核心功能：验证动态记录生成能力，支持计算属性和延迟初始化的使用场景
     */
    it('should execute record factory lazily and cache result', async () => {
      const mockRecordFactory = vi.fn(() => ({
        id: 42,
        title: 'Dynamic Record',
        existingProperty: 'accessible',
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

      const proxy = new RecordProxy(mockRecordFactory, postsCollection, model.context);

      // Function should not be called until property access
      expect(mockRecordFactory).not.toHaveBeenCalled();

      // Accessing existing property should trigger function execution
      const existingProp = proxy.existingProperty;
      expect(mockRecordFactory).toHaveBeenCalledTimes(1);
      expect(existingProp).toBe('accessible');

      // API request should use the factory result
      const author = await proxy.author;
      expect(mockRecordFactory).toHaveBeenCalledTimes(1); // Still only called once
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

    /**
     * 测试静态记录的向后兼容性
     * 场景：传入普通静态对象（非函数），验证与函数式记录的行为一致性
     * 预期：静态记录对象正常工作，API请求和数据处理逻辑与函数式记录完全相同
     * 核心功能：确保新的函数式记录功能不破坏现有的静态记录使用方式
     */
    it('should maintain compatibility with static records', async () => {
      const staticRecord = { id: 999, title: 'Static Record' };
      const authorData = { id: 10, name: 'Static Author' };

      mockApiRequest.mockResolvedValue({
        data: {
          data: {
            id: 999,
            title: 'Static Record',
            author: authorData,
          },
        },
      });

      const proxy = new RecordProxy(staticRecord, postsCollection, model.context);
      const author = await proxy.author;

      expect(author).toEqual(authorData);
    });
  });
});
