/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCollectionState, getSyncFromForm } from '../utils';

type FieldOptions = {
  name: string;
  type?: string;
  target?: string;
  interface?: string;
  title?: string;
  association?: boolean;
};

const createField = (options: FieldOptions) => ({
  name: options.name,
  type: options.type || 'string',
  target: options.target,
  interface: options.interface,
  uiSchema: {
    title: options.title || options.name,
  },
  isAssociationField: () => options.association ?? !!options.target,
});

const createCollection = (fields: FieldOptions[]) => ({
  fields: new Map(fields.map((field) => [field.name, createField(field)])),
});

const createDataSourceManager = () => {
  const collections = new Map<string, ReturnType<typeof createCollection>>([
    [
      'posts',
      createCollection([
        { name: 'id', interface: 'input' },
        { name: 'title', interface: 'input', title: 'Title' },
        { name: 'sort', type: 'sort', interface: 'input' },
        { name: 'password', type: 'password', interface: 'password' },
        { name: 'hidden' },
        { name: 'author', type: 'belongsTo', target: 'users', interface: 'm2o', title: 'Author' },
        { name: 'comments', type: 'hasMany', target: 'comments', interface: 'o2m', title: 'Comments' },
      ]),
    ],
    [
      'users',
      createCollection([
        { name: 'id', interface: 'input' },
        { name: 'createdAt', type: 'belongsTo', target: 'profiles', interface: 'm2o' },
        { name: 'name', interface: 'input', title: 'Name', association: false },
        { name: 'profile', type: 'belongsTo', target: 'profiles', interface: 'm2o', title: 'Profile' },
      ]),
    ],
    ['profiles', createCollection([{ name: 'avatar', interface: 'input', title: 'Avatar', association: false }])],
    [
      'comments',
      createCollection([
        { name: 'id', interface: 'input' },
        { name: 'body', interface: 'input', title: 'Body', association: false },
        { name: 'sort', type: 'sort', interface: 'input', title: 'Sort', association: false },
      ]),
    ],
  ]);

  return {
    getCollection: vi.fn((_dataSourceKey: string, collectionName: string) => collections.get(collectionName)),
  };
};

describe('duplicate utils', () => {
  const t = (value?: string) => (value ? `t:${value}` : '');

  afterEach(() => {
    cleanup();
  });

  it('builds enabled field trees and loads nested children', async () => {
    const dm = createDataSourceManager();
    const { getEnableFieldTree, getOnLoadData, getOnCheck } = getCollectionState(dm, t, 'main');
    const tree = getEnableFieldTree('posts');

    expect(tree.map((node) => node.key)).toEqual(['title', 'author', 'comments']);
    expect(tree[0]).toMatchObject({
      key: 'title',
      type: 'duplicate',
      isLeaf: true,
      role: 'button',
    });
    expect(tree[1]).toMatchObject({
      key: 'author',
      type: 'reference',
      isLeaf: false,
    });
    expect(tree[1].children.map((node) => node.key)).toEqual(['author.profile']);
    expect(tree[2].children.map((node) => node.key)).toEqual(['comments.body', 'comments.sort']);

    const dataSource = [
      {
        ...tree[2],
        children: [],
      },
    ];
    const setDataSource = vi.fn();
    await getOnLoadData(dataSource, setDataSource)(dataSource[0]);

    expect(dataSource[0].children.map((node) => node.key)).toEqual(['comments.body']);
    expect(setDataSource).toHaveBeenCalledWith(dataSource);

    const referenceDataSource = [
      {
        ...tree[1],
        children: [
          {
            key: 'author.profile',
            type: 'reference',
            field: createField({ name: 'profile', type: 'belongsTo', target: 'profiles', interface: 'm2o' }),
            children: [],
          },
        ],
      },
    ];
    await getOnLoadData(referenceDataSource, setDataSource)(referenceDataSource[0]);
    expect(referenceDataSource[0].children[0].isLeaf).toBe(true);

    const fields = { value: [] };
    getOnCheck(fields)(['title']);
    expect(fields.value).toEqual(['title']);
  });

  it('renders field tree node titles with and without type labels', () => {
    const dm = createDataSourceManager();
    const { getEnableFieldTree } = getCollectionState(dm, t, 'main');
    const [titleNode] = getEnableFieldTree('posts');

    render(titleNode.title);
    expect(screen.getByText('t:Title')).toBeInTheDocument();
    expect(screen.getByText('(Duplicate)')).toBeInTheDocument();

    cleanup();
    render(React.cloneElement(titleNode.title, { displayType: false }));
    expect(screen.getByText('t:Title')).toBeInTheDocument();
    expect(screen.queryByText('(Duplicate)')).not.toBeInTheDocument();
  });

  it('handles missing collections and max depth while building trees', async () => {
    const dm = createDataSourceManager();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getEnableFieldTree, getOnLoadData } = getCollectionState(dm, t, 'main');

    expect(getEnableFieldTree('missing')).toEqual([]);
    consoleError.mockRestore();

    const dataSource = [
      {
        key: 'title',
        type: 'unknown',
        field: createField({ name: 'title', interface: 'input' }),
        children: [],
      },
    ];
    const setDataSource = vi.fn();
    await getOnLoadData(dataSource, setDataSource)(dataSource[0]);

    expect(dataSource[0].isLeaf).toBe(true);
  });

  it('stops field traversal after the configured max depth', () => {
    const dm = {
      getCollection: vi.fn((_dataSourceKey: string, collectionName: string) => {
        if (collectionName === 'root') {
          return createCollection([{ name: 'deep', type: 'hasMany', target: 'deep', interface: 'o2m' }]);
        }
        if (collectionName === 'deep') {
          return createCollection([{ name: 'next', type: 'hasMany', target: 'deep', interface: 'o2m' }]);
        }
      }),
    };
    const { getEnableFieldTree } = getCollectionState(dm, t, 'main');
    const tree = getEnableFieldTree('root');

    expect(tree[0].children[0]).toMatchObject({
      key: 'deep.next',
      children: [],
    });
  });

  it('returns an empty tree when collection traversal fails', () => {
    const error = new Error('collection unavailable');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { getEnableFieldTree } = getCollectionState(
      {
        getCollection: vi.fn(() => {
          throw error;
        }),
      },
      t,
      'main',
    );

    expect(getEnableFieldTree('posts')).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith(error);
    consoleError.mockRestore();
  });

  it('syncs selected form fields from nested form models', async () => {
    const callback = vi.fn();
    const sync = getSyncFromForm(createDataSourceManager(), t, 'main', 'posts', callback);
    const titleItem = {
      fieldPath: 'title',
      collectionField: createField({ name: 'title', interface: 'input', association: false }),
      subModels: {
        field: {},
      },
    };
    const authorItem = {
      fieldPath: 'author',
      collectionField: createField({ name: 'author', type: 'belongsTo', target: 'users', interface: 'm2o' }),
      subModels: {
        field: {
          updateAssociation: true,
          subModels: {
            grid: {
              mapSubModels: vi.fn((subKey: string, iteratee: (item: unknown) => void) => {
                expect(subKey).toBe('items');
                iteratee({
                  fieldPath: 'author.name',
                  collectionField: createField({ name: 'name', interface: 'input', association: false }),
                  subModels: {
                    field: {},
                  },
                });
              }),
            },
          },
        },
      },
    };
    const commentsItem = {
      fieldPath: 'comments',
      collectionField: createField({ name: 'comments', type: 'hasMany', target: 'comments', interface: 'o2m' }),
      subModels: {
        field: {
          updateAssociation: false,
          subModels: {},
        },
      },
    };
    const model = {
      mapSubModels: vi.fn((subKey: string, iteratee: (item: unknown) => void) => {
        expect(subKey).toBe('items');
        [titleItem, authorItem, commentsItem].forEach(iteratee);
      }),
    };

    await sync.run(model);

    const [fieldTree, selectFields] = callback.mock.calls[0];
    expect(selectFields).toEqual(['title', 'author.name']);
    expect(fieldTree.map((node) => [node.key, node.disabled])).toEqual([
      ['title', false],
      ['author', true],
      ['comments', true],
    ]);
    expect(fieldTree.find((node) => node.key === 'author')?.children.map((node) => node.key)).toEqual([
      'author.name',
      'author.profile',
    ]);
    expect(fieldTree.find((node) => node.key === 'comments')?.children.every((node) => node.disabled)).toBe(true);
  });

  it('syncs association fields from sub table and column sub models', async () => {
    const callback = vi.fn();
    const sync = getSyncFromForm(createDataSourceManager(), t, 'main', 'posts', callback);
    const subTableColumns = {
      mapSubModels: vi.fn((_subKey: string, iteratee: (item: unknown) => void) => {
        iteratee({
          fieldPath: 'author.name',
          collectionField: createField({ name: 'name', interface: 'input', association: false }),
          subModels: {
            field: {},
          },
        });
      }),
    };
    const columns = {
      mapSubModels: vi.fn((_subKey: string, iteratee: (item: unknown) => void) => {
        iteratee({
          fieldPath: 'author.profile.avatar',
          collectionField: createField({ name: 'avatar', interface: 'input', association: false }),
          subModels: {
            field: {},
          },
        });
      }),
    };
    const model = {
      mapSubModels: vi.fn().mockImplementationOnce((_subKey: string, iteratee: (item: unknown) => void) => {
        iteratee({
          fieldPath: 'author',
          collectionField: createField({ name: 'author', type: 'belongsTo', target: 'users', interface: 'm2o' }),
          subModels: {
            field: {
              updateAssociation: true,
              mapSubModels: subTableColumns.mapSubModels,
              subModels: {
                subTableColumns,
              },
            },
          },
        });
        iteratee({
          fieldPath: 'author.profile',
          collectionField: createField({
            name: 'profile',
            type: 'belongsTo',
            target: 'profiles',
            interface: 'm2o',
          }),
          subModels: {
            field: {
              updateAssociation: true,
              mapSubModels: columns.mapSubModels,
              subModels: {
                columns,
              },
            },
          },
        });
      }),
    };

    await sync.run(model);

    expect(subTableColumns.mapSubModels).toHaveBeenCalledWith('subTableColumns', expect.any(Function));
    expect(columns.mapSubModels).toHaveBeenCalledWith('columns', expect.any(Function));
    expect(callback.mock.calls[0][1]).toEqual(['author.name', 'author.profile.avatar']);
  });

  it('keeps association fields as references when the form does not update them', async () => {
    const callback = vi.fn();
    const sync = getSyncFromForm(createDataSourceManager(), t, 'main', 'posts', callback);
    const model = {
      mapSubModels: vi.fn((_subKey: string, iteratee: (item: unknown) => void) => {
        iteratee({
          fieldPath: 'title',
          collectionField: createField({ name: 'title', interface: 'input', association: false }),
          subModels: {
            field: {},
          },
        });
      }),
    };

    await sync.run(model);

    const [fieldTree, selectFields] = callback.mock.calls[0];
    expect(selectFields).toEqual(['title']);
    expect(fieldTree.find((node) => node.key === 'author')).toMatchObject({
      type: 'reference',
      isLeaf: false,
    });
    expect(fieldTree.find((node) => node.key === 'author')?.children.map((node) => node.key)).toEqual([
      'author.profile',
    ]);
  });

  it('returns empty sync results when model is unavailable', async () => {
    const callback = vi.fn();
    const sync = getSyncFromForm(createDataSourceManager(), t, 'main', 'posts', callback);

    await sync.run(undefined);

    expect(callback).toHaveBeenCalledWith([], []);
  });
});
