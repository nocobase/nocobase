/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * GOLDEN BASELINE (characterization) for `getCollectionFieldOptions`.
 *
 * Purpose (see migration doc §9.8, ADR-0003): this pins the *current* v1 output
 * of the field-tree builder before it is relocated to client-v2. After the
 * relocation (v1 re-imports the moved logic from `@nocobase/client-v2`), this
 * exact file re-runs unchanged and must stay green — proving the move caused
 * zero behavioral drift. An equivalent client-v2 test feeds the *same* mocks.
 *
 * Isolation rule: `compile` and `collectionManager` are injected mocks, never
 * the real `useCompile`/dataSourceManager, so the comparison is the pure logic
 * itself — not Formily vs. flow-engine translation. A dedicated test pins the
 * `compile` ↔ `useT` equivalence boundary (i18n-template expansion only).
 *
 * This file is deleted together with v1 at retirement; the client-v2 copy lives on.
 */

import { describe, expect, it, vi } from 'vitest';
import { getCollectionFieldOptions } from '../variable';

// --- Test doubles -----------------------------------------------------------

// `compile` only expands field titles. In v1 this is `useCompile` (Formily Schema.compile); in v2 it will be `useT`
// (flowEngine.translate). Both expand `{{t("X")}}` → translation and pass plain strings through. The mock models
// exactly that contract: strip the `{{t("…")}}` wrapper, else identity.
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
  collectionName?: string;
  dataSourceKey?: string;
};

function makeCollectionManager(collections: Record<string, MockField[]>) {
  return {
    getCollectionAllFields: vi.fn((collection: string) => collections[collection] ?? []),
  };
}

// --- Fixtures ---------------------------------------------------------------

// Flat collection: scalar fields of several interfaces (+ one hidden, one no-interface) to pin the `interface &&
// !hidden` filter.
const postFields: MockField[] = [
  { name: 'id', type: 'bigInt', interface: 'integer', uiSchema: { title: 'ID' }, primaryKey: true },
  { name: 'title', type: 'string', interface: 'input', uiSchema: { title: '{{t("Title")}}' } },
  { name: 'count', type: 'integer', interface: 'integer', uiSchema: { title: 'Count' } },
  { name: 'secret', type: 'string', interface: 'input', uiSchema: { title: 'Secret' }, hidden: true },
  { name: 'noIface', type: 'string', uiSchema: { title: 'NoIface' } },
];

// Association: post belongsTo user (+ FK userId).
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

// --- Characterization cases -------------------------------------------------

describe('getCollectionFieldOptions — golden baseline (v1)', () => {
  it('maps scalar fields: label (compiled), value=name, isLeaf=true, no loadChildren', () => {
    const collectionManager = makeCollectionManager({ posts: postFields });
    const result = getCollectionFieldOptions({ collection: 'posts', compile, collectionManager });

    // hidden + no-interface fields are dropped by getNormalizedFields.
    expect(result.map((o) => o.value)).toEqual(['id', 'title', 'count']);

    const title = result.find((o) => o.value === 'title');
    expect(title?.label).toBe('Title'); // {{t("Title")}} expanded
    expect(title?.key).toBe('title');
    expect(title?.isLeaf).toBe(true);
    expect(title?.loadChildren).toBeNull();
    // v1-only keys are present on the produced option (they get stripped by the future adapter, not here — this
    // baseline pins that they exist in v1).
    expect(title).toHaveProperty('field');
    expect(title).toHaveProperty('depth');
    expect(title).toHaveProperty('appends');
  });

  it('with appends=null, an un-appended association is dropped; its FK survives (belongsTo splicing)', () => {
    const collectionManager = makeCollectionManager({
      posts: postWithRelationFields,
      users: userFields,
    });
    const result = getCollectionFieldOptions({ collection: 'posts', compile, collectionManager });

    // The `author` belongsTo is NOT surfaced when not explicitly appended; getNormalizedFields surfaces the foreign key
    // `authorId` instead.
    expect(result.map((o) => o.value)).toEqual(['id', 'title', 'authorId']);
    expect(result.find((o) => o.value === 'author')).toBeUndefined();
    // Every surviving field is a leaf here (the FK is scalar).
    expect(result.every((o) => o.isLeaf === true)).toBe(true);
  });

  it('with the association appended, it appears last as non-leaf and loadChildren resolves its fields', () => {
    const collectionManager = makeCollectionManager({
      posts: postWithRelationFields,
      users: userFields,
    });
    const result = getCollectionFieldOptions({
      collection: 'posts',
      appends: ['author'],
      compile,
      collectionManager,
    });

    // Appended association is ordered after the scalars/FK.
    expect(result.map((o) => o.value)).toEqual(['id', 'title', 'authorId', 'author']);

    const author = result.find((o) => o.value === 'author');
    expect(author?.isLeaf).toBe(false);
    expect(typeof author?.loadChildren).toBe('function');

    // Invoke the lazy loader the way the variable picker would: it mutates the option in place (sets `children`, clears
    // `loadChildren`).
    author?.loadChildren?.(author);
    expect(author?.loadChildren).toBeNull();
    expect(Array.isArray(author?.children)).toBe(true);
    expect((author?.children ?? []).map((c: any) => c.value)).toEqual(['id', 'nickname']);
  });

  it('respects fieldNames overrides (label/value/children keys)', () => {
    const collectionManager = makeCollectionManager({ posts: postFields });
    const result = getCollectionFieldOptions({
      collection: 'posts',
      compile,
      collectionManager,
      fieldNames: { label: 'title', value: 'name', children: 'options' },
    });
    const title = result.find((o) => o.name === 'title');
    expect(title?.title).toBe('Title');
    expect(title?.name).toBe('title');
  });

  it('type filtering keeps only matching interfaces (types=["number"])', () => {
    const collectionManager = makeCollectionManager({ posts: postFields });
    const result = getCollectionFieldOptions({
      collection: 'posts',
      types: ['number'],
      compile,
      collectionManager,
    });
    // BaseTypeSets.number = integer/number/percent → only `id` and `count`.
    expect(result.map((o) => o.value).sort()).toEqual(['count', 'id']);
  });

  it('accepts pre-supplied `fields` (bypasses getNormalizedFields / collectionManager)', () => {
    const collectionManager = makeCollectionManager({});
    const result = getCollectionFieldOptions({
      fields: [{ name: 'x', type: 'string', interface: 'input', uiSchema: { title: 'X' } }],
      compile,
      collectionManager,
    });
    expect(result.map((o) => o.value)).toEqual(['x']);
    expect(collectionManager.getCollectionAllFields).not.toHaveBeenCalled();
  });

  it('parses dataSource-qualified collection names and forwards the bare name to the manager', () => {
    const collectionManager = makeCollectionManager({ roles: userFields });
    getCollectionFieldOptions({ collection: 'main:roles', compile, collectionManager });
    // parseCollectionName drops the `main` data source → manager sees `roles`.
    expect(collectionManager.getCollectionAllFields).toHaveBeenCalledWith('roles');
  });
});

describe('compile ↔ useT equivalence boundary', () => {
  it('expands {{t("…")}} field titles and passes plain strings through (the only compile usage)', () => {
    // The relocated builder uses `compile` ONLY on field titles. This pins the contract both v1 useCompile and v2 useT
    // must satisfy identically. If a field title ever carried a non-i18n scope expression, this assertion (and the v2
    // copy) would diverge and surface the drift.
    expect(compile('{{t("Title")}}')).toBe('Title');
    expect(compile('Plain title')).toBe('Plain title');
    expect(compile('{{t("With ns", { ns: "workflow" })}}')).toBe('With ns');
  });
});
