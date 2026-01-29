/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { NamePath } from './types';

export type PathSegment = string | number | { placeholder: string };

export function parsePathString(path: string): PathSegment[] {
  const segs: PathSegment[] = [];
  let i = 0;
  const len = path.length;
  const readIdent = () => {
    const start = i;
    while (i < len && path[i] !== '.' && path[i] !== '[') i++;
    const raw = path.slice(start, i);
    if (raw) segs.push(raw);
  };
  while (i < len) {
    const ch = path[i];
    if (ch === '.') {
      i++;
      continue;
    }
    if (ch === '[') {
      i++;
      const start = i;
      while (i < len && path[i] !== ']') i++;
      const raw = path.slice(start, i);
      i++;
      if (/^\d+$/.test(raw)) {
        segs.push(Number(raw));
      } else if (raw) {
        segs.push({ placeholder: raw });
      }
      continue;
    }
    readIdent();
  }
  return segs;
}

type FieldIndexEntry = { name: string; index: number };

function parseFieldIndexEntries(fieldIndex: unknown): FieldIndexEntry[] {
  const arr = Array.isArray(fieldIndex) ? fieldIndex : [];
  const entries: FieldIndexEntry[] = [];
  for (const it of arr) {
    if (typeof it !== 'string') continue;
    const [name, indexStr] = it.split(':');
    const index = Number(indexStr);
    if (!name || Number.isNaN(index)) continue;
    entries.push({ name, index });
  }
  return entries;
}

/**
 * Resolve a dynamic NamePath using the current row index context (`fieldIndex`).
 *
 * - Supports placeholders: `users[placeholder].name`
 * - Auto-fills to-many index when omitted: `users.name` -> `users[ctxIndex].name`
 *
 * Returns `null` when a placeholder can't be resolved in current context.
 */
export function resolveDynamicNamePath(path: string | NamePath, fieldIndex?: unknown): NamePath | null {
  const segs = Array.isArray(path) ? [...path] : parsePathString(path);
  const entries = parseFieldIndexEntries(fieldIndex);

  const resolved: NamePath = [];
  let idxPtr = 0;

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i] as any;

    // Explicit placeholder: xxx[placeholder] -> use current context index at the same nesting level.
    if (typeof seg === 'object' && seg && 'placeholder' in seg) {
      const prev = resolved[resolved.length - 1];
      const owner = typeof prev === 'string' ? prev : undefined;
      if (!owner) return null;

      while (idxPtr < entries.length && entries[idxPtr].name !== owner) idxPtr++;
      if (idxPtr >= entries.length) return null;

      resolved.push(entries[idxPtr].index);
      idxPtr++;
      continue;
    }

    // Normal segment
    resolved.push(seg);

    // Auto-fill to-many index: users.name -> users[ctxIndex].name
    if (typeof seg === 'string' && idxPtr < entries.length && entries[idxPtr].name === seg) {
      const next = segs[i + 1] as any;
      if (typeof next === 'number') {
        // Explicit index (users[0]) - still consume one entry to keep nesting aligned.
        idxPtr++;
      } else if (typeof next === 'object' && next && 'placeholder' in next) {
        // Placeholder branch will insert index, don't consume here.
      } else {
        resolved.push(entries[idxPtr].index);
        idxPtr++;
      }
    }
  }

  return resolved;
}

export function namePathToPathKey(namePath: Array<string | number>): string {
  let out = '';
  for (const seg of namePath) {
    if (typeof seg === 'number') {
      out += `[${seg}]`;
      continue;
    }
    if (!out) {
      out = seg;
    } else {
      out += `.${seg}`;
    }
  }
  return out;
}

export function pathKeyToNamePath(pathKey: string): NamePath {
  return parsePathString(pathKey).filter((seg) => typeof seg !== 'object') as NamePath;
}

export function buildAncestorKeys(namePath: NamePath): string[] {
  const out: string[] = [];
  const cur: Array<string | number> = [];
  for (const seg of namePath) {
    cur.push(seg);
    out.push(namePathToPathKey(cur));
  }
  return out;
}
