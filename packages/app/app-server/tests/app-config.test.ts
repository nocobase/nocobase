import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { objectProvider } from '@nocobase/config/providers/object';
import {
  environmentProvider,
  envInteger,
} from '@nocobase/config/providers/env';
import { AppConfig } from '../src/config/index.js';

const directories: string[] = [];
function directory(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'app-config-'));
  directories.push(root);
  return root;
}
afterEach(() =>
  directories
    .splice(0)
    .forEach((root) => rmSync(root, { recursive: true, force: true })),
);

describe('AppConfig', () => {
  it('defers load diagnostics to the configured logger without writing CLI output', async () => {
    const output = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const debug = vi.fn();
    try {
      const config = new AppConfig();
      await config.loadAll();
      expect(output).not.toHaveBeenCalled();
      config.setLogger({ debug });
      expect(debug).toHaveBeenCalledWith(
        { durationMs: expect.any(Number) },
        'App configuration loaded',
      );
      await config.reload();
      expect(debug).toHaveBeenCalledWith(
        { changedNamespaces: [], durationMs: expect.any(Number) },
        'App configuration reloaded',
      );
      expect(output).not.toHaveBeenCalled();
    } finally {
      output.mockRestore();
    }
  });
  it.each([
    ['json', '{"feature":{"label":"file"}}'],
    ['yml', 'feature:\n  label: file\n'],
    ['yaml', 'feature:\n  label: file\n'],
    ['toml', '[feature]\nlabel = "file"\n'],
  ])('loads %s files', async (extension, content) => {
    const file = path.join(directory(), `config.${extension}`);
    writeFileSync(file, content);
    const config = new AppConfig().loadFile(file);
    await config.loadAll();
    expect(config.get('feature.label')).toBe('file');
  });

  it('prefers YAML when resolving an extensionless filename', async () => {
    const file = path.join(directory(), 'config');
    writeFileSync(file + '.toml', 'label = "toml"');
    writeFileSync(file + '.yaml', 'label: yaml');
    const config = new AppConfig().loadFile(file);
    await config.loadAll();
    expect(config.get('label')).toBe('yaml');
  });

  it('supports missing optional files and rejects missing required files', async () => {
    const file = path.join(directory(), 'config.toml');
    const config = new AppConfig().loadFile(file, { optional: true });
    await config.loadAll();
    config.mergeDefaults({ feature: { enabled: true } });
    expect(config.get('feature.enabled')).toBe(true);
    await expect(new AppConfig().loadFile(file).loadAll()).rejects.toThrow();
    expect(() => new AppConfig().loadFile('config.ini')).toThrow('Unsupported');
  });

  /** The merged result cannot tell a key the application knows from one only a file ever set — the layers can. */
  it('exposes the defaults and the source values as separate read-only layers', async () => {
    const file = path.join(directory(), 'config.yml');
    writeFileSync(file, 'feature:\n  port: 2000\ndatabse:\n  typo: true\n');
    const config = new AppConfig().loadFile(file);
    await config.loadAll();
    config.mergeDefaults({ feature: { port: 1000, label: 'default' } });

    const layers = config.layers();
    expect(Object.keys(layers.defaults)).toEqual(['feature']);
    expect(Object.keys(layers.overrides).sort()).toEqual([
      'databse',
      'feature',
    ]);
    expect(layers.overrides).toMatchObject({ feature: { port: 2000 } });

    // Copies: changing one does not reach the configuration it was taken from.
    (layers.overrides.feature as { port: number }).port = 9;
    expect(config.get('feature.port')).toBe(2000);
  });

  it('merges code defaults below file and explicit environment sources and reloads them', async () => {
    const file = path.join(directory(), 'config.toml');
    writeFileSync(file, '[feature]\nport=2000\nlabel="file"');
    const env: Record<string, string | undefined> = { APP_TEST_PORT: '3000' };
    const config = new AppConfig().loadFile(file).load(
      environmentProvider(env, {
        mappings: { APP_TEST_PORT: envInteger('feature.port') },
      }),
    );
    await config.loadAll();
    const callback = vi.fn();
    config.mergeDefaults({
      feature: { port: 1000, label: 'code', callback, items: ['a'] },
    });
    expect(config.get('feature.port')).toBe(3000);
    expect(config.get('feature.label')).toBe('file');
    const listener = vi.fn();
    const unsubscribe = config.subscribe('feature', listener);
    delete env.APP_TEST_PORT;
    writeFileSync(file, '[feature]\nitems=["b"]');
    expect(await config.reload()).toEqual({ changedNamespaces: ['feature'] });
    expect(config.get('feature.port')).toBe(1000);
    expect(config.get('feature.label')).toBe('code');
    expect(config.get('feature.items')).toEqual(['b']);
    expect(config.get('feature.callback')).toBe(callback);
    expect(listener).toHaveBeenCalledOnce();
    expect(await config.reload()).toEqual({ changedNamespaces: [] });
    unsubscribe();
    writeFileSync(file, '[feature]\nlabel="later"');
    await config.reload();
    expect(listener).toHaveBeenCalledOnce();
  });

  it('preserves the last configuration when a reload cannot parse its source', async () => {
    const file = path.join(directory(), 'config.json');
    writeFileSync(file, '{"value":1}');
    const config = new AppConfig().loadFile(file);
    await config.loadAll();
    writeFileSync(file, '{ invalid');
    await expect(config.reload()).rejects.toThrow();
    expect(config.get('value')).toBe(1);
  });

  it('does not implicitly load process environment', async () => {
    vi.stubEnv('AUTH_SECRET', 'not-an-implicit-source');
    try {
      const config = new AppConfig();
      await config.loadAll();
      expect(config.raw()).toEqual({});
      expect(() => config.load(objectProvider({ value: 1 }))).toThrow(
        'after loading',
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
