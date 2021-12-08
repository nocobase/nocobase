import { BaseFieldOptions, Field } from './field';

export interface BaseRelationFieldOptions extends BaseFieldOptions {}

export abstract class RelationField extends Field {
  /**
   * target relation name
   */
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

  /**
   * get target model from database by it's name
   * @constructor
   */
  get TargetModel() {
    return this.context.database.sequelize.models[this.target];
  }
}
