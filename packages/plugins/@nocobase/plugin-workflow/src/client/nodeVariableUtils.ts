/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parse } from '@nocobase/utils/client';

export function extractDependencyKeys(config: Record<string, any>): Set<string> {
  const keys = new Set<string>();
  try {
    const template = parse(config);
    const params = template?.parameters ?? [];
    for (const { key } of params) {
      if (typeof key !== 'string') {
        continue;
      }
      if (key.startsWith('$jobsMapByNodeKey.')) {
        const rest = key.slice('$jobsMapByNodeKey.'.length);
        const nodeKey = rest.split('.')[0];
        if (nodeKey) {
          keys.add(nodeKey);
        }
      } else if (key.startsWith('$scopes.')) {
        const rest = key.slice('$scopes.'.length);
        const nodeKey = rest.split('.')[0];
        if (nodeKey) {
          keys.add(nodeKey);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
  return keys;
}

function getTemplateRefKey(expression: string): string | null {
  const trimmed = expression.trim();
  const prefixes = ['$jobsMapByNodeKey.', '$scopes.'];
  for (const prefix of prefixes) {
    if (trimmed.startsWith(prefix)) {
      const rest = trimmed.slice(prefix.length);
      const key = rest.split(/[.\s]/)[0];
      return key || null;
    }
  }
  return null;
}

export function stripVariableReferences(value: any, keysToRemove: Set<string>): { value: any; changed: boolean } {
  if (typeof value === 'string') {
    const regex = /{{\s*([^{}]+?)\s*}}/g;
    let changed = false;
    const next = value.replace(regex, (match, expr) => {
      const key = getTemplateRefKey(expr);
      if (key && keysToRemove.has(key)) {
        changed = true;
        return '';
      }
      return match;
    });
    if (!changed) {
      return { value, changed: false };
    }
    if (next.trim() === '') {
      return { value: null, changed: true };
    }
    return { value: next, changed: true };
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const result = stripVariableReferences(item, keysToRemove);
      if (result.changed) {
        changed = true;
      }
      return result.value;
    });
    return { value: changed ? next : value, changed };
  }

  if (value && typeof value === 'object') {
    let changed = false;
    const next: Record<string, any> = {};
    Object.entries(value).forEach(([key, item]) => {
      const result = stripVariableReferences(item, keysToRemove);
      if (result.changed) {
        changed = true;
      }
      next[key] = result.value;
    });
    return { value: changed ? next : value, changed };
  }

  return { value, changed: false };
}

export function collectUpstreams(node): Set<number> {
  const result = new Set<number>();
  for (let current = node; current; current = current.upstream) {
    result.add(current.id);
  }
  return result;
}
