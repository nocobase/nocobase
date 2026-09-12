/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * client-v2 copy of the getCollectionFieldOptions golden baseline (ADR-0003,
 * migration doc §9.8). Feeds the SAME injected mocks as the v1 characterization
 * test against the relocated source, proving the move caused zero drift and
 * pinning the contract the v2 aggregator + adapter build on.
 */

import { describe, expect, it, vi } from 'vitest';
import { getCollectionFieldOptions } from '../collectionFieldOptions';

// Same `compile` contract both v1 `useCompile` and v2 `useT` must satisfy: expand `{{t("…")}}` → translation, pass
// plain strings through.
const compile = (source: unknown) => {
  if (typeof source !== 'string') {
    return source;
  }
  const m = source.match(/^\{\{\s*t\(["'](.+?)["'].*\)\s*\}\}$/);
  return m ? m[1] : source;
};

type MockField = {
  name: string;
  type: string;
  interface?: string;
  uiSchema?: { title?: string };
  target?: string;
  targetKey?: string;
  foreignKey?: string;
  isForeignKey?: boolean;
  primaryKey?: boolean;
  hidden?: boolean;
};

function makeCollectionManager(collections: Record<string, MockField[]>) {
  return {
    getCollectionAllFields: vi.fn((collection: string) => collections[collection] ?? []),
  };
}

const postFields: MockField[] = [
  { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
  { name: 'title', type: 'string', interface: 'input', uiSchema: { title: '{{t("Title")}}' } },
  { name: 'count', type: 'integer', interface: 'integer', uiSchema: { title: 'Count' } },
  { name: 'secret', type: 'string', interface: 'input', uiSchema: { title: 'Secret' }, hidden: true },
  { name: 'noIface', type: 'string', uiSchema: { title: 'NoIface' } },
];

const postWithRelationFields: MockField[] = [
  { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
  { name: 'title', type: 'string', interface: 'input', uiSchema: { title: 'Title' } },
  {
    name: 'author',
    type: 'belongsTo',
    interface: 'm2o',
    target: 'users',
    targetKey: 'id',
    foreignKey: 'authorId',
    uiSchema: { title: 'Author' },
  },
  {
    name: 'authorId',
    type: 'bigInt',
    interface: 'integer',
    foreignKey: 'authorId',
    isForeignKey: true,
    uiSchema: { title: 'Author ID' },
  },
];

const userFields: MockField[] = [
  { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
  { name: 'nickname', type: 'string', interface: 'input', uiSchema: { title: 'Nickname' } },
];

describe('getCollectionFieldOptions (client-v2)', () => {
  it('maps scalar fields and drops hidden / no-interface fields', () => {
    const collectionManager = makeCollectionManager({ posts: postFields });
    const result = getCollectionFieldOptions({ collection: 'posts', compile, collectionManager });
    expect(result.map((o) => o.value)).toEqual(['id', 'title', 'count']);
    const title = result.find((o) => o.value === 'title');
    expect(title?.label).toBe('Title');
    expect(title?.isLeaf).toBe(true);
    expect(title?.loadChildren).toBeNull();
  });

  it('un-appended association dropped, FK surfaced (belongsTo splicing)', () => {
    const collectionManager = makeCollectionManager({ posts: postWithRelationFields, users: userFields });
    const result = getCollectionFieldOptions({ collection: 'posts', compile, collectionManager });
    expect(result.map((o) => o.value)).toEqual(['id', 'title', 'authorId']);
  });

  it('appended association is last, non-leaf, and loadChildren resolves its fields', () => {
    const collectionManager = makeCollectionManager({ posts: postWithRelationFields, users: userFields });
    const result = getCollectionFieldOptions({ collection: 'posts', appends: ['author'], compile, collectionManager });
    expect(result.map((o) => o.value)).toEqual(['id', 'title', 'authorId', 'author']);
    const author = result.find((o) => o.value === 'author');
    expect(author?.isLeaf).toBe(false);
    author?.loadChildren?.(author);
    expect((author?.children ?? []).map((c: any) => c.value)).toEqual(['id', 'nickname']);
  });

  it('respects fieldNames overrides and type filtering and pre-supplied fields', () => {
    const cmFieldNames = makeCollectionManager({ posts: postFields });
    const renamed = getCollectionFieldOptions({
      collection: 'posts',
      compile,
      collectionManager: cmFieldNames,
      fieldNames: { label: 'title', value: 'name', children: 'options' },
    });
    expect(renamed.find((o) => o.name === 'title')?.title).toBe('Title');

    const cmTypes = makeCollectionManager({ posts: postFields });
    const numbersOnly = getCollectionFieldOptions({
      collection: 'posts',
      types: ['number'],
      compile,
      collectionManager: cmTypes,
    });
    expect(numbersOnly.map((o) => o.value).sort()).toEqual(['count', 'id']);

    const cmEmpty = makeCollectionManager({});
    const preSupplied = getCollectionFieldOptions({
      fields: [{ name: 'x', type: 'string', interface: 'input', uiSchema: { title: 'X' } }],
      compile,
      collectionManager: cmEmpty,
    });
    expect(preSupplied.map((o) => o.value)).toEqual(['x']);
    expect(cmEmpty.getCollectionAllFields).not.toHaveBeenCalled();
  });

  it('parses dataSource-qualified collection names (inlined parseCollectionName)', () => {
    const collectionManager = makeCollectionManager({ roles: userFields });
    getCollectionFieldOptions({ collection: 'main:roles', compile, collectionManager });
    expect(collectionManager.getCollectionAllFields).toHaveBeenCalledWith('roles');
  });

  it('returns an empty field tree when collection is unset', () => {
    const collectionManager = makeCollectionManager({});
    expect(getCollectionFieldOptions({ compile, collectionManager })).toEqual([]);
    expect(collectionManager.getCollectionAllFields).not.toHaveBeenCalled();
  });

  describe('deeply nested appends', () => {
    // A chain c0 -> c1 -> ... -> c5, each level linked by a `next` belongsTo, mirroring a collection-event trigger
    // whose "Preload associations" config goes several levels deep.
    const chain: Record<string, MockField[]> = {};
    for (let i = 0; i <= 5; i++) {
      chain[`c${i}`] = [
        { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
        { name: `name${i}`, type: 'string', interface: 'input', uiSchema: { title: `Name${i}` } },
        ...(i < 5
          ? [
              {
                name: 'next',
                type: 'belongsTo',
                interface: 'm2o',
                target: `c${i + 1}`,
                targetKey: 'id',
                foreignKey: 'nextId',
                uiSchema: { title: 'Next' },
              } as MockField,
              {
                name: 'nextId',
                type: 'bigInt',
                interface: 'integer',
                foreignKey: 'nextId',
                isForeignKey: true,
                uiSchema: { title: 'Next ID' },
              } as MockField,
            ]
          : []),
      ];
    }

    // Walk the tree the way the variable picker does: expand `next` level by level, returning the paths reached.
    function walk(configAppends: string[], types?: any[]) {
      const collectionManager = makeCollectionManager(chain);
      const options = getCollectionFieldOptions({
        types,
        // Same shape the collection trigger builds: the record itself plus every configured path under it.
        appends: ['data', ...configAppends.map((item) => `data.${item}`)],
        fields: [
          { collectionName: 'c0', name: 'data', type: 'hasOne', target: 'c0', uiSchema: { title: 'Trigger data' } },
        ],
        compile,
        collectionManager,
      });
      const reached: string[] = [];
      const path = ['data'];
      let current: any = options.find((o) => o.value === 'data');
      while (current) {
        reached.push(path.join('.'));
        if (current.isLeaf || !current.loadChildren) {
          break;
        }
        current.loadChildren(current);
        current = (current.children ?? []).find((child: any) => child.value === 'next');
        path.push('next');
      }
      return reached;
    }

    const full = ['next', 'next.next', 'next.next.next', 'next.next.next.next'];
    const gapped = ['next', 'next.next', 'next.next.next.next']; // `next.next.next` missing from the config
    const leafOnly = ['next.next.next.next'];
    const allLevels = ['data', 'data.next', 'data.next.next', 'data.next.next.next', 'data.next.next.next.next'];

    it('walks every configured level', () => {
      expect(walk(full)).toEqual(allLevels);
    });

    // A nested appends entry preloads the whole chain server-side, so a missing intermediate entry must not cut the
    // variable tree short — it used to stop at the gap, making deeper variables unselectable.
    it('walks past gaps in the configured paths', () => {
      expect(walk(gapped)).toEqual(allLevels);
      expect(walk(leafOnly)).toEqual(allLevels);
    });

    it('walks past gaps with a type filter as well', () => {
      expect(walk(gapped, ['string'])).toEqual(allLevels);
      expect(walk(leafOnly, ['string'])).toEqual(allLevels);
    });
  });
});
