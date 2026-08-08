/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath } from '..';
import { RUNJS_RESOLVABLE_EXTENSIONS, runJSVirtualDirname, runJSVirtualExtname, runJSVirtualJoin } from './portable';

export type RunJSTypeDependencyEdgeKind = 'runtime' | 'type' | 'reference';

export type RunJSUnresolvedDependencyKind = 'runtime' | 'type' | 'reference' | 'blocked' | 'dynamic';

export interface RunJSRuntimeDependencyEdge {
  importer: string;
  imported: string;
}

export interface RunJSTypeDependencyEdge extends RunJSRuntimeDependencyEdge {
  kind: RunJSTypeDependencyEdgeKind;
}

export interface RunJSTypeDependencyContract {
  id: string;
  version?: string;
  contentHash?: string;
}

export interface RunJSUnresolvedDependency {
  importer: string;
  specifier: string;
  candidatePaths: string[];
  kind?: RunJSUnresolvedDependencyKind;
}

export interface RunJSTypeDependencyGraph {
  files: string[];
  edges: RunJSTypeDependencyEdge[];
  contracts: RunJSTypeDependencyContract[];
}

export function buildRunJSUnresolvedCandidatePaths(importer: string, specifier: string): string[] {
  const normalizedImporter = normalizeCollectorPath(importer);
  if (!isRelativeSpecifier(specifier)) {
    return [];
  }
  const base = runJSVirtualJoin(runJSVirtualDirname(normalizedImporter), specifier);
  if (!base || base === '..' || base.startsWith('../')) {
    return [];
  }
  if (runJSVirtualExtname(base)) {
    return [normalizeCollectorPath(base)];
  }
  return [
    ...RUNJS_RESOLVABLE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...RUNJS_RESOLVABLE_EXTENSIONS.map((extension) => runJSVirtualJoin(base, `index${extension}`)),
  ]
    .map(normalizeCollectorPath)
    .sort();
}

function isRelativeSpecifier(specifier: string): boolean {
  return specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../');
}

function normalizeCollectorPath(path: string): string {
  return normalizePath(
    String(path || '')
      .replace(/\\/gu, '/')
      .replace(/^\.\//u, ''),
  );
}
