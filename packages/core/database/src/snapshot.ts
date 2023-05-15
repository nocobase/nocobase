import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';
import { default as _ } from 'lodash';
import { ModelStatic } from 'sequelize';
import { Database } from './database';
import { Model } from './model';

export class DatabaseSnapshot {
  private db: Database;
  private snapshotDir: string;

  constructor(database: Database) {
    this.db = database;
    if (this.db.isSqliteMemory()) {
      return;
    }
    this.snapshotDir = path.join(
      'storage',
      'db',
      'snapshots',
      this.db.options.dialect || 'default',
      this.db.options.schema || 'public',
    );
  }

  hasChanged(model: ModelStatic<Model>, options) {
    if (options?.force) {
      return true;
    }
    if (this.db.isSqliteMemory()) {
      return true;
    }
    const snapshotFile = path.join(this.snapshotDir, `${model.tableName}.json`);
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

    if (!fs.existsSync(this.snapshotDir)) {
      mkdirp.sync(this.snapshotDir);
    }

    const snapshotFile = path.join(this.snapshotDir, `${model.tableName}.json`);
    const snapshot = this.snapshotFromModel(model);

    fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf8');
  }

  remove(model: ModelStatic<Model>) {
    const snapshotFile = path.join(this.snapshotDir, `${model.tableName}.json`);
    if (fs.existsSync(snapshotFile)) {
      fs.unlinkSync(snapshotFile);
    }
  }

  removeAll() {
    if (fs.existsSync(this.snapshotDir)) {
      fs.rmSync(this.snapshotDir, { recursive: true, force: true });
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
}
