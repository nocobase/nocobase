/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

export class AppVolumeManager {
  readonly volumesDir: string;

  constructor(volumesDir: string) {
    this.volumesDir = path.resolve(volumesDir);
  }

  configPath(appId: string): string {
    this.assertAppId(appId);
    return path.join(this.volumesDir, appId, 'config');
  }

  storageDir(appId: string): string {
    this.assertAppId(appId);
    return path.join(this.volumesDir, appId, 'storage');
  }

  async prepareStorageDir(appId: string): Promise<string> {
    const storageDir = this.storageDir(appId);
    await mkdir(storageDir, { recursive: true, mode: 0o700 });
    return storageDir;
  }

  /** Where `writeConfig` keeps an App's configuration of one revision. */
  managedConfigPath(appId: string, revision: string): string {
    this.assertAppId(appId);
    this.assertAppId(revision);
    return path.join(
      this.volumesDir,
      appId,
      'configs',
      `config.${revision}.yml`,
    );
  }

  async writeConfig(
    appId: string,
    revision: string,
    content: string,
  ): Promise<string> {
    this.assertAppId(appId);
    this.assertAppId(revision);
    const directory = path.join(this.volumesDir, appId, 'configs');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const target = path.join(directory, `config.${revision}.yml`);
    const temporary = path.join(directory, `.${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, content, { mode: 0o600, flag: 'wx' });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
    return target;
  }

  async removeConfig(appId: string, configPath: string): Promise<void> {
    this.assertAppId(appId);
    const directory = path.join(this.volumesDir, appId, 'configs');
    if (path.dirname(configPath) !== directory) return;
    await rm(configPath, { force: true });
  }

  async publishConfig(
    appId: string,
    configPath: string,
    content: string,
  ): Promise<void> {
    this.assertAppId(appId);
    if (
      path.dirname(configPath) !== path.join(this.volumesDir, appId, 'configs')
    ) {
      throw new Error('App configuration is not managed by this host');
    }
    const match = /^config\.([a-zA-Z0-9_-]+)\.yml$/.exec(
      path.basename(configPath),
    );
    if (!match?.[1]) throw new Error('Invalid managed app configuration path');
    await this.writeConfig(appId, match[1], content);
  }

  private assertAppId(appId: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(appId)) {
      throw new Error(`Invalid app ID "${appId}"`);
    }
  }
}
