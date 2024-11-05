/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema } from '@formily/json-schema';
import { describe, expect, it } from 'vitest';
import { getAppends } from '../../hooks/index';

describe('getAppends', () => {
  const mockGetCollectionJoinField = (name: string) => {
    const fields = {
      'users.profile': {
        type: 'hasOne',
        target: 'profiles',
      },
      'users.posts': {
        type: 'hasMany',
        target: 'posts',
      },
      'posts.author': {
        type: 'belongsTo',
        target: 'users',
      },
      'users.roles': {
        type: 'belongsToMany',
        target: 'roles',
      },
      'users.categories': {
        type: 'belongsToArray',
        target: 'categories',
      },
    };
    return fields[name];
  };

  const mockGetCollection = (name: string) => {
    const collections = {
      categories: {
        template: 'tree',
      },
      users: {
        template: 'general',
      },
    };
    return collections[name];
  };

  const createSchema = (properties) => {
    return new Schema({
      properties,
    });
  };

  it('should handle basic association fields', () => {
    const schema = createSchema({
      profile: {
        'x-component': 'Input',
        'x-collection-field': 'users.profile',
        name: 'profile',
      },
    });

    const updateAssociationValues = new Set<string>();
    const appends = new Set<string>();

    getAppends({
      schema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField: mockGetCollectionJoinField,
      getCollection: mockGetCollection,
      dataSource: 'main',
    });

    expect(Array.from(appends)).toEqual(['profile']);
    expect(Array.from(updateAssociationValues)).toEqual([]);
  });

  it('should handle tree collection fields', () => {
    const schema = createSchema({
      categories: {
        'x-component': 'Input',
        'x-collection-field': 'users.categories',
        name: 'categories',
      },
    });

    const updateAssociationValues = new Set<string>();
    const appends = new Set<string>();

    getAppends({
      schema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField: mockGetCollectionJoinField,
      getCollection: mockGetCollection,
      dataSource: 'main',
    });

    expect(Array.from(appends)).toEqual(['categories', 'categories.parent(recursively=true)']);
  });

  it('should handle nested fields with sorting', () => {
    const schema = createSchema({
      posts: {
        'x-component': 'Input',
        'x-collection-field': 'users.posts',
        'x-component-props': {
          sortArr: 'createdAt',
        },
        name: 'posts',
      },
    });

    const updateAssociationValues = new Set<string>();
    const appends = new Set<string>();

    getAppends({
      schema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField: mockGetCollectionJoinField,
      getCollection: mockGetCollection,
      dataSource: 'main',
    });

    expect(Array.from(appends)).toEqual(['posts(sort=createdAt)']);
  });

  it('should handle nested SubTable mode', () => {
    const schema = createSchema({
      posts: {
        'x-component': 'Input',
        'x-collection-field': 'users.posts',
        'x-component-props': {
          mode: 'SubTable',
        },
        name: 'posts',
        properties: {
          author: {
            'x-component': 'Input',
            'x-collection-field': 'posts.author',
            name: 'author',
          },
        },
      },
    });

    const updateAssociationValues = new Set<string>();
    const appends = new Set<string>();

    getAppends({
      schema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField: mockGetCollectionJoinField,
      getCollection: mockGetCollection,
      dataSource: 'main',
    });

    expect(Array.from(appends)).toEqual(['posts', 'posts.author']);
    expect(Array.from(updateAssociationValues)).toEqual(['posts']);
  });

  it('should ignore TableField components', () => {
    const schema = createSchema({
      posts: {
        'x-component': 'TableField',
        'x-collection-field': 'users.posts',
        name: 'posts',
      },
    });

    const updateAssociationValues = new Set<string>();
    const appends = new Set<string>();

    getAppends({
      schema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField: mockGetCollectionJoinField,
      getCollection: mockGetCollection,
      dataSource: 'main',
    });

    expect(Array.from(appends)).toEqual([]);
    expect(Array.from(updateAssociationValues)).toEqual([]);
  });

  it('should ignore Kanban.CardViewer components', () => {
    const schema = createSchema({
      cardViewer: {
        'x-component': 'Kanban.CardViewer',
        name: 'cardViewer',
        properties: {
          drawer: {
            name: 'drawer',
            type: 'void',
            properties: {
              grid: {
                name: 'grid',
                type: 'void',
                properties: {
                  field1: {
                    'x-component': 'Input',
                    'x-collection-field': 'users.posts',
                    name: 'field1',
                  },
                  field2: {
                    'x-component': 'Input',
                    'x-collection-field': 'posts.author',
                    name: 'field2',
                  },
                },
              },
            },
          },
        },
      },
    });

    const updateAssociationValues = new Set<string>();
    const appends = new Set<string>();

    getAppends({
      schema,
      prefix: '',
      updateAssociationValues,
      appends,
      getCollectionJoinField: mockGetCollectionJoinField,
      getCollection: mockGetCollection,
      dataSource: 'main',
    });

    expect(Array.from(appends)).toEqual([]);
    expect(Array.from(updateAssociationValues)).toEqual([]);
  });
});
