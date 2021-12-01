import * as fs from 'fs';
import path from 'path';
import lodash from 'lodash';
import Database, { MergeOptions } from './database';
import { CollectionOptions } from './collection';
import merge from 'deepmerge';

export type ImportFileExtension = 'js' | 'ts' | 'json';

export class CollectionExtend {
  collectionOptions: CollectionOptions;
  mergeOptions: MergeOptions;

  constructor(
    collectionOptions: CollectionOptions,
    mergeOptions: MergeOptions,
  ) {
    this.collectionOptions = collectionOptions;
    this.mergeOptions = mergeOptions;
  }
}

export class CollectionDefinition {
  name: string;
  root: CollectionOptions;
  extend: CollectionExtend[] = [];

  constructor(name: string) {
    this.name = name;
  }

  setRoot(root: CollectionOptions) {
    this.root = root;
  }

  addExtend(extend: CollectionExtend) {
    this.extend.push(extend);
  }

  hasRoot() {
    return !!this.root;
  }

  finalDefinition() {
    if (!this.hasRoot()) {
      throw new Error(`${this.name} dose not have the root definition`);
    }

    return this.extend.reduce(
      (carry, extend) =>
        merge(carry, extend.collectionOptions, extend.mergeOptions),
      this.root,
    );
  }
}

async function requireModule(module: any) {
  if (typeof module === 'string') {
    module = require(module);
  }

  if (typeof module !== 'object') {
    return module;
  }
  return module.__esModule ? module.default : module;
}

export class ImporterReader {
  directory: string;
  extensions: Set<string>;

  constructor(directory: string, extensions?: ImportFileExtension[]) {
    this.directory = directory;

    if (!extensions) {
      extensions = ['js', 'ts', 'json'];
    }

    this.extensions = new Set(extensions);
  }

  async read() {
    const modules = (
      await fs.promises.readdir(this.directory, {
        encoding: 'utf-8',
      })
    )
      .filter((fileName) =>
        this.extensions.has(path.parse(fileName).ext.replace('.', '')),
      )
      .map(
        async (fileName) =>
          await requireModule(path.join(this.directory, fileName)),
      );

    return (await Promise.all(modules)).filter((module) =>
      lodash.isPlainObject(module),
    );
  }
}

export class CollectionImporter {
  importReader: ImporterReader;
  database: Database;

  constructor(importReader: ImporterReader, database: Database) {
    this.importReader = importReader;
    this.database = database;
  }

  async import(): Promise<Map<string, CollectionDefinition>> {
    const resultMap = new Map<string, CollectionDefinition>();
    const modules = await this.importReader.read();

    for (const module of modules) {
      let collectionName;

      if (module.extend) {
        collectionName = module.collectionOptions.name;
      } else {
        collectionName = module.name;
      }

      if (!collectionName) {
        continue;
      }

      if (!resultMap.has(collectionName)) {
        resultMap.set(collectionName, new CollectionDefinition(collectionName));
      }

      const collectionDefinition = resultMap.get(collectionName);

      if (module.extend) {
        collectionDefinition.addExtend(
          new CollectionExtend(module.collectionOptions, module.mergeOptions),
        );
      } else {
        collectionDefinition.setRoot(module);
      }
    }

    return resultMap;
  }
}
