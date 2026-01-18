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
