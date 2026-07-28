/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs-extra';
import { createHash } from 'node:crypto';
import path from 'path';
import type Application from './application';
import { resolvePluginPackagePath } from '../../utils/plugin-package';

const REGISTRY_ITEM_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

interface PortalRegistryManifestItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  file: string;
  digest: string;
}

interface PortalRegistryManifest {
  schemaVersion: number;
  packageName: string;
  packageVersion: string;
  items: PortalRegistryManifestItem[];
}

export interface ExposedPortalRegistryItem extends PortalRegistryManifestItem {
  packageName: string;
  packageVersion: string;
  filePath: string;
}

interface CollectPortalRegistryOptions {
  resolvePackagePath?: (packageName: string) => Promise<string>;
}

function isSafeManifestFile(file: string, itemName: string) {
  return file === `${itemName}.json` && !path.isAbsolute(file) && !file.includes('..') && !file.includes('\\');
}

export function createPortalRegistryDigest(content: Buffer | string) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`;
}

async function readPluginPortalRegistry(packageName: string, pluginRoot: string) {
  const registryRoot = path.resolve(pluginRoot, 'dist/portal-registry');
  const manifestPath = path.resolve(registryRoot, 'manifest.json');
  if (!(await fs.pathExists(manifestPath))) {
    return [];
  }

  const manifest = (await fs.readJson(manifestPath)) as PortalRegistryManifest;
  const packageJson = await fs.readJson(path.resolve(pluginRoot, 'package.json'));
  if (
    manifest.schemaVersion !== 1 ||
    manifest.packageName !== packageName ||
    manifest.packageVersion !== packageJson.version ||
    packageJson.name !== packageName ||
    !Array.isArray(manifest.items)
  ) {
    throw new Error(`Invalid Portal Registry manifest for plugin ${packageName}`);
  }

  const items: ExposedPortalRegistryItem[] = [];
  for (const item of manifest.items) {
    if (
      !REGISTRY_ITEM_NAME_PATTERN.test(item.name) ||
      !isSafeManifestFile(item.file, item.name) ||
      !/^sha256:[a-f0-9]{64}$/.test(item.digest)
    ) {
      throw new Error(`Invalid Portal Registry item in plugin ${packageName}`);
    }
    const filePath = path.resolve(registryRoot, item.file);
    const content = await fs.readFile(filePath);
    if (createPortalRegistryDigest(content) !== item.digest) {
      throw new Error(`Portal Registry item digest mismatch for ${packageName}:${item.name}`);
    }
    items.push({
      ...item,
      packageName,
      packageVersion: manifest.packageVersion,
      filePath,
    });
  }
  return items;
}

export async function collectEnabledPortalRegistryItems(app: Application, options: CollectPortalRegistryOptions = {}) {
  const resolvePackagePath =
    options.resolvePackagePath ||
    ((packageName: string) =>
      resolvePluginPackagePath(packageName, {
        nodeModulesPath: process.env.NODE_MODULES_PATH,
      }));
  const items = new Map<string, ExposedPortalRegistryItem>();

  for (const plugin of app.pm.getPlugins().values()) {
    if (!plugin.enabled || !plugin.options.packageName) {
      continue;
    }

    const packageName = plugin.options.packageName as string;
    const pluginRoot = await resolvePackagePath(packageName);
    if (!pluginRoot) {
      continue;
    }

    for (const item of await readPluginPortalRegistry(packageName, pluginRoot)) {
      const existing = items.get(item.name);
      if (existing) {
        throw new Error(
          `Duplicate Portal Registry item '${item.name}' in ${existing.packageName} and ${item.packageName}`,
        );
      }
      items.set(item.name, item);
    }
  }

  return items;
}

export { readPluginPortalRegistry };
