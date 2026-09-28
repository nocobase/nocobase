import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { loadAppCommands, loadAppPlugins } from '../src/runtime/application.ts';
import { discoverCommandFiles } from '../src/runtime/discover.ts';
import { appAt, locateApp } from '../src/runtime/location.ts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function fixture(manifest: Record<string, unknown>): string {
  const root = mkdtempSync(path.join(os.tmpdir(), 'app-cli-location-'));
  roots.push(root);
  writeFileSync(path.join(root, 'package.json'), JSON.stringify(manifest));
  return root;
}

function write(root: string, relative: string, contents: string): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

const COMMAND = (message: string): string => `
export default class Fixture {
  static summary = ${JSON.stringify(message)};
  static async run() {}
}
`;

describe('locating the application', () => {
  it('recognizes a source checkout by nocobase.templateKind, from a nested directory', () => {
    const root = fixture({
      name: 'crm',
      nocobase: { templateKind: 'app' },
    });
    mkdirSync(path.join(root, 'server', 'jobs'), { recursive: true });

    expect(locateApp(path.join(root, 'server', 'jobs'))).toEqual({
      kind: 'source',
      root,
    });
  });

  it('recognizes a built dist by nocobase.buildTarget', () => {
    const root = fixture({
      name: 'crm',
      nocobase: { templateKind: 'app', buildTarget: { platform: 'linux' } },
    });

    expect(appAt(root)).toEqual({
      kind: 'deployment',
      root,
    });
  });

  it('treats a package without a nocobase field as no application', () => {
    const root = fixture({ name: '@acme/app-plugin-reports' });

    expect(locateApp(root)).toEqual({ kind: 'none', root });
  });

  it('decides by the nearest package.json, not by an application further up', () => {
    const root = fixture({ name: 'crm', nocobase: { templateKind: 'app' } });
    write(root, 'vendor/tool/package.json', JSON.stringify({ name: 'tool' }));

    expect(locateApp(path.join(root, 'vendor', 'tool')).kind).toBe('none');
  });
});

describe("loading the application's contributions", () => {
  it('registers cli/commands by path and skips helpers', async () => {
    const root = fixture({
      name: 'crm',
      nocobase: { templateKind: 'app', buildTarget: {} },
    });
    write(root, 'cli/commands/sync-orders.js', COMMAND('Sync orders.'));
    write(root, 'cli/commands/orders/export.js', COMMAND('Export orders.'));
    write(root, 'cli/commands/orders/lib/format.js', 'export {};\n');
    write(root, 'cli/commands/_shared.js', 'export {};\n');
    write(root, 'cli/commands/orders/export.d.ts', 'export {};\n');

    const commands = await loadAppCommands(appAt(root));

    expect(Object.keys(commands).sort()).toEqual([
      'orders:export',
      'sync-orders',
    ]);
    expect(commands['sync-orders']?.summary).toBe('Sync orders.');
  });

  it('names the file when a command file exports no command', async () => {
    const root = fixture({
      name: 'crm',
      nocobase: { templateKind: 'app', buildTarget: {} },
    });
    write(root, 'cli/commands/broken.js', 'export const nothing = 1;\n');

    await expect(loadAppCommands(appAt(root))).rejects.toThrow(
      /broken\.js must default-export an oclif Command class to answer to "broken"/,
    );
  });

  it('has no plugins and no commands when the files are absent', async () => {
    const root = fixture({
      name: 'crm',
      nocobase: { templateKind: 'app', buildTarget: {} },
    });

    await expect(loadAppPlugins(appAt(root))).resolves.toBeUndefined();
    await expect(loadAppCommands(appAt(root))).resolves.toEqual({});
  });

  it('finds no command files in a directory that does not exist', async () => {
    await expect(
      discoverCommandFiles(path.join(os.tmpdir(), 'app-cli-missing'), '.js'),
    ).resolves.toEqual({});
  });
});
