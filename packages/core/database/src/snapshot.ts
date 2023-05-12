import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';
import { default as _ } from 'lodash';
import { ModelStatic } from 'sequelize';
import { Database } from './database';
import { Model } from './model';

export function validateSnapshot(database: Database, model: ModelStatic<Model>, options) {
  if (options?.force) {
    return true;
  }
  if (database.isSqliteMemory()) {
    return true;
  }
  const snapshotDir = path.join('storage', 'db', 'snapshots', database.options.dialect || 'default', database.options.schema || 'public');
  const snapshotFile = path.join(snapshotDir, `${model.tableName}.json`);
  if (!fs.existsSync(snapshotFile)) {
    return true;
  }

  const snapshotFromFile = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  let snapshot = {
    fields: model.getAttributes(),
    // @ts-ignore
    indexes: model._indexes,
    // indexes: model.options.indexes,
  };

  // remove undefined values recursively which lodash can't
  snapshot = JSON.parse(JSON.stringify(snapshot));

  if (!_.isEqual(snapshotFromFile, snapshot)) {
    return true;
  }

  return false;
}

export function saveSnapshot(database: Database, model: ModelStatic<Model>) {
  if (database.isSqliteMemory()) {
    return true;
  }
  const snapshotDir = path.join('storage', 'db', 'snapshots', database.options.dialect || 'default', database.options.schema || 'public');
  if (!fs.existsSync(snapshotDir)) {
    mkdirp.sync(snapshotDir);
  }

  const snapshotFile = path.join(snapshotDir, `${model.tableName}.json`);
  const snapshot = {
    fields: model.getAttributes(),
    // @ts-ignore
    indexes: model._indexes,
    // indexes: model.options.indexes,
  };

  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2), 'utf8');
}

export function deleteSnapshot(database: Database, model: ModelStatic<Model>) {
  const snapshotDir = path.join('storage', 'db', 'snapshots', database.options.dialect || 'default', database.options.schema || 'public');
  const snapshotFile = path.join(snapshotDir, `${model.tableName}.json`);
  if (fs.existsSync(snapshotFile)) {
    fs.unlinkSync(snapshotFile);
  }
}

export function cleanupSnapshots(database: Database) {
  const snapshotDir = path.join('storage', 'db', 'snapshots', database.options.dialect || 'default', database.options.schema || 'public');
  if (fs.existsSync(snapshotDir)) {
    fs.rmSync(snapshotDir, { recursive: true, force: true });
  }
}