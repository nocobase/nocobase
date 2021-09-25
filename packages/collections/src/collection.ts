import { ModelCtor, Model } from 'sequelize';
import { Database } from './database';
import { Schema } from './schema';
import { RelationField } from './schema-fields';
import _ from 'lodash';
import { Repository } from './repository';

export interface CollectionOptions {
  schema?: any;
  [key: string]: any;
}

export interface CollectionContext {
  database: Database;
}

export class Collection {
  schema: Schema;
  model: ModelCtor<Model>;
  repository: Repository;
  options: CollectionOptions;
  context: CollectionContext;

  get name() {
    return this.options.name;
  }

  constructor(options: CollectionOptions, context: CollectionContext) {
    this.options = options;
    this.context = context;
    const { name, tableName } = options;
    this.model = class extends Model<any, any> {};
    const attributes = {};
    // TODO: 不能重复 model.init，如果有涉及 InitOptions 参数修改，需要另外处理。
    this.model.init(attributes, {
      ..._.omit(options, ['name', 'schema']),
      sequelize: context.database.sequelize,
      modelName: name,
      tableName: tableName || name,
    });
    // schema 只针对字段，对应 Sequelize 的 Attributes
    // 其他 InitOptions 参数放在 Collection 里，通过其他方法同步给 model
    this.schema = new Schema(options.schema, {
      ...context,
      collection: this,
    });
    this.schema2model();
    this.context.database.emit('collection.init', this);
    this.repository = new Repository(this);
  }

  schema2model() {
    this.schema.forEach((field) => {
      field.bind();
    });
    this.schema.on('setted', (field) => {
      // console.log('setted', field);
      field.bind();
    });
    this.schema.on('deleted', (field) => field.unbind());
    this.schema.on('merged', (field) => {
      //
    });
  }
}
