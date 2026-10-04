import { describe, expect, it } from 'vitest';
import {
  writableFields,
  writePolicyProblems,
  type CollectionDefinition,
} from '../../src/index.js';

const posts: CollectionDefinition = {
  name: 'posts',
  fields: [
    { name: 'id', type: 'increments', primaryKey: true },
    { name: 'title', type: 'string' },
    { name: 'serial', type: 'bigInt', autoIncrement: true },
    {
      name: 'slug',
      type: 'string',
      db: { generated: { expression: 'lower(title)', stored: true } },
    },
    { name: 'version', type: 'integer' },
    { name: 'authorId', type: 'string' },
    {
      name: 'author',
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'authorId',
    },
    {
      name: 'tags',
      type: 'belongsToMany',
      target: 'tags',
      through: 'postTags',
      foreignKey: 'postId',
      otherKey: 'tagId',
    },
    { name: 'ghost', type: 'belongsTo', target: 'missing' },
  ],
  constraints: [{ type: 'primary', fields: ['id'] }],
  optimisticLock: { field: 'version', strategy: 'increment' },
};

const collections: Readonly<Record<string, CollectionDefinition>> = {
  posts,
  users: {
    name: 'users',
    fields: [
      { name: 'id', type: 'string', primaryKey: true },
      { name: 'name', type: 'string' },
    ],
  },
  tags: {
    name: 'tags',
    fields: [
      { name: 'id', type: 'increments', primaryKey: true },
      { name: 'label', type: 'string' },
    ],
  },
  postTags: {
    name: 'postTags',
    fields: [
      { name: 'id', type: 'increments', primaryKey: true },
      { name: 'postId', type: 'integer' },
      { name: 'tagId', type: 'integer' },
      { name: 'role', type: 'string' },
    ],
    constraints: [{ type: 'primary', fields: ['id'] }],
  },
};

const registry = {
  get: (name: string): Promise<CollectionDefinition | undefined> =>
    Promise.resolve(collections[name]),
};

describe('writableFields', () => {
  it('lists the scalar fields a write may name, leaving out relations and what db or the Repository assigns', () => {
    expect(writableFields(posts)).toEqual(['title', 'authorId']);
    expect(writableFields(collections.users)).toEqual(['id', 'name']);
  });
});

describe('writePolicyProblems', () => {
  it('accepts a policy that names writable fields and existing relations', async () => {
    await expect(
      writePolicyProblems(registry, posts, {
        fields: ['title', 'authorId'],
        relations: {
          author: { update: { fields: ['name'] }, connect: {} },
          tags: {
            create: { fields: ['label'], through: { fields: ['role'] } },
            set: { through: { fields: ['role'] } },
          },
        },
      }),
    ).resolves.toEqual([]);
  });

  it('reports every member that does not fit, each with its path in the policy', async () => {
    const problems = await writePolicyProblems(registry, posts, {
      fields: ['id', 'title', 'serial', 'slug', 'version', 'nope', 'author'],
      relations: {
        author: {
          create: { fields: ['missing'] },
          upsert: { create: { fields: ['name'] }, update: { fields: [] } },
          connect: { through: { fields: ['name'] } },
        },
        tags: {
          create: { fields: ['id'], through: { fields: ['postId', 'role'] } },
        },
        ghost: { connect: {} },
        unknown: { connect: {} },
      },
    });
    expect(problems.map((problem) => problem.path)).toEqual([
      ['fields', 0],
      ['fields', 2],
      ['fields', 3],
      ['fields', 4],
      ['fields', 5],
      ['fields', 6],
      ['relations', 'author', 'create', 'fields', 0],
      ['relations', 'author', 'connect', 'through'],
      ['relations', 'tags', 'create', 'fields', 0],
      ['relations', 'tags', 'create', 'through', 'fields', 0],
      ['relations', 'ghost'],
      ['relations', 'unknown'],
    ]);
    expect(problems[0].message).toBe(
      'Field "id" is not a writable scalar field of "posts".',
    );
    expect(problems.at(-2)?.message).toBe(
      'Relation target "missing" does not exist.',
    );
    expect(problems.at(-1)?.message).toBe(
      'Relation "unknown" does not exist on "posts".',
    );
  });

  it('reports nothing for a policy without field lists or relations', async () => {
    await expect(
      writePolicyProblems(registry, posts, { fields: false, relations: false }),
    ).resolves.toEqual([]);
  });
});
