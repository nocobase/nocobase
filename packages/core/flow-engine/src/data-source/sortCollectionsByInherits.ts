/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '.';

export function sortCollectionsByInherits(collections: CollectionOptions[]): CollectionOptions[] {
  const sorted: CollectionOptions[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const map = new Map<string, CollectionOptions>();

  // Create a map for O(1) lookup
  collections.forEach((col) => {
    map.set(col.name, col);
  });

  const addToSorted = (col: CollectionOptions): void => {
    // Check for circular dependency
    if (visiting.has(col.name)) {
      throw new Error(`Circular dependency detected: ${col.name} inherits from itself through a chain`);
    }

    // Skip if already processed
    if (visited.has(col.name)) {
      return;
    }

    // Mark as currently being processed
    visiting.add(col.name);

    // Process inherits first (dependencies)
    const inherits = col.inherits || [];
    for (const inheritName of inherits) {
      const inheritCol = map.get(inheritName);
      if (!inheritCol) {
        console.warn(`Warning: Collection ${inheritName}, inherited by ${col.name}, not found.`);
        continue;
      }
      addToSorted(inheritCol);
      // Silently skip missing inherit collections
    }

    // Mark as processed and add to sorted array
    visiting.delete(col.name);
    visited.add(col.name);
    sorted.push(col);
  };

  // Process all collections
  for (const col of collections) {
    addToSorted(col);
  }

  return sorted;
}
