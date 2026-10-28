import { validateMailConfiguration } from './mail.js';
import type { ConfigMap } from '@nocobase/config';

import type {
  AppConfigRules,
  ConfigIssueOptions,
  ConfigValidationContext,
  ConfigValidator,
} from './define-app-config.js';

export interface ConfigIssue {
  readonly level: 'error' | 'warning';
  /** The full path, such as `auth.emailAndPassword.disableSignUp`. */
  readonly path: string;
  readonly message: string;
  readonly fix?: string;
}

/**
 * The configuration breaks a rule its sections declare.
 *
 * Carries every issue found, warnings included, so a caller can report all of them at once rather than one per start.
 * Recognised by `name` as well as by class, so a second copy of this package in the process is still recognised.
 */
export class AppConfigInvalidError extends Error {
  public readonly issues: readonly ConfigIssue[];

  public constructor(issues: readonly ConfigIssue[]) {
    super(formatConfigIssues(issues));
    this.name = 'AppConfigInvalidError';
    this.issues = issues;
  }
}

/** Whether `error`, or anything in its cause chain, is an {@link AppConfigInvalidError}. */
export function findAppConfigInvalid(
  error: unknown,
): AppConfigInvalidError | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
    if (
      current instanceof AppConfigInvalidError ||
      current.name === 'AppConfigInvalidError'
    )
      return current as AppConfigInvalidError;
    current = current.cause;
  }
  return undefined;
}

export function formatConfigIssues(issues: readonly ConfigIssue[]): string {
  const errors = issues.filter((issue) => issue.level === 'error');
  const lines = errors.map(
    (issue) =>
      `  ✖ ${issue.path}  ${issue.message}${issue.fix ? `\n      ${issue.fix}` : ''}`,
  );
  return ['Application configuration is invalid:', ...lines].join('\n');
}

/**
 * Runs every section's validators against the merged configuration, and checks each section's public paths.
 *
 * Issues are collected rather than thrown, so one run reports everything that is wrong.
 */
export async function validateConfigSections(
  current: ConfigMap,
  overrides: ConfigMap,
  sections: ReadonlyMap<string, AppConfigRules>,
): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = validateMailConfiguration(current);
  for (const [section, rules] of sections) {
    issues.push(...publicPathIssues(current, section, rules.public));
    const value = readPath(current, [section]);
    const context = createValidationContext(section, overrides, issues);
    for (const validator of rules.validators) {
      try {
        await (validator as ConfigValidator<unknown>)(value ?? {}, context);
      } catch (error) {
        issues.push({
          level: 'error',
          path: section,
          message: `validation failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  }
  return issues;
}

/**
 * The values sections publish, nested under their section name. A path with no value is left out, so the browser
 * sees `undefined` and falls back to its own default.
 */
export function collectPublicConfig(
  current: ConfigMap,
  sections: ReadonlyMap<string, AppConfigRules>,
): ConfigMap {
  const output: Record<string, unknown> = {};
  for (const [section, rules] of sections) {
    for (const relative of rules.public) {
      if (!relative || !isValidPublicPath(relative)) continue;
      const segments = [section, ...splitPath(relative)];
      const value = readPath(current, segments);
      if (value === undefined || !isPublishableLeaf(value)) continue;
      writePath(output, segments, value);
    }
  }
  return output as ConfigMap;
}

/** Every published path, in full, such as `auth.emailAndPassword.disableSignUp`. */
export function listPublicPaths(
  sections: ReadonlyMap<string, AppConfigRules>,
): string[] {
  return [...sections].flatMap(([section, rules]) =>
    rules.public.map((relative) => `${section}.${relative}`),
  );
}

function createValidationContext(
  section: string,
  overrides: ConfigMap,
  issues: ConfigIssue[],
): ConfigValidationContext {
  const push = (
    level: ConfigIssue['level'],
    path: string,
    message: string,
    options: ConfigIssueOptions = {},
  ): void => {
    issues.push({
      level,
      path: path ? `${section}.${path}` : section,
      message,
      ...(options.fix ? { fix: options.fix } : {}),
    });
  };
  return {
    error: (path, message, options) => push('error', path, message, options),
    warning: (path, message, options) =>
      push('warning', path, message, options),
    isUserProvided: (path) =>
      readPath(overrides, [section, ...splitPath(path)]) !== undefined,
  };
}

function publicPathIssues(
  current: ConfigMap,
  section: string,
  paths: readonly string[],
): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  for (const relative of paths) {
    const full = relative ? `${section}.${relative}` : section;
    if (!relative) {
      issues.push({
        level: 'error',
        path: section,
        message:
          'cannot be published as a whole: name each field to expose instead.',
      });
      continue;
    }
    if (!isValidPublicPath(relative)) {
      issues.push({
        level: 'error',
        path: full,
        message: 'is not a valid public path.',
      });
      continue;
    }
    const value = readPath(current, [section, ...splitPath(relative)]);
    if (value === undefined) continue;
    if (typeof value === 'function' || !isPublishableLeaf(value)) {
      issues.push({
        level: 'error',
        path: full,
        message: isPlainObject(value)
          ? 'cannot be published: name each field to expose instead of the whole object.'
          : 'cannot be published: only plain values can reach the browser.',
      });
    }
  }
  return issues;
}

function isPublishableLeaf(value: unknown): boolean {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true;
  }
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item === null ||
        typeof item === 'string' ||
        typeof item === 'boolean' ||
        (typeof item === 'number' && Number.isFinite(item)),
    )
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

const FORBIDDEN_SEGMENTS: ReadonlySet<string> = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);

function splitPath(path: string): string[] {
  return path ? path.split('.') : [];
}

function isValidPublicPath(path: string): boolean {
  return splitPath(path).every(
    (segment) => segment !== '' && !FORBIDDEN_SEGMENTS.has(segment),
  );
}

function readPath(root: ConfigMap, segments: readonly string[]): unknown {
  let value: unknown = root;
  for (const segment of segments) {
    if (!isPlainObject(value) || !Object.hasOwn(value, segment)) {
      return undefined;
    }
    value = value[segment];
  }
  return value;
}

function writePath(
  root: Record<string, unknown>,
  segments: readonly string[],
  value: unknown,
): void {
  let target = root;
  for (const segment of segments.slice(0, -1)) {
    const existing = target[segment];
    if (isPlainObject(existing)) {
      target = existing;
    } else {
      const child: Record<string, unknown> = {};
      target[segment] = child;
      target = child;
    }
  }
  target[segments[segments.length - 1]] = value;
}
