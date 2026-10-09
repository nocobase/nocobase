// @vitest-environment node
// Reads the registry and runs `shadcn build`; nothing here renders.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

interface RegistryFile {
  readonly path: string;
  readonly type: string;
  readonly target: string;
  readonly content?: string;
}

interface RegistryItem {
  readonly name: string;
  readonly type: string;
  readonly dependencies?: readonly string[];
  readonly registryDependencies?: readonly string[];
  readonly files: readonly RegistryFile[];
}

interface Declared {
  readonly item: RegistryItem;
  /** The directory its `registry.json` sits in, which every `path` is relative to. */
  readonly base: string;
}

const libraryRoot = fileURLToPath(new URL('../..', import.meta.url));

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

const declared: Declared[] = readJson<{ include: string[] }>(
  path.join(libraryRoot, 'registry.json'),
).include.flatMap((include) => {
  const file = path.join(libraryRoot, include);
  return readJson<{ items: RegistryItem[] }>(file).items.map((item) => ({
    item,
    base: path.dirname(file),
  }));
});
const installable = declared.filter(
  ({ item }) => item.type !== 'registry:example',
);
const examples = declared.filter(
  ({ item }) => item.type === 'registry:example',
);

/** `#<target without client/ and extension>`: how an application imports a file an item installed. */
const importPath = (target: string): string =>
  `#${target.replace(/^client\//u, '').replace(/\.tsx?$/u, '')}`;

const packageName = (dependency: string): string =>
  dependency.slice(0, dependency.lastIndexOf('@'));

function importsOf(source: string): string[] {
  return [...source.matchAll(/from\s+'([^']+)'/gu)].map((match) => match[1]!);
}

describe('example items', () => {
  it.each(installable.map(({ item }) => item.name))(
    'publishes %s-demo',
    (name) => {
      const example = examples.find(({ item }) => item.name === `${name}-demo`);
      expect(
        example,
        `declare ${name}-demo in website/demo/registry.json`,
      ).toBeDefined();
      expect(example!.item.registryDependencies).toContain(`@nocobase/${name}`);
      for (const file of example!.item.files) {
        expect(file.type).toBe('registry:example');
        expect(file.target).toBe(
          `client/extensions/nocobase-${name}-demo/${path.basename(file.path)}`,
        );
      }
    },
  );

  it('names every example after an item', () => {
    const names = new Set(installable.map(({ item }) => item.name));
    for (const { item } of examples)
      expect(names.has(item.name.replace(/-demo$/u, ''))).toBe(true);
  });

  // An example is installed or read on its own, so every import has to reach what it declares: its own files, the
  // primitives and items in registryDependencies, and the packages in dependencies.
  it.each(examples.map(({ item }) => item.name))(
    '%s imports only what it declares',
    (name) => {
      const { item, base } = examples.find(
        (example) => example.item.name === name,
      )!;
      const own = new Set(item.files.map((file) => path.join(base, file.path)));
      const registryDependencies = new Set(item.registryDependencies);
      const packages = new Set((item.dependencies ?? []).map(packageName));
      const installedBy = new Map<string, string[]>();
      for (const { item: owner } of installable)
        for (const file of owner.files) {
          const key = importPath(file.target);
          installedBy.set(key, [...(installedBy.get(key) ?? []), owner.name]);
        }
      for (const file of item.files) {
        const absolute = path.join(base, file.path);
        for (const specifier of importsOf(readFileSync(absolute, 'utf8'))) {
          if (specifier.startsWith('.')) {
            const resolved = path
              .resolve(path.dirname(absolute), specifier)
              .replace(/\.js$/u, '');
            expect(
              ['.tsx', '.ts'].some((extension) =>
                own.has(`${resolved}${extension}`),
              ),
              `${file.path} imports ${specifier}`,
            ).toBe(true);
          } else if (specifier.startsWith('#components/ui/')) {
            expect(registryDependencies).toContain(
              specifier.slice('#components/ui/'.length),
            );
          } else if (specifier.startsWith('#')) {
            // A shared file, such as use-route-overlay, is installed by more than one item; any of them will do.
            const owners = installedBy.get(specifier) ?? [];
            expect(
              owners.some((owner) =>
                registryDependencies.has(`@nocobase/${owner}`),
              ),
              `${file.path} imports ${specifier}`,
            ).toBe(true);
          } else if (specifier !== 'react') {
            const bare = specifier.startsWith('@')
              ? specifier.split('/').slice(0, 2).join('/')
              : specifier.split('/')[0]!;
            expect(packages, `${file.path} imports ${specifier}`).toContain(
              bare,
            );
          }
        }
      }
    },
  );
});

describe('registry:build', () => {
  let output: string;

  beforeAll(() => {
    output = mkdtempSync(path.join(tmpdir(), 'nocobase-ui-library-'));
    execFileSync(
      path.join(libraryRoot, 'node_modules/.bin/shadcn'),
      ['build', 'registry.json', '--output', output],
      { cwd: libraryRoot, stdio: 'pipe' },
    );
  }, 120_000);

  afterAll(() => rmSync(output, { force: true, recursive: true }));

  it('lists every item and example in the index', () => {
    const index = readJson<{ items: RegistryItem[] }>(
      path.join(output, 'registry.json'),
    );
    expect(index.items.map((item) => item.name).sort()).toEqual(
      declared.map(({ item }) => item.name).sort(),
    );
  });

  it.each(examples.map(({ item }) => item.name))(
    'emits %s with its files inlined',
    (name) => {
      const built = readJson<RegistryItem>(path.join(output, `${name}.json`));
      const { item, base } = examples.find(
        (example) => example.item.name === name,
      )!;
      expect(built.type).toBe('registry:example');
      expect(built.registryDependencies).toEqual(item.registryDependencies);
      expect(built.files.map((file) => file.target)).toEqual(
        item.files.map((file) => file.target),
      );
      for (const [index, file] of item.files.entries())
        expect(built.files[index]!.content).toBe(
          readFileSync(path.join(base, file.path), 'utf8'),
        );
    },
  );
});
