/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { sortCollectionsByInherits } from '../sortCollectionsByInherits';

describe('sortCollectionsByInherits', () => {
  it('should sort collections by their inherits in correct order', () => {
    const collections = [
      { name: 'posts', inherits: [] },
      { name: 'comments', inherits: ['posts'] },
      { name: 'users', inherits: ['comments'] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['posts', 'comments', 'users']);
  });

  it('should handle collections with no inherits', () => {
    const collections = [
      { name: 'users', inherits: [] },
      { name: 'posts', inherits: [] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['users', 'posts']);
  });

  it('should handle collections with undefined inherits', () => {
    const collections = [{ name: 'users' }, { name: 'posts' }];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['users', 'posts']);
  });

  it('should handle complex inheritance chains', () => {
    const collections = [
      { name: 'base', inherits: [] },
      { name: 'middle', inherits: ['base'] },
      { name: 'top', inherits: ['middle'] },
      { name: 'independent', inherits: [] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['base', 'middle', 'top', 'independent']);
  });

  it('should handle multiple inheritance', () => {
    const collections = [
      { name: 'user', inherits: [] },
      { name: 'post', inherits: [] },
      { name: 'comment', inherits: ['user', 'post'] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['user', 'post', 'comment']);
  });

  it('should throw error for circular dependencies', () => {
    const collections = [
      { name: 'a', inherits: ['b'] },
      { name: 'b', inherits: ['a'] },
    ];
    expect(() => sortCollectionsByInherits(collections)).toThrow('Circular dependency detected');
  });

  it('should gracefully handle missing inherit collections', () => {
    const collections = [
      { name: 'posts', inherits: ['nonexistent'] },
      { name: 'users', inherits: [] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['posts', 'users']);
  });

  it('should handle self-inheritance circular dependency', () => {
    const collections = [{ name: 'posts', inherits: ['posts'] }];
    expect(() => sortCollectionsByInherits(collections)).toThrow('Circular dependency detected');
  });

  it('should maintain order for collections without dependencies', () => {
    const collections = [
      { name: 'z', inherits: [] },
      { name: 'a', inherits: [] },
      { name: 'm', inherits: [] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['z', 'a', 'm']);
  });

  it('should handle empty collections array', () => {
    const sorted = sortCollectionsByInherits([]);
    expect(sorted).toEqual([]);
  });

  it('should handle collections with multiple missing inherits', () => {
    const collections = [
      { name: 'posts', inherits: ['missing1', 'missing2'] },
      { name: 'users', inherits: ['missing3'] },
      { name: 'comments', inherits: ['posts', 'missing4'] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['posts', 'users', 'comments']);
  });

  it('should handle mixed existing and missing inherits', () => {
    const collections = [
      { name: 'base', inherits: [] },
      { name: 'middle', inherits: ['base', 'missing'] },
      { name: 'top', inherits: ['middle'] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['base', 'middle', 'top']);
  });

  it('should handle all inherits missing', () => {
    const collections = [
      { name: 'posts', inherits: ['missing1', 'missing2'] },
      { name: 'users', inherits: ['missing3'] },
    ];
    const sorted = sortCollectionsByInherits(collections);
    expect(sorted.map((c) => c.name)).toEqual(['posts', 'users']);
  });
});
