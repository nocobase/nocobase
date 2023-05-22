import mkdirp from 'mkdirp';
import path from 'path';
import fs from 'fs';
import { default as _ } from 'lodash';
import { ModelStatic } from 'sequelize';
import { Database } from './database';
import { Model } from './model';

export class DatabaseRunnerRecord {
  private db: Database;
  private dialect: string;
  private dbIdentifier: string;

  private static runnerToken: number = 0;

  constructor(database: Database) {
    this.db = database;
    this.dialect = database.options.dialect || 'default';
    this.dbIdentifier = `${database.options.host || 'host'}_${database.options.port || 'port'}_${
      database.options.database || 'sqlite'
    }`;
  }

  tryUpdateRunnerToken() {
    if (DatabaseRunnerRecord.runnerToken) {
      return;
    }
    DatabaseRunnerRecord.runnerToken = Date.now();
  }

  resetRunnerToken() {
    DatabaseRunnerRecord.runnerToken = 0;
  }

  hasChanged(model: ModelStatic<Model>, options) {
    if (!DatabaseRunnerRecord.runnerToken) {
      return true;
    }
    if (options?.force) {
      return true;
    }
    if (this.db.isSqliteMemory()) {
      return true;
    }
    const runnerRecordFile = this.runnerRecordFilePath(model);
    if (!fs.existsSync(runnerRecordFile)) {
      return true;
    }

    const runnerRecordFromFile = JSON.parse(fs.readFileSync(runnerRecordFile, 'utf8'));
    let runnerRecord = this.runnerRecordFormat(DatabaseRunnerRecord.runnerToken);

    // remove undefined values recursively which lodash can't
    runnerRecord = JSON.parse(JSON.stringify(runnerRecord));

    if (!_.isEqual(runnerRecordFromFile, runnerRecord)) {
      return true;
    }

    return false;
  }

  save(model: ModelStatic<Model>) {
    if (!DatabaseRunnerRecord.runnerToken) {
      return;
    }

    if (this.db.isSqliteMemory()) {
      return;
    }

    const dir = this.runnerRecordDir(model);
    if (!fs.existsSync(dir)) {
      mkdirp.sync(dir);
    }

    const runnerRecordFile = this.runnerRecordFilePath(model);
    const runnerRecord = this.runnerRecordFormat(DatabaseRunnerRecord.runnerToken);

    fs.writeFileSync(runnerRecordFile, JSON.stringify(runnerRecord, null, 2), 'utf8');
  }

  remove(model: ModelStatic<Model>) {
    const runnerRecordFile = this.runnerRecordFilePath(model);
    if (fs.existsSync(runnerRecordFile)) {
      fs.unlinkSync(runnerRecordFile);
    }
  }

  removeAll() {
    const dir = this.runnerRecordDir(null);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  private runnerRecordFormat(runnerRecord: number) {
    return {
      runner_record: runnerRecord,
    };
  }

  private runnerRecordDir(model: ModelStatic<Model>) {
    return path.join(
      'storage',
      'db',
      'runner_records',
      this.dialect,
      this.dbIdentifier,
      model?.options?.schema || this.db.options.schema || 'public',
    );
  }

  private runnerRecordFilePath(model: ModelStatic<Model>) {
    return path.join(this.runnerRecordDir(model), `${model.tableName}.json`);
  }
}
