import clientPlugins from '../../client/plugins.js';
// @vitest-environment node

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import tailwindConfig, { contentFilesIn } from '../../tailwind.config.mjs';

const appRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../..',
);

describe('tailwind content sources', () => {
  const content = tailwindConfig.content as string[];

  it('scans the client files of every enabled plugin', () => {
    const plugins = clientPlugins.plugins.map((plugin) =>
      plugin.packageName.slice('@nocobase/'.length),
    );

    expect(plugins.length).toBeGreaterThan(0);

    // A plugin with no client surface contributes no files, so only those that ship one are required to appear.
    const withClient = plugins.filter((plugin) =>
      ['client', 'dist/client'].some((directory) =>
        existsSync(
          path.join(appRoot, 'node_modules/@nocobase', plugin, directory),
        ),
      ),
    );
    expect(withClient.length).toBeGreaterThan(0);

    for (const plugin of withClient) {
      expect(
        content.some((file) => file.includes(plugin)),
        `${plugin} contributes no scanned files; its utility classes would be missing from the stylesheet`,
      ).toBe(true);
    }
  });

  it('resolves past the symlinks pnpm installs dependencies as', () => {
    // The bug this guards: a wildcard `@source` matches nothing through a pnpm symlink, so every path here must be a
    // real one that exists. An empty list would mean the whole mechanism silently stopped working.
    expect(content.length).toBeGreaterThan(0);
    for (const file of content.slice(0, 20)) {
      expect(path.isAbsolute(file)).toBe(true);
      expect(existsSync(file)).toBe(true);
    }

    // Every file must be its canonical path rather than a path that only reaches the file through a package symlink.
    // pnpm's canonical store path legitimately contains a nested `node_modules/@nocobase` segment.
    for (const file of content) {
      expect(file).toBe(realpathSync(file));
    }
  });

  it('scans build output the same way, which is the layout an installed plugin has', () => {
    // The original failure was invisible in this repository, where plugins expose TypeScript sources, and only showed
    // up in a generated application, where they ship `dist/client`. `dist` is a build artefact that a clean checkout
    // does not have, so rather than requiring one, this drives the configuration's own resolution over a fixture
    // laid out the way pnpm lays out an installed package: a symlink into a store directory.
    const store = mkdtempSync(path.join(tmpdir(), 'nb3-tailwind-'));
    try {
      const installed = path.join(
        store,
        'store/app-plugin-fixture/dist/client',
      );
      mkdirSync(installed, { recursive: true });
      writeFileSync(
        path.join(installed, 'page.js'),
        'export const cls = "mt-[77px]";',
      );

      const scope = path.join(store, 'node_modules/@nocobase');
      mkdirSync(scope, { recursive: true });
      symlinkSync(
        path.join(store, 'store/app-plugin-fixture'),
        path.join(scope, 'app-plugin-fixture'),
        'junction',
      );

      const files = contentFilesIn(store);

      expect(files).toHaveLength(1);
      expect(files[0]).toBe(path.join(realpathSync(installed), 'page.js'));
      expect(files[0]).toBe(realpathSync(files[0]));
    } finally {
      rmSync(store, { recursive: true, force: true });
    }
  });

  it('scans canonical Registry source exposed by a plugin', () => {
    const store = mkdtempSync(path.join(tmpdir(), 'nb3-tailwind-registry-'));
    try {
      const registry = path.join(
        store,
        'store/app-plugin-fixture/registry/example',
      );
      mkdirSync(registry, { recursive: true });
      writeFileSync(
        path.join(registry, 'demo.tsx'),
        'export const cls = "xl:grid-cols-5";',
      );

      const scope = path.join(store, 'node_modules/@nocobase');
      mkdirSync(scope, { recursive: true });
      symlinkSync(
        path.join(store, 'store/app-plugin-fixture'),
        path.join(scope, 'app-plugin-fixture'),
        'junction',
      );

      const files = contentFilesIn(store);

      expect(files).toContain(path.join(realpathSync(registry), 'demo.tsx'));
    } finally {
      rmSync(store, { recursive: true, force: true });
    }
  });

  it('is wired into the stylesheet, without the wildcard sources it replaced', () => {
    const styles = readFileSync(
      path.join(appRoot, 'client/styles.css'),
      'utf8',
    );

    expect(styles).toContain('@config "../tailwind.config.mjs"');
    expect(styles).not.toContain('app-plugin-*');
  });

  it('is published, so a generated application has the file @config points at', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(appRoot, 'package.json'), 'utf8'),
    ) as { files?: string[] };

    expect(packageJson.files).toContain('tailwind.config.mjs');
  });
});
