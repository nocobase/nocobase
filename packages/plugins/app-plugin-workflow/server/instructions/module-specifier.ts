import path from 'node:path';

import type { ConfigIssue } from './types.js';

const TEMPLATE_PATTERN = /\{\{[^{}]*\}\}/;

/**
 * Validate a handler module specifier.
 *
 * Run and condition nodes both name a module that ships inside the workflow
 * package, and both need the same guarantees: the entry of a published version
 * has to be static and auditable, and it must not be able to address anything
 * outside the package. `loadRunModule()` re-checks the resolved path against
 * the resource root at execution time; this is what keeps a bad specifier from
 * being published in the first place.
 */
export interface ModuleSpecifierLocation {
  /** Config path reported on the issue, such as `config.module`. */
  readonly path: string;
  /** How the field is named in the message, such as `run config module`. */
  readonly label: string;
}

export function moduleSpecifierIssues(
  value: unknown,
  location: ModuleSpecifierLocation,
): ConfigIssue[] {
  const { path: configPath, label } = location;
  if (typeof value !== 'string' || !value.trim()) {
    return [
      { path: configPath, message: `${label} must be a non-empty string` },
    ];
  }
  if (TEMPLATE_PATTERN.test(value)) {
    return [
      {
        path: configPath,
        message: `${label} must not contain a variable template`,
      },
    ];
  }
  const segments = value.startsWith('./') ? value.slice(2).split('/') : [];
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment.includes('\\'),
    ) ||
    path.posix.extname(value) !== '' ||
    /[?#\0]/.test(value)
  ) {
    return [
      {
        path: configPath,
        message: `${label} must be an extensionless package-relative specifier starting with "./"`,
      },
    ];
  }
  return [];
}
