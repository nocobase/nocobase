import { Application } from '@nocobase/server';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import crypto from 'crypto';
import EventEmitter from 'events';
import fsPromises from 'fs/promises';
import lodash from 'lodash';
import * as os from 'os';
import path from 'path';
import { CollectionGroupManager } from './collection-group-manager';

export type AppMigratorOptions = {
  workDir?: string;
};
abstract class AppMigrator extends EventEmitter {
  protected workDir: string;
  public app: Application;

  abstract direction: 'restore' | 'dump';

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  constructor(app, options?: AppMigratorOptions) {
    super();

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

    return lodash.uniq(['core', ...this.app.pm.getAliases(), ...plugins.map((plugin) => plugin.get('name'))]);
  }

  async getAppPluginCollectionGroups() {
    const plugins = await this.getAppPlugins();
    return CollectionGroupManager.collectionGroups.filter((collectionGroup) =>
      plugins.includes(collectionGroup.namespace),
    );
  }

  async getCustomCollections() {
    const collections = await this.app.db.getCollection('collections').repository.find();
    return collections.filter((collection) => !collection.get('isThrough')).map((collection) => collection.get('name'));
  }

  async rmDir(dir: string) {
    await fsPromises.rm(dir, { recursive: true, force: true });
  }

  async clearWorkDir() {
    await this.rmDir(this.workDir);
  }

  findThroughCollections(collections: string[]) {
    return [
      ...new Set(
        collections
          .map((collectionName) => this.app.db.getCollection(collectionName))
          .map((collection) =>
            [...collection.fields.values()].filter((field) => field.through).map((field) => field.through),
          )
          .flat(),
      ),
    ];
  }

  findSequenceFields(collections: string[]) {
    return [
      ...new Set(
        collections
          .map((collectionName) => this.app.db.getCollection(collectionName))
          .map((collection) => [...collection.fields.values()].filter((field) => field.type === 'sequence'))
          .flat(),
      ),
    ];
  }
}

applyMixins(AppMigrator, [AsyncEmitter]);
export { AppMigrator };
