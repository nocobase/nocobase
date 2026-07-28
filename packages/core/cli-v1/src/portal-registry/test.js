/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const execa = require('execa');
const fs = require('fs-extra');
const http = require('http');
const path = require('path');
const { buildPortalRegistries } = require('./build');
const { preparePortalRegistryWorkspace, runPortalPnpm } = require('./workspace');

async function run(command, args, options = {}) {
  return execa(command, args, {
    stdio: 'inherit',
    ...options,
  });
}

function getRootRegistryItems(registries) {
  const dependencies = new Set();
  const items = [];
  for (const registry of registries) {
    for (const item of registry.config.items) {
      items.push(item.name);
      for (const dependency of item.registryDependencies || []) {
        if (dependency.startsWith('@nocobase/')) {
          dependencies.add(dependency.slice('@nocobase/'.length));
        }
      }
    }
  }
  return items.filter((item) => !dependencies.has(item));
}

function getBuiltRegistryItemPaths(registries) {
  return new Map(
    registries.flatMap((registry) =>
      registry.config.items.map((item) => [
        item.name,
        path.resolve(registry.plugin.resolvedPath, 'dist/portal-registry', `${item.name}.json`),
      ]),
    ),
  );
}

async function startRegistryServer(registryItemPaths) {
  const server = http.createServer(async (request, response) => {
    const match = request.url?.match(/^\/r\/([a-z0-9][a-z0-9-]*)\.json$/);
    if (!match) {
      response.writeHead(404).end();
      return;
    }
    const filePath = registryItemPaths.get(match[1]);
    if (!filePath) {
      response.writeHead(404).end();
      return;
    }
    try {
      const content = await fs.readFile(filePath);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(content);
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to start the Portal Registry test server');
  }
  return {
    server,
    url: `http://127.0.0.1:${address.port}/r/{name}.json`,
  };
}

async function testPortalRegistries(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const buildResult = await buildPortalRegistries({ cwd });
  if (buildResult.itemCount === 0) {
    return buildResult;
  }

  const workspace = await preparePortalRegistryWorkspace({ cwd });

  const testParent = path.resolve(cwd, 'storage');
  await fs.ensureDir(testParent);
  const testRoot = await fs.mkdtemp(path.resolve(testParent, '.portal-registry-test-'));
  let registryServer;
  try {
    await run('git', ['clone', '--no-hardlinks', workspace.workspacePath, testRoot], { cwd });
    await runPortalPnpm(['install', '--frozen-lockfile', '--reporter=silent'], { cwd: testRoot });

    for (const registry of workspace.registries) {
      await fs.remove(path.resolve(testRoot, registry.config.target));
    }

    registryServer = await startRegistryServer(getBuiltRegistryItemPaths(workspace.registries));
    const componentsPath = path.resolve(testRoot, 'components.json');
    const components = await fs.readJson(componentsPath);
    components.registries = {
      ...components.registries,
      '@nocobase': registryServer.url,
    };
    await fs.writeJson(componentsPath, components, { spaces: 2 });

    const rootItems = getRootRegistryItems(workspace.registries);
    if (rootItems.length === 0) {
      throw new Error('Portal Registry test could not find any top-level items to install');
    }
    for (const item of rootItems) {
      await runPortalPnpm(['exec', 'shadcn', 'add', `@nocobase/${item}`, '--yes', '--overwrite', '--silent'], {
        cwd: testRoot,
      });
    }
    await run('git', ['checkout', '--', 'src/components/ui'], { cwd: testRoot });
    await runPortalPnpm(['run', 'build'], { cwd: testRoot });
    return buildResult;
  } finally {
    if (registryServer) {
      await new Promise((resolve) => registryServer.server.close(resolve));
    }
    await fs.remove(testRoot);
  }
}

module.exports = {
  getBuiltRegistryItemPaths,
  getRootRegistryItems,
  startRegistryServer,
  testPortalRegistries,
};
