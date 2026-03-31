/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type DynamicNamePart = string | number;

/**
 * Build a dynamic NamePath based on current subform list row index.
 *
 * fieldIndex is an array like: ["products:0", "products:2"] (nested lists allowed, including same-name lists).
 *
 * For example:
 * - nameParts: ["products", "products"] + fieldIndex: ["products:0"] => [0, "products"]
 * - nameParts: ["products", "products", "id"] + fieldIndex: ["products:1", "products:0"] => [0, "id"]
 */
export function buildDynamicNamePath(nameParts: DynamicNamePart[], fieldIndex?: string[]): DynamicNamePart[] {
  if (!fieldIndex?.length) {
    return nameParts;
  }

  const last = fieldIndex[fieldIndex.length - 1];
  const [lastField, indexStr] = String(last).split(':');
  const idx = Number(indexStr);
  if (!lastField || !Number.isFinite(idx)) {
    return nameParts;
  }

  // Support same-name nested lists by mapping the N-th occurrence in fieldIndex
  // to the N-th occurrence in nameParts (from left to right).
  let occurrence = 0;
  for (const item of fieldIndex) {
    const [fieldName] = String(item).split(':');
    if (fieldName === lastField) occurrence += 1;
  }

  let matchIndex = -1;
  let seen = 0;
  for (let i = 0; i < nameParts.length; i++) {
    if (String(nameParts[i]) === lastField) {
      seen += 1;
      if (seen === occurrence) {
        matchIndex = i;
        break;
      }
    }
  }

  // Fallback: when nameParts doesn't contain enough occurrences, fall back to last occurrence.
  if (matchIndex === -1) {
    for (let i = nameParts.length - 1; i >= 0; i--) {
      if (String(nameParts[i]) === lastField) {
        matchIndex = i;
        break;
      }
    }
  }

  if (matchIndex === -1) {
    return nameParts;
  }

  return [idx, ...nameParts.slice(matchIndex + 1)];
}
