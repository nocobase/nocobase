import fs from 'fs-extra';
import path from 'path';
import PresetNocoBase from '../index';

const nodeModulesPath = path.resolve(process.cwd(), 'node_modules_test');
const presetSource = path.resolve(process.cwd(), 'packages/presets/nocobase');
const presetLink = path.join(nodeModulesPath, '@nocobase', 'preset-nocobase');

describe('getLocalPlugins', () => {
  const originalNodeModulesPath = process.env.NODE_MODULES_PATH;

  beforeAll(async () => {
    process.env.NODE_MODULES_PATH = nodeModulesPath;
    await fs.ensureDir(path.dirname(presetLink));
    try {
      await fs.remove(presetLink);
    } catch (e) {
      // ignore
    }
    await fs.symlink(presetSource, presetLink, 'dir');
  });

  afterAll(async () => {
    process.env.NODE_MODULES_PATH = originalNodeModulesPath;
    await fs.remove(nodeModulesPath);
  });

  it('should discover local plugins', async () => {
    const preset = new PresetNocoBase({} as any);
    const plugins = await preset.getLocalPlugins();
    const names = plugins.map((p) => p[0]);
    expect(names.length).toBeGreaterThan(0);
    expect(names).toContain('api-doc');
  });
});
