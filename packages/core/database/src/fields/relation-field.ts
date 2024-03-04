import { BaseFieldOptions, Field } from './field';

export type BaseRelationFieldOptions = BaseFieldOptions;

export interface MultipleRelationFieldOptions extends BaseRelationFieldOptions {
  sortBy?: string | string[];
}

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
    return this.options.sourceKey || this.collection.model.primaryKeyAttribute;
  }

  get targetKey() {
    return this.options.targetKey || this.TargetModel.primaryKeyAttribute;
  }

  /**
   * get target model from database by it's name
   * @constructor
   */
  get TargetModel() {
    return this.context.database.sequelize.models[this.target];
  }

  keyPairsTypeMatched(type1, type2) {
    type1 = type1.toLowerCase();
    type2 = type2.toLowerCase();

    const numberTypeGroups = ['integer', 'bigint', 'decimal', 'float', 'real', 'double', 'smallint', 'tinyint'];
    const stringTypeGroups = ['string', 'char', 'text'];

    // if types are in the same group then they are matched
    if (numberTypeGroups.includes(type1) && numberTypeGroups.includes(type2)) {
      return true;
    }

    if (stringTypeGroups.includes(type1) && stringTypeGroups.includes(type2)) {
      return true;
    }

    return type1 === type2;
  }

  protected clearAccessors() {
    const { collection } = this.context;
    const association = collection.model.associations[this.name];
    if (!association) {
      return;
    }

    // @ts-ignore
    const accessors = Object.values(association.accessors);

    accessors.forEach((accessor) => {
      // @ts-ignore
      delete collection.model.prototype[accessor];
    });
  }
}
