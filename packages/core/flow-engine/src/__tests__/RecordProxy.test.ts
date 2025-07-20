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
import { Collection } from '../data-source';
import { FlowEngine } from '../flowEngine';
import { FlowModel } from '../models/flowModel';

describe('RecordProxy', () => {
  let engine: FlowEngine;
  let model: FlowModel;
  let collection: Collection;
  let mockApiRequest: any;

  beforeEach(() => {
    // Setup FlowEngine and Model
    engine = new FlowEngine();
    model = new FlowModel({
      uid: 'test-model',
      flowEngine: engine,
    });

    // Setup Collection
    collection = new Collection({
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
      const proxy = new RecordProxy(record, collection, model.context);

      expect(proxy.id).toBe(1);
      expect(proxy.title).toBe('Test Post');
    });

    it('should return undefined for non-existent non-association properties', () => {
      const record = { id: 1 };
      const proxy = new RecordProxy(record, collection, model.context);

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

      const proxy = new RecordProxy(record, collection, model.context);
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

      const proxy = new RecordProxy(record, collection, model.context);
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
      expect(comments).toEqual(commentsData);
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

      const proxy = new RecordProxy(record, collection, model.context);
      const tags = await proxy.tags;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/tags:list',
        }),
      );
      expect(tags).toEqual(tagsData);
    });

    it('should lazy load hasOne association', async () => {
      const record = { id: 1 };
      const profileData = { id: 1, bio: 'Test bio' };

      mockApiRequest.mockResolvedValue({
        data: { data: profileData },
      });

      const proxy = new RecordProxy(record, collection, model.context);
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

      const proxy = new RecordProxy(record, collection, model.context);
      const categories = await proxy.categories;

      expect(mockApiRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'posts/1/categories:list',
        }),
      );
      expect(categories).toEqual(categoriesData);
    });
  });

  describe('caching behavior', () => {
    it('should cache loaded associations', async () => {
      const record = { id: 1 };
      const authorData = { id: 10, name: 'John' };

      mockApiRequest.mockResolvedValue({
        data: { data: authorData },
      });

      const proxy = new RecordProxy(record, collection, model.context);

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

      const proxy = new RecordProxy(record, collection, model.context);

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

      const proxy = new RecordProxy(record, collection, model.context);

      await expect(proxy.author).rejects.toThrow('Network error');
    });

    it('should not cache failed requests', async () => {
      const record = { id: 1 };

      mockApiRequest.mockRejectedValueOnce(new Error('First error')).mockResolvedValueOnce({
        data: { data: { id: 10, name: 'John' } },
      });

      const proxy = new RecordProxy(record, collection, model.context);

      // First request fails
      await expect(proxy.author).rejects.toThrow('First error');

      // Second request should succeed
      const author = await proxy.author;
      expect(author).toEqual({ id: 10, name: 'John' });
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

      const record = { id: 1, customId: 99 };
      mockApiRequest.mockResolvedValue({
        data: { data: { id: 10, name: 'John' } },
      });

      const proxy = new RecordProxy(record, customCollection, model.context);
      await proxy.author;

      expect(mockApiRequest).toHaveBeenCalledWith({
        url: 'posts/99/author:get',
        method: 'get',
        params: {},
        headers: {},
      });
    });

    it('should return undefined for non-association field types', () => {
      const record = { id: 1 };
      const proxy = new RecordProxy(record, collection, model.context);

      // Field doesn't exist
      expect(proxy.nonExistentField).toBeUndefined();

      // Field exists but is not an association (title is type: 'string')
      expect(proxy.content).toBeUndefined();
    });
  });
});
