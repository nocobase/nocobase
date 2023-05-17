import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';
import { default as _ } from 'lodash';
import { ModelStatic } from 'sequelize';
import { Database } from './database';
import { Model } from './model';
export class DatabaseSnapshot {
  private db: Database;
  private dialect: string;
  private dbIdentifier: string;

  constructor(database: Database) {
    this.db = database;
    this.dialect = database.options.dialect || 'default';
    this.dbIdentifier = `${database.options.host || 'host'}_${database.options.port || 'port'}_${
      database.options.database || 'sqlite'
    }`;
  }

  hasChanged(model: ModelStatic<Model>, options) {
    if (options?.force) {
      return true;
    }
    if (this.db.isSqliteMemory()) {
      return true;
    }
    const snapshotFile = this.snapshotFilePath(model);
    if (!fs.existsSync(snapshotFile)) {
      return true;
    }

    const snapshotFromFile = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    let snapshot = this.snapshotFromModel(model);

    // remove undefined values recursively which lodash can't
    snapshot = JSON.parse(JSON.stringify(snapshot));

    if (!_.isEqual(snapshotFromFile, snapshot)) {
      return true;
    }

    return false;
  }

  save(model: ModelStatic<Model>) {
    if (this.db.isSqliteMemory()) {
      return true;
    }

    const dir = this.snapshotDir(model);
    if (!fs.existsSync(dir)) {
      mkdirp.sync(dir);
    }

    const snapshotFile = this.snapshotFilePath(model);
    const snapshot = this.snapshotFromModel(model);

    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  remove(model: ModelStatic<Model>) {
    const snapshotFile = this.snapshotFilePath(model);
    if (fs.existsSync(snapshotFile)) {
      fs.unlinkSync(snapshotFile);
    }
  }

  removeAll() {
    const dir = this.snapshotDir(null);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  private snapshotFromModel(model: ModelStatic<Model>) {
    const snapshot = {
      fields: model.getAttributes(),
      // @ts-ignore
      _indexes: model._indexes,
      indexes: model.options.indexes,
    };
    return snapshot;
  }

  private snapshotDir(model: ModelStatic<Model>) {
    return path.join(
      'storage',
      'db',
      'snapshots',
      this.dialect,
      this.dbIdentifier,
      model?.options?.schema || this.db.options.schema || 'public',
    );
  }

  private snapshotFilePath(model: ModelStatic<Model>) {
    return path.join(this.snapshotDir(model), `${model.tableName}.json`);
  }
}
