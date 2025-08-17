/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { snakeCase } from '../utils';

/**
 * Traverse the `where` clause and collect association alias paths referenced by "$...$" keys.
 * Example: "$posts.comments.id$" -> collects "posts.comments" (drops the last segment which is the field).
 * - Supports nested objects, arrays, and symbol-keyed properties.
 * - Returned paths are unique (Set-based collection).
 */
const collectAssociationPathsFromWhere = (where: any): string[] => {
  const aliasPaths = new Set<string>();

  const traverse = (value: any) => {
    if (value == null) return;

    if (Array.isArray(value)) {
      for (const item of value) traverse(item);
      return;
    }

    if (typeof value === 'object') {
      for (const [rawKey, child] of Object.entries(value as Record<string, unknown>)) {
        // Keys in the format "$a.b.c$" indicate a path across associations, ending with a field name.
        if (typeof rawKey === 'string' && rawKey.startsWith('$') && rawKey.endsWith('$')) {
          const inner = rawKey.slice(1, -1);
          const segments = inner.split('.');
          if (segments.length > 1) {
            // Keep only the association path (drop the last segment which represents a concrete field)
            aliasPaths.add(segments.slice(0, -1).join('.'));
          }
        }
        traverse(child);
      }

      // Also traverse symbol-keyed properties to be exhaustive
      for (const sym of Object.getOwnPropertySymbols(value)) {
        traverse((value as any)[sym]);
      }
    }
  };

  traverse(where);
  return Array.from(aliasPaths);
};

/**
 * Prune an include tree by a list of normalized (snake_case) association paths.
 * It keeps only the branches whose association alias matches any of the paths (or their prefixes),
 * and recursively passes down the remainder of each matched path to child includes.
 *
 * Example:
 *   paths = ["posts.comments", "profile"]
 *   - For an include with association "posts", it matches "posts.comments" and passes "comments" to its children.
 *   - For an include with association "profile", it keeps the node as-is (no child path remainder).
 */
const pruneIncludeTreeByPaths = (includes = [], normalizedPaths: string[]): any[] => {
  if (!includes?.length || !normalizedPaths?.length) return [];

  const pruned = [];

  for (const inc of includes) {
    const association = inc?.association;
    if (!association) continue;

    const assocKey = snakeCase(String(association));

    // Keep current node only if any path equals the alias or starts with "alias."
    const matched = normalizedPaths.filter((p) => p === assocKey || p.startsWith(assocKey + '.'));
    if (!matched.length) continue;

    // Compute child path remainders (the part after the current alias)
    const childRemainders = matched
      .map((p) => (p === assocKey ? null : p.slice(assocKey.length + 1)))
      .filter(Boolean) as string[];

    const children = pruneIncludeTreeByPaths(inc.include ?? [], childRemainders);

    const copy = { ...inc };
    if (children.length) {
      copy.include = children;
    } else if ('include' in copy) {
      // Remove empty include to keep payload minimal and consistent
      delete copy.include;
    }

    pruned.push(copy);
  }

  return pruned;
};

/**
 * Merge a flat list of include descriptors by association (alias) key.
 * - Nodes with the same association are merged into one.
 * - `required` is OR-ed (true if any source is true).
 * - Child includes are recursively merged with the same rules.
 * - Empty `include` arrays are removed to keep the payload minimal.
 *
 * Notes:
 * - Association keys are normalized via snake_case to ensure consistent merging.
 * - This function is idempotent and order-insensitive for equivalent input sets.
 *
 * Usage example (input and output):
 *
 *   const includesA = [
 *     { association: 'posts', required: true, include: [{ association: 'comments' }] },
 *     { association: 'profile' },
 *   ];
 *
 *   const includesB = [
 *     { association: 'posts', include: [
 *         { association: 'comments', required: true },
 *         { association: 'tags' },
 *       ]
 *     },
 *     { association: 'roles', required: true },
 *   ];
 *
 *   const merged = mergeIncludes([...includesA, ...includesB]);
 *
 *   Result:
 *   [
 *     {
 *       association: 'posts',
 *       required: true,
 *       include: [
 *         { association: 'comments', required: true },
 *         { association: 'tags' },
 *       ],
 *     },
 *     { association: 'profile' },
 *     { association: 'roles', required: true },
 *   ]
 */
export const mergeIncludes = (includes = []): any[] => {
  const byAssociation = new Map<string, any>();

  const mergeAll = (list = []) => {
    for (const inc of list) {
      const association = inc?.association;
      if (!association) continue;

      const key = snakeCase(String(association));
      if (!byAssociation.has(key)) {
        byAssociation.set(key, { ...inc, include: undefined });
      }

      const target = byAssociation.get(key)!;

      // Required: union (any true => true)
      if (inc.required) target.required = true;

      // Merge children recursively
      const mergedChildren = mergeIncludes([...(target.include ?? []), ...(inc.include ?? [])]);

      if (mergedChildren.length) {
        target.include = mergedChildren;
      } else if ('include' in target) {
        delete target.include;
      }
    }
  };

  mergeAll(includes);
  return Array.from(byAssociation.values());
};

export const filterIncludes = (where, includes, options: { underscored: boolean }) => {
  const requiredPathsRaw = collectAssociationPathsFromWhere(where);
  const normalizedPaths = options.underscored
    ? requiredPathsRaw.map((p) =>
        p
          .split('.')
          .map((s) => snakeCase(s))
          .join('.'),
      )
    : requiredPathsRaw;
  const result = pruneIncludeTreeByPaths(includes, normalizedPaths);
  return result;
};
