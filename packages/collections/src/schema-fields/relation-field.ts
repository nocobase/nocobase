import { SchemaField } from './schema-field';

export abstract class RelationField extends SchemaField {
  get target() {
    const { target, name } = this.options;
    return target || name;
  }

  get foreignKey() {
    return this.options.foreignKey;
  }

  get sourceKey() {
    return this.options.sourceKey;
  }

  get TargetModel() {
    return this.context.database.sequelize.models[this.target];
  }
}
