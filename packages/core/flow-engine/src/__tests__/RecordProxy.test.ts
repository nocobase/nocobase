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

describe('RecordProxy', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let postsCollection: Collection;
  let usersCollection: Collection;
  let commentsCollection: Collection;
  let profilesCollection: Collection;
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

    // Setup Collections
    postsCollection = new Collection({
      name: 'posts',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'title', type: 'string' },
        { name: 'author', type: 'belongsTo', target: 'users' },
        { name: 'comments', type: 'hasMany', target: 'comments' },
        { name: 'tags', type: 'belongsToMany', target: 'tags' },
        { name: 'profile', type: 'hasOne', target: 'profiles' },
        { name: 'categories', type: 'belongsToArray', target: 'categories' },
      ],
    });

    usersCollection = new Collection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'posts', type: 'hasMany', target: 'posts' },
        { name: 'profile', type: 'hasOne', target: 'profiles' },
      ],
    });

    commentsCollection = new Collection({
      name: 'comments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'content', type: 'string' },
        { name: 'author', type: 'belongsTo', target: 'users' },
      ],
    });

    profilesCollection = new Collection({
      name: 'profiles',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer' },
        { name: 'bio', type: 'string' },
        { name: 'user', type: 'belongsTo', target: 'users' },
      ],
    });

    // Add collections to the default main data source
    dataSource.addCollection(postsCollection);
    dataSource.addCollection(usersCollection);
    dataSource.addCollection(commentsCollection);
    dataSource.addCollection(profilesCollection);

    // Mock APIClient request method
    mockApiRequest = vi.fn();
    model.context.defineProperty('api', {
      get: () => ({
        request: mockApiRequest,
      }),
    });
  });

  describe('basic property access', () => {
    it('should return existing properties directly', () => {
      const record = { id: 1, title: 'Test Post' };
      const proxy = new RecordProxy(record, postsCollection, model.context);

      expect(proxy.id).toBe(1);
      expect(proxy.title).toBe('Test Post');
    });

    it('should return undefined for non-existent non-association properties', () => {
      const record = { id: 1 };
      const proxy = new RecordProxy(record, postsCollection, model.context);

      expect(proxy.nonExistent).toBeUndefined();
    });
  });

  describe('association loading', () => {
    it('should lazy load belongsTo association', async () => {
      const record = { id: 1 };
      const authorData = { id: 10, name: 'John Doe' };

      mockApiRequest.mockResolvedValue({
        data: { data: authorData },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const author = await proxy.author;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/author:get',
          method: 'get',
        }),
      );
      expect(author).toEqual(authorData);
    });

    it('should lazy load hasMany association', async () => {
      const record = { id: 1 };
      const commentsData = [
        { id: 100, content: 'Comment 1' },
        { id: 101, content: 'Comment 2' },
      ];

      mockApiRequest.mockResolvedValue({
        data: { data: commentsData, meta: { count: 2, page: 1, pageSize: 20 } },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const comments = await proxy.comments;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/comments:list',
          params: expect.objectContaining({
            page: 1,
            pageSize: 20,
          }),
        }),
      );
      expect(comments.map((c) => ({ ...c }))).toEqual(commentsData);
    });

    it('should lazy load belongsToMany association', async () => {
      const record = { id: 1 };
      const tagsData = [
        { id: 1, name: 'Tag1' },
        { id: 2, name: 'Tag2' },
      ];

      mockApiRequest.mockResolvedValue({
        data: { data: tagsData, meta: {} },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const tags = await proxy.tags;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/tags:list',
        }),
      );
      expect(tags.map((t) => ({ ...t }))).toEqual(tagsData);
    });

    it('should lazy load hasOne association', async () => {
      const record = { id: 1 };
      const profileData = { id: 1, bio: 'Test bio' };

      mockApiRequest.mockResolvedValue({
        data: { data: profileData },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const profile = await proxy.profile;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/profile:get',
        }),
      );
      expect(profile).toEqual(profileData);
    });

    it('should lazy load belongsToArray association', async () => {
      const record = { id: 1 };
      const categoriesData = [
        { id: 1, name: 'Category1' },
        { id: 2, name: 'Category2' },
      ];

      mockApiRequest.mockResolvedValue({
        data: { data: categoriesData, meta: {} },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);
      const categories = await proxy.categories;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/categories:list',
        }),
      );
      expect(categories.map((c) => ({ ...c }))).toEqual(categoriesData);
    });
  });

  describe('caching behavior', () => {
    it('should cache loaded associations', async () => {
      const record = { id: 1 };
      const authorData = { id: 10, name: 'John' };

      mockApiRequest.mockResolvedValue({
        data: { data: authorData },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);

      const author1 = await proxy.author;
      const author2 = await proxy.author;

      expect(author1).toBe(author2);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests for the same association', async () => {
      const record = { id: 1 };
      const authorData = { id: 10, name: 'John' };

      mockApiRequest.mockResolvedValue({
        data: { data: authorData },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);

      const [author1, author2] = await Promise.all([proxy.author, proxy.author]);

      expect(author1).toBe(author2);
      expect(mockApiRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle errors during loading', async () => {
      const record = { id: 1 };
      const error = new Error('Network error');

      mockApiRequest.mockRejectedValue(error);

      const proxy = new RecordProxy(record, postsCollection, model.context);

      await expect(proxy.author).rejects.toThrow('Network error');
    });

    it('should not cache failed requests', async () => {
      const record = { id: 1 };

      mockApiRequest.mockRejectedValueOnce(new Error('First error')).mockResolvedValueOnce({
        data: { data: { id: 10, name: 'John' } },
      });

      const proxy = new RecordProxy(record, postsCollection, model.context);

      // First request fails
      await expect(proxy.author).rejects.toThrow('First error');

      // Second request should succeed
      const author = await proxy.author;
      expect(author).toEqual({ id: 10, name: 'John' });
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('recursive lazy loading', () => {
    it('should handle multi-level association access (belongsTo -> hasMany)', async () => {
      const postRecord = { id: 1 };
      const authorData = { id: 10, name: 'John' };
      const johnsPostsData = [
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ];

      // Mock the first API call (post -> author)
      mockApiRequest.mockResolvedValueOnce({ data: { data: authorData } });
      // Mock the second API call (author -> posts)
      mockApiRequest.mockResolvedValueOnce({ data: { data: johnsPostsData, meta: {} } });

      const postProxy = new RecordProxy(postRecord, postsCollection, model.context);

      // 1. First level access
      const authorProxy = await postProxy.author;
      expect(authorProxy.name).toBe('John');

      // 2. Second level access
      const johnsPosts = await authorProxy.posts;

      // Verify first call
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/author:get',
        }),
      );

      // Verify second call
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'users/10/posts:list',
        }),
      );

      expect(johnsPosts.map((p) => ({ ...p }))).toEqual(johnsPostsData);
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle multi-level association access (hasMany -> belongsTo)', async () => {
      const postRecord = { id: 1 };
      const commentsData = [{ id: 101, content: 'Great post!' }];
      const commentAuthorData = { id: 20, name: 'Jane' };

      // Mock post -> comments
      mockApiRequest.mockResolvedValueOnce({ data: { data: commentsData, meta: {} } });
      // Mock comment -> author
      mockApiRequest.mockResolvedValueOnce({ data: { data: commentAuthorData } });

      const postProxy = new RecordProxy(postRecord, postsCollection, model.context);

      // 1. First level access
      const commentsProxyArray = await postProxy.comments;
      expect(commentsProxyArray).toHaveLength(1);

      // 2. Second level access
      const firstCommentProxy = commentsProxyArray[0];
      const commentAuthor = await firstCommentProxy.author;

      // Verify first call
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/comments:list',
        }),
      );

      // Verify second call
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'comments/101/author:get',
        }),
      );

      expect(commentAuthor).toEqual(commentAuthorData);
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });

    it('should handle multi-level association access with a single await', async () => {
      const postRecord = { id: 1 };
      const authorData = { id: 10, name: 'John' };
      const profileData = { id: 100, bio: 'A bio' };

      // Mock post -> author
      mockApiRequest.mockResolvedValueOnce({ data: { data: authorData } });
      // Mock author -> profile
      mockApiRequest.mockResolvedValueOnce({ data: { data: profileData } });

      const postProxy = new RecordProxy(postRecord, postsCollection, model.context);

      // Access post.author.profile with a single await
      const profile = await postProxy.author.profile;

      // Verify first call (post -> author)
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/author:get',
        }),
      );

      // Verify second call (author -> profile)
      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'users/10/profile:get',
        }),
      );

      expect(profile).toEqual(profileData);
      expect(mockApiRequest).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should use custom filterTargetKey when specified', async () => {
      const customCollection = new Collection({
        name: 'posts',
        filterTargetKey: 'customId',
        fields: [{ name: 'author', type: 'belongsTo', target: 'users' }],
      });
      const dataSource = engine.context.dataSourceManager.getDataSource('main');
      dataSource.addCollection(customCollection);

      const record = { id: 1, customId: 99 };
      mockApiRequest.mockResolvedValue({
        data: { data: { id: 10, name: 'John' } },
      });

      const proxy = new RecordProxy(record, customCollection, model.context);
      await proxy.author;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/99/author:get',
        }),
      );
    });

    it('should return undefined for non-association field types', () => {
      const record = { id: 1 };
      const proxy = new RecordProxy(record, postsCollection, model.context);

      // Field doesn't exist
      expect(proxy.nonExistentField).toBeUndefined();

      // Field exists but is not an association (title is type: 'string')
      expect(proxy.content).toBeUndefined();
    });
  });
});
