// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import enUS from '../../client/pages/reference/locales/en-US.ts';
import zhCN from '../../client/pages/reference/locales/zh-CN.ts';

const clientDirectory = fileURLToPath(new URL('../../client', import.meta.url));
const referenceDirectory = path.join(clientDirectory, 'pages', 'reference');

/**
 * Every addressable key of a locale, as the dot-separated path `t()` is called with.
 *
 * The resources are written as nested groups, so a key only exists once the leaves under it do; flattening both
 * locales here is what lets the reference pages be checked against the wording rather than against the source
 * locale's type alone, where a Chinese page would keep its English fallback silently.
 */
function translationKeys(
  resource: Record<string, unknown>,
  prefix = '',
): string[] {
  return Object.entries(resource).flatMap(([key, value]) => {
    const keyPath = prefix ? prefix + '.' + key : key;
    return value && typeof value === 'object'
      ? translationKeys(value as Record<string, unknown>, keyPath)
      : [keyPath];
  });
}

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return /\.tsx?$/u.test(entry.name) ? [entryPath] : [];
  });
}

/** The namespaces the locale declares, so a dotted string that is none of them is not read as a key. */
const namespaces = new Set(Object.keys(enUS as Record<string, unknown>));

/** A dotted string literal, which is how a page spells a key whether it hands it to `t()` or holds it in data. */
const quotedKey = /'([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)'/gu;

/**
 * A key a page completes at runtime, such as the status label of the orders table: only its prefix is static.
 *
 * The capture is lazy because a key can interpolate more than once — the product form reads
 * `errors.${field}.${code}` — and a greedy one would run to the last `${` and take a literal `${field}` into the
 * prefix, which matches no key and reports the family as missing.
 */
const interpolatedKey = /\bt\(\s*\x60([^\x60]*?)\x24\{/gu;

interface References {
  readonly file: string;
  /** The keys the file names outright. */
  readonly keys: readonly string[];
  /** The prefixes of the keys the file completes at runtime. */
  readonly prefixes: readonly string[];
}

/**
 * The keys the reference pages ask for, with the file that asks for them.
 *
 * Reading every dotted literal rather than the first argument of `t()` is what covers a whole page: a page holds
 * `titleKey: 'components.checkbox.addOnSupport'` in data so that `t(addOn.titleKey)` can reach it later, which is
 * not a literal argument to `t()` there. A dotted string counts as a key only when its root is a namespace the
 * locale declares, which is what keeps a file path or a domain name out of the scan.
 */
function referencedKeys(): References[] {
  const files = sourceFiles(referenceDirectory);
  return files.map((file) => {
    const keys = new Set<string>();
    const prefixes = new Set<string>();
    const lines = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => !/^\s*\/\//u.test(line));
    for (const line of lines) {
      for (const match of line.matchAll(quotedKey)) {
        if (namespaces.has(match[1].split('.')[0])) keys.add(match[1]);
      }
      for (const match of line.matchAll(interpolatedKey)) {
        if (namespaces.has(match[1].split('.')[0])) prefixes.add(match[1]);
      }
    }
    return {
      file: path.relative(clientDirectory, file),
      keys: [...keys].sort(),
      prefixes: [...prefixes].sort(),
    };
  });
}

describe('reference page translations', () => {
  const references = referencedKeys();
  const english = new Set(translationKeys(enUS));
  const chinese = new Set(translationKeys(zhCN));

  const missing = (written: ReadonlySet<string>): string[] =>
    references.flatMap(({ file, keys }) =>
      keys
        .filter((key) => !written.has(key))
        .map((key) => key + ' (' + file + ')'),
    );

  const missingFamilies = (written: ReadonlySet<string>): string[] =>
    references
      .flatMap(({ prefixes }) => prefixes)
      .filter((prefix) => ![...written].some((key) => key.startsWith(prefix)));

  it('reads the keys of every reference page', () => {
    // Guards the scan itself: a regex that quietly stops matching would turn this suite into a no-op.
    const named = references.reduce(
      (total, { keys }) => total + keys.length,
      0,
    );
    expect(named).toBeGreaterThan(700);
    expect(references.length).toBeGreaterThan(70);
  });

  it('translates every key the reference pages use into English', () => {
    expect(missing(english)).toEqual([]);
  });

  it('translates every key the reference pages use into Chinese', () => {
    expect(missing(chinese)).toEqual([]);
  });

  it('translates the keys the reference pages complete at runtime', () => {
    expect(
      references.flatMap(({ prefixes }) => prefixes).length,
    ).toBeGreaterThan(0);
    expect(missingFamilies(english)).toEqual([]);
    expect(missingFamilies(chinese)).toEqual([]);
  });
});
