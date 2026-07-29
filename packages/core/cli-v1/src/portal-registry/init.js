/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const fs = require('fs-extra');
const path = require('path');
const { discoverPluginPackages, getPluginNameFromPackageName } = require('@nocobase/utils/plugin-package');
const { getPluginSourceRoots, resolvePluginStoragePath } = require('@nocobase/utils/plugin-symlink');

function isPathInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function createRegistryName(packageName) {
  const pluginName = getPluginNameFromPackageName(packageName);
  const unscopedName = pluginName.includes('/') ? pluginName.slice(pluginName.lastIndexOf('/') + 1) : pluginName;
  const name = unscopedName
    .replace(/^plugin-/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  if (!name) {
    throw new Error(`Cannot derive a Portal Registry name from plugin package ${packageName}`);
  }
  return name;
}

function toDisplayName(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toIdentifier(name) {
  const identifier = name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return /^\d/.test(identifier) ? `Registry${identifier}` : identifier;
}

function createScaffoldFiles(packageName) {
  const name = createRegistryName(packageName);
  const displayName = toDisplayName(name);
  const identifier = toIdentifier(name);
  const target = `src/extensions/nocobase-${name}`;
  const routePath = `/registry-${name}`;

  return {
    'registry.config.json': `${JSON.stringify(
      {
        target,
        items: [
          {
            name,
            type: 'registry:block',
            title: `NocoBase ${displayName}`,
            description: `${displayName} integration and component demo.`,
            include: ['components', 'demo', 'extension.tsx', 'index.ts', 'README.md'],
            registryDependencies: ['card'],
          },
        ],
      },
      null,
      2,
    )}\n`,
    'index.ts': `export * from "./components/${name}-card";\n`,
    [`components/${name}-card.tsx`]: `import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface ${identifier}CardProps {
  title?: string;
  description?: string;
}

export function ${identifier}Card({
  title = "${displayName}",
  description = "Replace this example with the ${displayName} Registry implementation.",
}: ${identifier}CardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Connect the NocoBase API, hooks, and reusable UI here.
      </CardContent>
    </Card>
  );
}
`,
    'demo/index.tsx': `import { ${identifier}Card } from "../components/${name}-card";

export function ${identifier}DemoPage() {
  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">${displayName}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Preview the main ${displayName} Registry states and integration behavior here.
        </p>
      </header>
      <${identifier}Card />
    </div>
  );
}
`,
    'extension.tsx': `import type { AppExtension } from "@/app/extensions";
import { Puzzle } from "lucide-react";
import { lazy, Suspense } from "react";
import { Route } from "react-router";

const ${identifier}DemoPage = lazy(() =>
  import("./demo").then((module) => ({ default: module.${identifier}DemoPage }))
);

const extension: AppExtension = {
  id: "nocobase-${name}",
  resources: [
    {
      name: "${name}-demo",
      list: "${routePath}",
      meta: {
        label: "${displayName}",
        icon: <Puzzle />,
        description: "${displayName} Registry demo.",
        acl: { type: "authenticated" },
      },
    },
  ],
  routes: (
    <Route
      key="nocobase-${name}-demo"
      path="${routePath}"
      element={
        <Suspense fallback={null}>
          <${identifier}DemoPage />
        </Suspense>
      }
    />
  ),
};

export default extension;
`,
    'README.md': `# NocoBase ${displayName} Portal Registry

This directory contains the Portal API integration, hooks, reusable components, and Demo owned by \`${packageName}\`.

Develop it with \`yarn portal-registry dev\`, then validate it with \`yarn portal-registry build\` and \`yarn portal-registry test\` from the NocoBase repository root.
`,
  };
}

async function findPlugin(pluginName, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const plugins =
    options.plugins ||
    (await discoverPluginPackages({
      cwd,
      nodeModulesPath: options.nodeModulesPath || process.env.NODE_MODULES_PATH || path.resolve(cwd, 'node_modules'),
      storagePluginsPath: options.storagePluginsPath || path.resolve(cwd, 'storage/plugins'),
    }));
  const matches = plugins.filter((plugin) => {
    return (
      plugin.packageName === pluginName ||
      plugin.name === pluginName ||
      getPluginNameFromPackageName(plugin.packageName) === pluginName ||
      createRegistryName(plugin.packageName) === pluginName
    );
  });

  if (matches.length === 0) {
    throw new Error(`Plugin not found: ${pluginName}`);
  }
  if (matches.length > 1) {
    throw new Error(`Plugin name is ambiguous: ${pluginName}. Use its full package name.`);
  }
  return matches[0];
}

async function initializePortalRegistry(pluginName, options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const plugin = await findPlugin(pluginName, { ...options, cwd });
  const editableRoots =
    options.editableRoots || getPluginSourceRoots(options.storagePluginsPath || resolvePluginStoragePath(), cwd);
  if (!editableRoots.some((root) => isPathInside(path.resolve(root), path.resolve(plugin.resolvedPath)))) {
    throw new Error(
      `Plugin ${plugin.packageName} is installed in node_modules. Portal Registry sources can only be initialized in an editable plugin.`,
    );
  }

  const registryRoot = path.resolve(plugin.resolvedPath, 'portal-registry');
  if (await fs.pathExists(registryRoot)) {
    throw new Error(`Portal Registry already exists for ${plugin.packageName}: ${registryRoot}`);
  }

  const temporaryRoot = await fs.mkdtemp(path.resolve(plugin.resolvedPath, '.portal-registry-init-'));
  try {
    const files = createScaffoldFiles(plugin.packageName);
    for (const [relativePath, content] of Object.entries(files)) {
      await fs.outputFile(path.resolve(temporaryRoot, relativePath), content);
    }
    await fs.move(temporaryRoot, registryRoot);
  } finally {
    await fs.remove(temporaryRoot);
  }

  return {
    packageName: plugin.packageName,
    registryRoot,
    registryName: createRegistryName(plugin.packageName),
  };
}

module.exports = {
  createRegistryName,
  createScaffoldFiles,
  findPlugin,
  initializePortalRegistry,
  isPathInside,
  toDisplayName,
  toIdentifier,
};
