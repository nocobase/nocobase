import { Collection, CollectionContext, CollectionOptions } from '../collection';
import { SQLModel } from './sql-model';

export class SqlCollection extends Collection {
  constructor(options: CollectionOptions, context: CollectionContext) {
    options.autoGenId = false;
    options.timestamps = false;

    super(options, context);
  }

  isSql() {
    return true;
  }

  modelInit() {
    if (this.model) {
      return;
    }

    const { autoGenId, sql } = this.options;
    const model = class extends SQLModel {};
    model.init(null, {
      ...this.sequelizeModelOptions(),
      schema: '',
    });

    if (!autoGenId) {
      model.removeAttribute('id');
    }

    model.sql = sql;
    model.database = this.context.database;
    model.collection = this;

    this.model = model;
  }
}
