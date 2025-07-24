/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRecordProxyContext } from '../createRecordProxyContext';
import { RecordProxy } from '../../RecordProxy';

// Mock dependencies
vi.mock('../../RecordProxy');

describe('recordProxy utils', () => {
  let mockRecord: any;
  let mockCollection: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRecord = {
      id: 1,
      title: 'Test Record',
      content: 'Test content',
      authorId: 2,
    };

    mockCollection = {
      name: 'posts',
      title: 'Posts',
      fields: new Map([
        [
          'id',
          {
            name: 'id',
            type: 'integer',
            title: 'ID',
            interface: 'number',
            isAssociationField: () => false,
          },
        ],
        [
          'title',
          {
            name: 'title',
            type: 'string',
            title: 'Title',
            interface: 'input',
            isAssociationField: () => false,
          },
        ],
        [
          'content',
          {
            name: 'content',
            type: 'text',
            title: 'Content',
            interface: 'textarea',
            isAssociationField: () => false,
          },
        ],
        [
          'author',
          {
            name: 'author',
            type: 'belongsTo',
            title: 'Author',
            interface: 'select',
            isAssociationField: () => true,
            targetCollection: {
              name: 'users',
              title: 'Users',
              fields: new Map([
                [
                  'id',
                  {
                    name: 'id',
                    type: 'integer',
                    title: 'ID',
                  },
                ],
                [
                  'name',
                  {
                    name: 'name',
                    type: 'string',
                    title: 'Name',
                  },
                ],
                [
                  'email',
                  {
                    name: 'email',
                    type: 'string',
                    title: 'Email',
                  },
                ],
              ]),
            },
          },
        ],
        [
          'tags',
          {
            name: 'tags',
            type: 'hasMany',
            title: 'Tags',
            interface: 'multiSelect',
            isAssociationField: () => true,
            targetCollection: {
              name: 'tags',
              title: 'Tags',
              fields: new Map([
                [
                  'id',
                  {
                    name: 'id',
                    type: 'integer',
                    title: 'ID',
                  },
                ],
                [
                  'name',
                  {
                    name: 'name',
                    type: 'string',
                    title: 'Name',
                  },
                ],
              ]),
            },
          },
        ],
        [
          'hiddenField',
          {
            name: 'hiddenField',
            type: 'string',
            title: 'Hidden Field',
            options: { hidden: true },
            isAssociationField: () => false,
          },
        ],
      ]),
      getField: function (name: string) {
        return this.fields.get(name);
      },
    };

    mockContext = {
      api: {},
    };
  });

  describe('createRecordProxyContext', () => {
    it('should return an object with get and meta properties', () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);

      expect(result).toHaveProperty('get');
      expect(result).toHaveProperty('meta');
      expect(typeof result.get).toBe('function');
      expect(typeof result.meta).toBe('object');
    });

    it('should create RecordProxy instance when get function is called', () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);
      const flowCtx = { api: {} };

      result.get(flowCtx as any);

      expect(RecordProxy).toHaveBeenCalledWith(mockRecord, mockCollection, flowCtx);
    });

    it('should generate correct meta structure', () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);

      expect(result.meta.type).toBe('object');
      expect(result.meta.title).toBe('Posts');
      expect(typeof result.meta.properties).toBe('function');
    });

    it('should generate properties for existing record fields', async () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      expect(properties).toHaveProperty('id');
      expect(properties).toHaveProperty('title');
      expect(properties).toHaveProperty('content');

      expect(properties.id).toEqual({
        type: 'number',
        title: 'ID',
        interface: 'number',
        uiSchema: undefined,
        hide: undefined,
      });

      expect(properties.title).toEqual({
        type: 'string',
        title: 'Title',
        interface: 'input',
        uiSchema: undefined,
        hide: undefined,
      });
    });

    it('should not include fields not present in record', async () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      expect(properties).not.toHaveProperty('nonExistentField');
    });

    it('should include association fields with correct type', async () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      // belongsTo association
      expect(properties).toHaveProperty('author');
      expect(properties.author.type).toBe('object');
      expect(properties.author.title).toBe('Author');
      expect(typeof properties.author.properties).toBe('function');

      // hasMany association
      expect(properties).toHaveProperty('tags');
      expect(properties.tags.type).toBe('array');
      expect(properties.tags.title).toBe('Tags');
      expect(properties.tags.properties).toBeUndefined(); // arrays don't have sub-properties
    });

    it('should generate sub-properties for belongsTo associations', async () => {
      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      const authorProperties = await properties.author.properties();

      expect(authorProperties).toHaveProperty('id');
      expect(authorProperties).toHaveProperty('name');
      expect(authorProperties).toHaveProperty('email');

      expect(authorProperties.name).toEqual({
        type: 'string',
        title: 'Name',
        interface: undefined,
        uiSchema: undefined,
        hide: undefined,
      });
    });

    it('should handle hidden fields correctly', async () => {
      mockRecord.hiddenField = 'hidden value';
      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      expect(properties).toHaveProperty('hiddenField');
      expect(properties.hiddenField.hide).toBe(true);
    });

    it('should use collection name as title fallback', () => {
      const collectionWithoutTitle = { ...mockCollection, title: undefined };
      const result = createRecordProxyContext(mockRecord, collectionWithoutTitle);

      expect(result.meta.title).toBe('posts');
    });

    it('should handle field without title', async () => {
      const fieldWithoutTitle = { ...mockCollection.fields.get('title'), title: undefined };
      mockCollection.fields.set('title', fieldWithoutTitle);

      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      expect(properties.title.title).toBe('title');
    });

    it('should handle associations without target collection', async () => {
      const associationWithoutTarget = {
        ...mockCollection.fields.get('author'),
        targetCollection: undefined,
      };
      mockCollection.fields.set('author', associationWithoutTarget);

      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      expect(properties).not.toHaveProperty('author');
    });

    it('should handle non-association fields that have isAssociationField method', async () => {
      const nonAssociationField = {
        ...mockCollection.fields.get('title'),
        isAssociationField: () => false,
      };
      mockCollection.fields.set('title', nonAssociationField);

      const result = createRecordProxyContext(mockRecord, mockCollection);
      const properties = await result.meta.properties();

      expect(properties.title.type).toBe('string');
      expect(properties.title).not.toHaveProperty('properties');
    });
  });
});
