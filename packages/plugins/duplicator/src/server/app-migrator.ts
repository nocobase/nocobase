import { Application } from '@nocobase/server';
import * as os from 'os';
import path from 'path';
import lodash from 'lodash';
import fsPromises from 'fs/promises';
import crypto from 'crypto';

export abstract class AppMigrator {
  protected workDir: string;
  protected app: Application;

  constructor(
    app,
    options?: {
      workDir?: string;
    },
  ) {
    this.app = app;
    this.workDir = options?.workDir || this.tmpDir();
  }

  tmpDir() {
    return path.resolve(os.tmpdir(), `nocobase-${crypto.randomUUID()}`);
  }

  getPluginCollections(plugins: string | string[]) {
    return lodash
      .castArray(plugins)
      .map((pluginName) => {
        return this.app.db.importedFrom.get(pluginName) || [];
      })
      .flat();
  }

  async getAppPlugins() {
    const plugins = await this.app.db.getCollection('applicationPlugins').repository.find();

    return plugins.map((plugin) => plugin.get('name'));
  }

  async getCustomCollections() {
    const collections = await this.app.db.getCollection('collections').repository.find();
    return collections.map((collection) => collection.get('name'));
  }

  async rmDir(dir: string) {
    await fsPromises.rm(dir, { recursive: true });
  }

  async clearWorkDir() {
    await this.rmDir(this.workDir);
  }
}
