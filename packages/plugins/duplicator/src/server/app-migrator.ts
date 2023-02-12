import { Application } from '@nocobase/server';
import { applyMixins, AsyncEmitter } from '@nocobase/utils';
import crypto from 'crypto';
import EventEmitter from 'events';
import fsPromises from 'fs/promises';
import inquirer from 'inquirer';
import lodash from 'lodash';
import * as os from 'os';
import path from 'path';

abstract class AppMigrator extends EventEmitter {
  protected workDir: string;
  public app: Application;

  abstract direction: 'restore' | 'dump';

  declare emitAsync: (event: string | symbol, ...args: any[]) => Promise<boolean>;

  constructor(
    app,
    options?: {
      workDir?: string;
    },
  ) {
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

    return ['core', ...plugins.map((plugin) => plugin.get('name'))];
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

  buildInquirerPluginQuestion(requiredGroups, optionalGroups) {
    return {
      type: 'checkbox',
      name: 'collectionGroups',
      message: `Select the plugin collections to be ${this.direction === 'dump' ? 'dumped' : 'restored'}`,
      loop: false,
      pageSize: 20,
      choices: [
        new inquirer.Separator('== Required =='),
        ...requiredGroups.map((collectionGroup) => ({
          name: `${collectionGroup.function} (${collectionGroup.pluginName})`,
          value: `${collectionGroup.pluginName}.${collectionGroup.function}`,
          checked: true,
          disabled: true,
        })),

        new inquirer.Separator('== Optional =='),
        ...optionalGroups.map((collectionGroup) => ({
          name: `${collectionGroup.function} (${collectionGroup.pluginName})`,
          value: `${collectionGroup.pluginName}.${collectionGroup.function}`,
          checked: this.direction === 'dump',
        })),
      ],
    };
  }

  buildInquirerCollectionQuestion(
    collections: {
      name: string;
      title: string;
    }[],
  ) {
    return {
      type: 'checkbox',
      name: 'userCollections',
      message: `Select the collection records to be ${this.direction === 'dump' ? 'dumped' : 'restored'}`,
      loop: false,
      pageSize: 30,
      choices: collections.map((collection) => {
        return {
          name: collection.title,
          value: collection.name,
          checked: this.direction === 'dump',
        };
      }),
    };
  }

  buildInquirerQuestions(requiredGroups, optionalGroups, optionalCollections) {
    const questions = [this.buildInquirerPluginQuestion(requiredGroups, optionalGroups)];

    if (optionalCollections.length > 0) {
      questions.push(this.buildInquirerCollectionQuestion(optionalCollections));
    }

    return questions;
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
