/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const execa = require('execa');
const crypto = require('crypto');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { discoverPortalRegistryPackages, selectPortalRegistryEntries } = require('./config');

const REGISTRY_SCHEMA = 'https://ui.shadcn.com/schema/registry.json';
const MANIFEST_SCHEMA_VERSION = 1;

function createDigest(content) {
  return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
}

function getPluginSourceName(packageName) {
  return packageName
    .replace(/^@/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function createRegistryDocument(registries, snapshotRoot) {
  const items = [];

  for (const registry of registries) {
    const sourceName = getPluginSourceName(registry.plugin.packageName);

    for (const item of registry.config.items) {
      const sourceTarget = path.resolve(snapshotRoot, 'sources', sourceName, item.name);
      fs.ensureDirSync(sourceTarget);
      for (const file of item.files) {
        const sourceFile = path.resolve(registry.sourceRoot, item.source, file);
        const targetFile = path.resolve(sourceTarget, file);
        fs.ensureDirSync(path.dirname(targetFile));
        fs.copyFileSync(sourceFile, targetFile);
      }

      const { include, source, target, files, ...registryItem } = item;
      items.push({
        ...registryItem,
        files: files.map((file) => ({
          path: path.posix.join('sources', sourceName, item.name, file),
          type: 'registry:file',
          target: path.posix.join(target, file),
        })),
      });
    }
  }

  return {
    $schema: REGISTRY_SCHEMA,
    name: 'nocobase',
    homepage: 'https://www.nocobase.com',
    items,
  };
}

async function runShadcnBuild({ cwd, registryPath, outputPath }) {
  const shadcnBin = require.resolve('shadcn', { paths: [cwd] });
  await execa(process.execPath, [shadcnBin, 'build', path.basename(registryPath), '-o', outputPath], {
    cwd: path.dirname(registryPath),
    stdio: 'inherit',
  });
}

function createPluginManifest(registry, digests) {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    packageName: registry.plugin.packageName,
    packageVersion: registry.packageVersion,
    items: registry.config.items.map((item) => ({
      name: item.name,
      type: item.type,
      title: item.title,
      description: item.description,
      file: `${item.name}.json`,
      digest: digests.get(item.name),
    })),
  };
}

async function writePluginOutputs(registries, builtOutputPath) {
  const builtItems = new Map();
  for (const registry of registries) {
    for (const item of registry.config.items) {
      const builtItemPath = path.resolve(builtOutputPath, `${item.name}.json`);
      if (!(await fs.pathExists(builtItemPath))) {
        throw new Error(`shadcn did not generate portal Registry item '${item.name}'`);
      }
      const content = await fs.readFile(builtItemPath);
      builtItems.set(item.name, {
        content,
        digest: createDigest(content),
      });
    }
  }

  for (const registry of registries) {
    const outputPath = path.resolve(registry.plugin.resolvedPath, 'dist/portal-registry');
    const outputParent = path.dirname(outputPath);
    await fs.ensureDir(outputParent);
    const temporaryOutputPath = await fs.mkdtemp(path.resolve(outputParent, '.portal-registry-'));

    try {
      for (const item of registry.config.items) {
        await fs.writeFile(path.resolve(temporaryOutputPath, `${item.name}.json`), builtItems.get(item.name).content);
      }

      const digests = new Map(registry.config.items.map((item) => [item.name, builtItems.get(item.name).digest]));
      await fs.writeJson(path.resolve(temporaryOutputPath, 'manifest.json'), createPluginManifest(registry, digests), {
        spaces: 2,
      });
      await fs.remove(outputPath);
      await fs.move(temporaryOutputPath, outputPath);
    } finally {
      await fs.remove(temporaryOutputPath);
    }
  }
}

function isPathInside(parentPath, candidatePath) {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

async function cleanStalePluginOutputs({ cwd, plugins, registries }) {
  const registryPluginPaths = new Set(registries.map((registry) => path.resolve(registry.plugin.resolvedPath)));
  const editableRoots = [
    path.resolve(cwd, 'packages/plugins'),
    path.resolve(cwd, 'packages/pro-plugins'),
    path.resolve(cwd, 'storage/plugins'),
  ];

  for (const plugin of plugins) {
    const pluginPath = path.resolve(plugin.resolvedPath);
    if (registryPluginPaths.has(pluginPath) || !editableRoots.some((root) => isPathInside(root, pluginPath))) {
      continue;
    }
    await fs.remove(path.resolve(pluginPath, 'dist/portal-registry'));
  }
}

async function buildPortalRegistries(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  let plugins;
  let registries;
  if (options.registries) {
    registries = selectPortalRegistryEntries(options.registries, options.packageSelectors, cwd);
    plugins = registries.map((registry) => registry.plugin);
  } else {
    const discovery = await discoverPortalRegistryPackages({ cwd, packageSelectors: options.packageSelectors });
    plugins = discovery.plugins;
    registries = discovery.registries;
  }

  await cleanStalePluginOutputs({ cwd, plugins, registries });
  if (registries.length === 0) {
    return { pluginCount: 0, itemCount: 0 };
  }

  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-portal-registry-'));
  const registryPath = path.resolve(temporaryRoot, 'registry.json');
  const builtOutputPath = path.resolve(temporaryRoot, 'r');

  try {
    const document = createRegistryDocument(registries, temporaryRoot);
    await fs.writeJson(registryPath, document, { spaces: 2 });
    await (options.runShadcnBuild || runShadcnBuild)({
      cwd,
      registryPath,
      outputPath: builtOutputPath,
    });
    await writePluginOutputs(registries, builtOutputPath);

    return {
      pluginCount: registries.length,
      itemCount: document.items.length,
    };
  } finally {
    await fs.remove(temporaryRoot);
  }
}

module.exports = {
  MANIFEST_SCHEMA_VERSION,
  REGISTRY_SCHEMA,
  buildPortalRegistries,
  createPluginManifest,
  createDigest,
  createRegistryDocument,
  getPluginSourceName,
  runShadcnBuild,
  writePluginOutputs,
};
