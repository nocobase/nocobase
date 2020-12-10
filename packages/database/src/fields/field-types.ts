import {
  Utils,
  DataType,
  DataTypes,
  Sequelize,
  HasOneOptions,
  HasManyOptions,
  BelongsToOptions,
  BelongsToManyOptions,
  ThroughOptions,
} from 'sequelize';
import * as Options from './option-types';
import { getDataTypeKey } from '.';
import Table from '../table';
import Database from '../database';
import Model, { ModelCtor } from '../model';
import { template, isArray, map, get, toNumber } from 'lodash';
import bcrypt from 'bcrypt';

export interface IField {

}

export interface IFields {
  [key: string]: IField;
}

export interface FieldContext {
  sourceTable: Table;
  database: Database,
}

export class Field implements IField {

  public readonly options: any;

  protected context: FieldContext;

  constructor(options: any, context: FieldContext) {
    const { type } = options;
    this.options = {...options, type: getDataTypeKey(type)};
    this.context = context;
  }

  public isMultipleColumns() {
    return false;
  }

  public getType() {
    return this.options.type;
  }

  public getOptions() {
    return this.options;
  }
}

export class Column extends Field {

  public getDataType() {
    const { type } = this.options;

    if (DataTypes[type]) {
      return DataTypes[type];
    }

    return DataTypes[(<typeof Column>this.constructor).name.toUpperCase()];
  }

  public getDataTypeInstance(options: any = {}): any {
    const dataType = this.getDataType();
    Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);
    return Object.keys(options).length > 0 ? dataType(options) : dataType;
  }

  public getAttributeOptions() {
    return {
      ...this.options,
      type: this.getDataTypeInstance(),
    }
  }
}

export class Boolean extends Column {
}

export class Number extends Column {
}

export class Integer extends Number {

  public readonly options: Options.IntegerOptions;

  public getDataType(): Function {
    const { type } = this.options;

    return {
      INT: DataTypes.INTEGER,
      INTEGER: DataTypes.INTEGER,
      TINYINT: DataTypes.TINYINT,
      TINYINTEGER: DataTypes.TINYINT,
      SMALLINT: DataTypes.SMALLINT,
      SMALLINTEGER: DataTypes.SMALLINT,
      MEDIUMINT: DataTypes.MEDIUMINT,
      MEDIUMINTEGER: DataTypes.MEDIUMINT,
      BIGINT: DataTypes.BIGINT,
      BIGINTEGER: DataTypes.BIGINT,
    }[type as string] || DataTypes.INTEGER;
  }

  public getAttributeOptions() {
    const { length, zerofill, unsigned, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, zerofill, unsigned }),
    }
  }
}

export class Float extends Number {

  public readonly options: Options.FloatOptions;

  public getAttributeOptions() {
    const { length, decimals, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, decimals }),
    }
  }
}

export class Double extends Number {
  public readonly options: Options.DoubleOptions;

  public getAttributeOptions() {
    const { length, decimals, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, decimals }),
    }
  }
}

export class Decimal extends Number {

  public readonly options: Options.DecimalOptions;

  public getAttributeOptions() {
    const { precision, scale, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ precision, scale }),
    }
  }
}

export class Real extends Number {

  public readonly options: Options.RealOptions;

  public getAttributeOptions() {
    const { length, decimals, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, decimals }),
    }
  }
}

export class String extends Column {

  public readonly options: Options.StringOptions;

  public getAttributeOptions() {
    const { length, binary, ...restOptions } = this.options;

    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, binary }),
    }
  }
}

export class Text extends Column {

  public readonly options: Options.TextOptions;

  public getDataTypeInstance(options: any = {}): any {
    const { database } = this.context;
    const dataType = this.getDataType();
    Object.keys(options).forEach(key => options[key] === undefined && delete options[key]);
    if (database.sequelize.getDialect() === 'postgres') {
      return Object.keys(options).length > 0 ? dataType() : dataType;
    }
    return Object.keys(options).length > 0 ? dataType(options) : dataType;
  }

  public getAttributeOptions() {
    const { length, ...restOptions } = this.options;

    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length }),
    }
  }
}

export class Time extends Column {
}

export class Date extends Column {

  public readonly options: Options.DateOptions;

  public getAttributeOptions() {
    const { length, ...restOptions } = this.options;

    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length }),
    }
  }
}

export class DateOnly extends Column {
}

export class Virtual extends Column {
}

export class Reference extends Virtual {

  public getDataType() {
    return DataTypes.VIRTUAL;
  }

  public getAttributeOptions() {
    const { source, dataIndex, ...restOptions } = this.options;

    return {
      ...restOptions,
      type: this.getDataTypeInstance({ source, dataIndex }),
      get() {
        return get(this[source], dataIndex);
      },
    }
  }
}

export class Formula extends Virtual {

  public getDataType() {
    return DataTypes.VIRTUAL;
  }

  public getAttributeOptions() {
    const { sourceTable } = this.context;
    const { formula, format = 'string', ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ formula }),
      get() {
        const fields = sourceTable.getFields();
        const data: any = {};
        for (const [name, field] of fields) {
          console.log(field.getType());
          if (['formula', 'virtual'].indexOf((field.getType() as string).toLowerCase()) === -1) {
            data[name] = this.getDataValue(name);
          }
        }
        try {
          const compiled = template(formula, {
            interpolate: /{{([\s\S]+?)}}/g,
          });
          const value = compiled(data);
          return format === 'number' ? toNumber(value) : value;
        } catch (error) {
          console.log(error);
          return;
        }
      }
    }
  }
}

export class Password extends String {

  public getDataType() {
    return DataTypes.STRING;
  }

  public static verify(value: string, hash: string) {
    return bcrypt.compareSync(value, hash);
  }

  public getAttributeOptions() {
    const { name, length, binary, ...restOptions } = this.options;
    return {
      name,
      ...restOptions,
      type: this.getDataTypeInstance({ length, binary }),
      set(this: Model, value: string) {
        this.setDataValue(name, bcrypt.hashSync(value, 10));
      },
    }
  }
}

export class Array extends Column {

  public readonly options: Options.ArrayOptions;

  public getDataType() {
    return DataTypes.JSON;
  }

  public getAttributeOptions() {
    const { items, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({items}),
    }
  }
}

export class Json extends Column {
}

export class Jsonb extends Column {
}

export interface HasOneAccessors {
  get: string;
  set: string;
  create: string;
}

export interface HasManyAccessors {
  get: string;
  set: string;
  addMultiple: string;
  add: string;
  create: string;
  remove: string;
  removeMultiple: string;
  hasSingle: string;
  hasAll: string;
  count: string;
}

export interface BelongsToAccessors {
  get: string;
  set: string;
  create: string;
}

export interface BelongsToManyAccessors {
  get: string;
  set: string;
  addMultiple: string;
  add: string;
  create: string;
  remove: string;
  removeMultiple: string;
  hasSingle: string;
  hasAll: string;
  count: string;
}

export abstract class Relation extends Field {

  public getAssociationType() {
    if (this instanceof HasOne) {
      return 'hasOne';
    }
    if (this instanceof HasMany) {
      return 'hasMany';
    }
    if (this instanceof BelongsTo) {
      return 'belongsTo';
    }
    if (this instanceof BelongsToMany) {
      return 'belongsToMany';
    }
  }

  public getTarget() {
    const { target, name } = this.options;
    if (target) {
      return target;
    }
    if (this instanceof HasMany) {
      return name;
    }
    if (this instanceof BelongsToMany) {
      return name;
    }
    return Utils.pluralize(name);
  }

  public getTargetModel() {
    const { name } = this.options;
    const { sourceTable } = this.context;
    // @ts-ignore
    return sourceTable.getModel().associations[name].target;
  }

  public getAccessors() {
    const { name } = this.options;
    const { sourceTable } = this.context;
    // @ts-ignore
    return sourceTable.getModel().associations[name].accessors;
  }

  public getAssociationOptions(): any {
    const { name, ...restOptions } = this.options;
    return {
      as: name,
      ...restOptions,
    }
  }

  public getAssociationArguments() {
    return {
      target: this.getTarget(),
      type: this.getAssociationType(),
      options: this.getAssociationOptions(),
    }
  };
}

class HasOneOrMany extends Relation {
  constructor(options: Options.HasOneOptions | Options.HasManyOptions, context: FieldContext) {
    const { sourceTable } = context;
    let { foreignKey, sourceKey } = options;

    const SourceModel = sourceTable.getModel();

    if (!sourceKey) {
      sourceKey = SourceModel.primaryKeyAttribute;
    }

    if (!SourceModel.rawAttributes[sourceKey]) {
      sourceTable.addField({
        type: 'integer',
        name: sourceKey,
        unique: true,
      });
    }

    if (!foreignKey) {
      foreignKey = Utils.underscoredIf(
        Utils.camelize([
          SourceModel.options.name.singular, sourceKey
        ].join('_')),
        SourceModel.options.underscored
      );
    }

    super({ sourceKey, foreignKey, ...options }, context);
  }
}

export class HasOne extends HasOneOrMany {

  public readonly options: Options.HasOneOptions;

  constructor(options: Options.HasOneOptions, context: FieldContext) {
    let { name, target } = options;

    if (!target) {
      target = Utils.pluralize(name);
    }

    super({target, ...options}, context);
  }

  public getAccessors(): HasOneAccessors {
    return super.getAccessors();
  }

  public getAssociationOptions(): HasOneOptions {
    const { name, ...restOptions }= this.options;
    return {
      as: name,
      ...restOptions,
    }
  }
}

export class HasMany extends HasOneOrMany {

  public readonly options: Options.HasManyOptions;

  constructor(options: Options.HasManyOptions, context: FieldContext) {
    let { name, target } = options;

    if (!target) {
      target = name;
    }

    super({target, ...options}, context);
  }

  public getAssociationOptions(): HasManyOptions {
    const { name, ...restOptions }= this.options;
    return {
      as: name,
      ...restOptions,
    }
  }
}

export class BelongsTo extends Relation {

  public readonly options: Options.BelongsToOptions;

  constructor(options: Options.BelongsToOptions, context: FieldContext) {
    let { name, target } = options;

    if (!target) {
      target = Utils.pluralize(name);
    }

    super({target, ...options}, context);

    this.updateOptionsAfterTargetModelBeDefined();
  }

  public getAccessors(): BelongsToAccessors {
    return super.getAccessors();
  }

  public updateOptionsAfterTargetModelBeDefined() {
    let { name, target, targetKey, foreignKey } = this.options;
    const { database } = this.context;

    const TargetModel = database.getModel(target);

    if (!TargetModel) {
      return;
    }

    if (!targetKey) {
      targetKey = TargetModel.primaryKeyAttribute;
      this.options.targetKey = targetKey;
    }

    if (!foreignKey) {
      foreignKey = Utils.underscoredIf(
        Utils.camelize([
          name, targetKey
        ].join('_')),
        TargetModel.options.underscored
      );
      this.options.foreignKey = foreignKey;
    }
  }

  public getAssociationOptions(): BelongsToOptions {
    const { name, ...restOptions }= this.options;
    return {
      as: name,
      ...restOptions,
    }
  }
}

export class BelongsToMany extends Relation {

  public readonly options: Options.BelongsToManyOptions;

  constructor(options: Options.BelongsToManyOptions, context: FieldContext) {
    let { name, target, through, sourceKey, foreignKey, targetKey, otherKey } = options;
    const { database, sourceTable } = context;
    const SourceModel = sourceTable.getModel();

    if (!target) {
      target = name;
    }

    if (!through) {
      through = Utils.underscoredIf(
        Utils.camelize(
          [SourceModel.name, target]
          .map(name => name.toLowerCase())
          .sort()
          .join('_')
        ),
        SourceModel.options.underscored
      );
    }

    if (!sourceKey) {
      sourceKey = SourceModel.primaryKeyAttribute;
    }

    if (!foreignKey) {
      foreignKey = Utils.underscoredIf(
        Utils.camelize([
          SourceModel.options.name.singular, sourceKey
        ].join('_')),
        SourceModel.options.underscored
      );
    }

    super({
      target,
      through,
      sourceKey,
      foreignKey,
      ...options,
    }, context);

    this.updateOptionsAfterTargetModelBeDefined();

    // through table 未特殊定义时，默认根据 through 信息配置 through table
    // database.tables 里不会有 through table，但 database.sequelize.models 有
    database.throughTables.set(this.getThroughName(), [sourceTable.getName(), target]);
  }

  public getAccessors(): BelongsToManyAccessors {
    return super.getAccessors();
  }

  public updateOptionsAfterTargetModelBeDefined() {
    const { database } = this.context;
    let { target, targetKey, otherKey } = this.options;

    const TargetModel = database.getModel(target);

    if (!TargetModel) {
      return;
    }

    if (!targetKey) {
      targetKey = TargetModel.primaryKeyAttribute;
      this.options.targetKey = targetKey;
    }

    if (!otherKey) {
      otherKey = Utils.underscoredIf(
        Utils.camelize([
          TargetModel.options.name.singular, targetKey
        ].join('_')),
        TargetModel.options.underscored
      );
      this.options.otherKey = otherKey;
    }
  }

  public getThroughName(): string {
    // TODO name 必须是字符串
    return this.options.through as string;
  }

  public getThroughModel(): ModelCtor<Model> {
    const { through, target } = this.options;
    const { database, sourceTable } = this.context;

    const throughName = this.getThroughName();

    if (database.sequelize.isDefined(throughName)) {
      return database.getModel(throughName);
    }
    
    // 如果不存在 Through Model，需要初始化一个，不能用 Sequelize.Model
    class ThroughModel extends Model {}

    // TODO：需要对接 through 的其他参数
    ThroughModel.init({}, {
      modelName: throughName,
      tableName: throughName,
      sequelize: database.sequelize,
      indexes: [],
      underscored: true,
    });

    return ThroughModel;
  }

  public getAssociationOptions(): BelongsToManyOptions {
    const { name, ...restOptions }= this.options;
    return {
      as: name,
      through: this.getThroughModel(),
      ...restOptions,
    }
  }
}

export class Sort extends Integer {
  public readonly options: Options.SortOptions;

  static async beforeCreateHook(this: Sort, model, options) {
    const { transaction } = options;
    const table = this.context.sourceTable;
    const Model = table.getModel();
    const { name, scope = [], next = 'max' } = this.options;
    const where = {};
    const associations = table.getAssociations();
    scope.forEach(col => {
      const association = associations.get(col);
      const dataKey = association && association instanceof BelongsTo
        ? association.options.foreignKey
        : col;
      const value = model.getDataValue(dataKey);
      where[dataKey] = value != null ? value : null;
    });
    const extremum = await Model[next](name, { where, transaction }) || 0;
    model.set(name, extremum + (next === 'max' ? 1 : -1));
  }

  constructor(options: Options.SortOptions, context: FieldContext) {
    super(options, context);
    const model = context.sourceTable.getModel();
    // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    model.addHook('beforeCreate', Sort.beforeCreateHook.bind(this));
  }
}
