/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Migration } from '@nocobase/server';
import { storagePathJoin } from '@nocobase/utils';
import fs from 'fs';
import path from 'path';

const PORTAL_DIST_DIR = 'dist';
const PORTAL_CLIENT_DIR = 'client';
const PORTAL_INDEX_HTML = 'index.html';
const PORTAL_RAW_INDEX_HTML = 'index.raw.html';

async function pathExists(filePath: string): Promise<boolean> {
  return fs.promises
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

async function getDirectoryEntries(dir: string): Promise<fs.Dirent[]> {
  return fs.promises.readdir(dir, { withFileTypes: true }).catch(() => []);
}

async function normalizeLegacyPortalDist(portalDir: string): Promise<void> {
  const distDir = path.join(portalDir, PORTAL_DIST_DIR);
  const legacyIndexPath = path.join(distDir, PORTAL_INDEX_HTML);
  if (!(await pathExists(legacyIndexPath))) {
    return;
  }

  const clientDir = path.join(distDir, PORTAL_CLIENT_DIR);
  const clientIndexPath = path.join(clientDir, PORTAL_INDEX_HTML);
  const hasClientIndex = await pathExists(clientIndexPath);
  const legacyEntries = (await getDirectoryEntries(distDir)).filter(
    (entry) => entry.name !== PORTAL_CLIENT_DIR && entry.name !== PORTAL_RAW_INDEX_HTML,
  );
  if (!legacyEntries.length) {
    return;
  }

  if (hasClientIndex) {
    await Promise.all(
      legacyEntries.map((entry) => fs.promises.rm(path.join(distDir, entry.name), { recursive: true, force: true })),
    );
    return;
  }

  await fs.promises.mkdir(clientDir, { recursive: true });
  for (const entry of legacyEntries) {
    const sourcePath = path.join(distDir, entry.name);
    const targetPath = path.join(clientDir, entry.name);
    await fs.promises.rm(targetPath, { recursive: true, force: true });
    await fs.promises.rename(sourcePath, targetPath);
  }
}

async function normalizeLegacyPortalDists(): Promise<void> {
  const portalsRoot = storagePathJoin('portals');
  const appEntries = await getDirectoryEntries(portalsRoot);
  for (const appEntry of appEntries) {
    if (!appEntry.isDirectory()) {
      continue;
    }

    const appDir = path.join(portalsRoot, appEntry.name);
    const portalEntries = await getDirectoryEntries(appDir);
    for (const portalEntry of portalEntries) {
      if (!portalEntry.isDirectory()) {
        continue;
      }
      await normalizeLegacyPortalDist(path.join(appDir, portalEntry.name));
    }
  }
}

export default class extends Migration {
  on = 'afterLoad';

  async up() {
    await normalizeLegacyPortalDists();
  }
}
