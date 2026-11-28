import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { resolveAppRuntime } from '@nocobase/app-client/runtime';

import clientPlugins from '../../client/plugins.js';
import appRuntime from '../../client/runtime.js';

const appRoot = path.resolve(import.meta.dirname, '../..');

interface AppPackageJson {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const appPackage = JSON.parse(
  readFileSync(path.join(appRoot, 'package.json'), 'utf8'),
) as AppPackageJson;

const registeredClientPackages = clientPlugins.plugins.map(
  (plugin) => plugin.packageName,
);

describe('client plugin registry consistency', () => {
  it('loads Repository audit labels when the viewer switches language', async () => {
    const { i18n } = await resolveAppRuntime(appRuntime);
    const namespace = '@nocobase/audit';
    const name = () =>
      i18n.getFixedT(namespace)('audit.operations.createOne', {
        defaultValue: 'Stored operation name',
      });

    expect(name()).toBe('Create a record');
    expect(i18n.i18n.hasResourceBundle('zh-CN', namespace)).toBe(false);
    await i18n.changeLanguage('zh-CN');
    expect(name()).toBe('创建记录');
    await i18n.changeLanguage('en-US');
    expect(name()).toBe('Create a record');
  });

  it('declares every client plugin as a dependency', () => {
    const undeclared = registeredClientPackages.filter(
      (packageName) =>
        appPackage.devDependencies?.[packageName] === undefined &&
        appPackage.dependencies?.[packageName] === undefined,
    );

    expect(undeclared).toEqual([]);
  });

  it('registers no package twice', () => {
    expect(new Set(registeredClientPackages).size).toBe(
      registeredClientPackages.length,
    );
  });
});
