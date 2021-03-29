import {
  Op,
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
import { template, get, toNumber } from 'lodash';
import bcrypt from 'bcrypt';

import * as Options from './option-types';
import { getDataTypeKey } from '.';
import Table from '../table';
import Database from '../database';
import Model, { ModelCtor } from '../model';
import { whereCompare, isNumber } from '../utils';

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
    this.options = {
      ...options,
      // type: getDataTypeKey(type)
    };
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
    const dataType = getDataTypeKey(type);
    if (DataTypes[dataType]) {
      return DataTypes[dataType];
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

export class BOOLEAN extends Column {
}

export class NUMBER extends Column {
}

export class INTEGER extends NUMBER {

  public readonly options: Options.IntegerOptions;

  public getDataType(): Function {
    const { type } = this.options;

    const dataType = getDataTypeKey(type);

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
    }[dataType] || DataTypes.INTEGER;
  }

  public getAttributeOptions() {
    const { length, zerofill, unsigned, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, zerofill, unsigned }),
    }
  }
}

export class FLOAT extends NUMBER {

  public readonly options: Options.FloatOptions;

  public getAttributeOptions() {
    const { length, decimals, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, decimals }),
    }
  }
}

export class DOUBLE extends NUMBER {
  public readonly options: Options.DoubleOptions;

  public getAttributeOptions() {
    const { length, decimals, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, decimals }),
    }
  }
}

export class DECIMAL extends NUMBER {

  public readonly options: Options.DecimalOptions;

  public getAttributeOptions() {
    const { precision, scale, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ precision, scale }),
    }
  }
}

export class REAL extends NUMBER {

  public readonly options: Options.RealOptions;

  public getAttributeOptions() {
    const { length, decimals, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, decimals }),
    }
  }
}

export class STRING extends Column {

  public readonly options: Options.StringOptions;

  public getAttributeOptions() {
    const { length, binary, ...restOptions } = this.options;

    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length, binary }),
    }
  }
}

export class TEXT extends Column {

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

export class TIME extends Column {
}

export class DATE extends Column {

  public readonly options: Options.DateOptions;

  public getAttributeOptions() {
    const { length, ...restOptions } = this.options;

    return {
      ...restOptions,
      type: this.getDataTypeInstance({ length }),
    }
  }
}

export class DATEONLY extends Column {
}

export class VIRTUAL extends Column {
}

export class REFERENCE extends VIRTUAL {

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

export class FORMULA extends VIRTUAL {

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

export class PASSWORD extends STRING {

  public getDataType() {
    return DataTypes.STRING;
  }

  constructor(options: Options.StringOptions, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    Model.addHook('beforeCreate', PASSWORD.hash.bind(this));
    Model.addHook('beforeUpdate', PASSWORD.hash.bind(this));
  }

  public static async hash(this: PASSWORD, model) {
    const { name } = this.options;
    if (!model.changed(name as any)) {
      return;
    }
    const value = model.get(name) as string;
    if (value) {
      const hash = await bcrypt.hash(value, 10);
      model.set(name, hash);
    } else {
      model.set(name, null);
    }
  }

  public static async verify(value: string, hash: string) {
    return await bcrypt.compare(value, hash);
  }
}

export class ARRAY extends Column {

  public readonly options: Options.ArrayOptions;

  public getDataType() {
    return DataTypes.JSONB;
  }

  public getAttributeOptions() {
    const { items, ...restOptions } = this.options;
    return {
      ...restOptions,
      type: this.getDataTypeInstance({ items }),
    }
  }
}

export class JSON extends Column {
  public getDataType() {
    return DataTypes.JSONB;
  }
}

export class JSONB extends Column {
}

export class UUID extends Column {
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

  public targetTableInit() {
    const { target, fields = [] } = this.options;
    if (target && fields.length) {
      this.context.database.table({
        name: target,
        fields,
      });
    }
  }

  public getAssociationType() {
    if (this instanceof HASONE) {
      return 'hasOne';
    }
    if (this instanceof HASMANY) {
      return 'hasMany';
    }
    if (this instanceof BELONGSTO) {
      return 'belongsTo';
    }
    if (this instanceof BELONGSTOMANY) {
      return 'belongsToMany';
    }
  }

  public getTarget() {
    const { target, name } = this.options;
    if (target) {
      return target;
    }
    if (this instanceof HASMANY) {
      return name;
    }
    if (this instanceof BELONGSTOMANY) {
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
    };
  }

  public getAssociationArguments() {
    return {
      target: this.getTarget(),
      type: this.getAssociationType(),
      options: this.getAssociationOptions(),
    };
  }
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

export class HASONE extends HasOneOrMany {

  public readonly options: Options.HasOneOptions;

  constructor(options: Options.HasOneOptions, context: FieldContext) {
    let { name, target } = options;

    if (!target) {
      target = Utils.pluralize(name);
    }

    super({ target, ...options }, context);

    this.targetTableInit();
  }

  public getAccessors(): HasOneAccessors {
    return super.getAccessors();
  }

  public getAssociationOptions(): HasOneOptions {
    const { name, ...restOptions } = this.options;
    return {
      as: name,
      ...restOptions,
    }
  }
}

export class HASMANY extends HasOneOrMany {

  public readonly options: Options.HasManyOptions;

  constructor(options: Options.HasManyOptions, context: FieldContext) {
    let { name, target } = options;

    if (!target) {
      target = name;
    }

    super({ target, ...options }, context);
    this.targetTableInit();
  }

  public getAssociationOptions(): HasManyOptions {
    const { name, ...restOptions } = this.options;
    return {
      as: name,
      ...restOptions,
    };
  }
}

export class BELONGSTO extends Relation {

  public readonly options: Options.BelongsToOptions;

  constructor(options: Options.BelongsToOptions, context: FieldContext) {
    let { name, target } = options;

    if (!target) {
      target = Utils.pluralize(name);
    }

    super({ target, ...options }, context);

    this.targetTableInit();
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
    const { name, ...restOptions } = this.options;
    return {
      as: name,
      ...restOptions,
    }
  }
}

export class BELONGSTOMANY extends Relation {

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

    this.targetTableInit();
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
    class ThroughModel extends Model { }

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
    const { name, ...restOptions } = this.options;
    return {
      as: name,
      through: this.getThroughModel(),
      ...restOptions,
    }
  }
}

export class SORT extends NUMBER {

  public readonly options: Options.SortOptions;

  static async beforeCreateHook(this: SORT, model, options) {
    const { name, scope = [] } = this.options;
    // 如果有值，跳过
    if (isNumber(model.get(name))) {
      return;
    }
    const extremum: number = await this.getNextValue({
      ...options,
      where: model.getValuesByFieldNames(scope)
    });
    model.set(name, extremum);
  }

  static async beforeBulkCreateHook(this: SORT, models, options) {
    const { transaction } = options;
    const { name, scope = [], next = 'max' } = this.options;
    // 如果未配置范围限定，则可以进行性能优化处理（常用情况）。
    if (!scope.length) {
      const extremum: number = await this.getNextValue({ where: {}, transaction });
      models.forEach((model, i: number) => {
        model.setDataValue(name, extremum + i * (next === 'max' ? 1 : -1));
      });
      return;
    }

    // 用于存放 where 条件与计算极值
    const groups = new Map<{ [key: string]: any }, number>();
    await models.reduce((promise, model) => promise.then(async () => {
      const where = model.getValuesByFieldNames(scope);

      let extremum: number;
      // 以 map 作为 key
      let combo;
      // 查找与 where 值相等的组合
      for (combo of groups.keys()) {
        if (whereCompare(combo, where)) {
          // 如果找到的话则以之前储存的值作为基础极值
          extremum = groups.get(combo) + (next === 'max' ? 1 : -1);
          break;
        }
      }
      // 如未找到组合
      if (typeof extremum === 'undefined') {
        // 则使用 where 条件查询极值
        extremum = await this.getNextValue({ where, transaction });
        // 且使用 where 条件创建组合
        combo = where;
      }
      const nextValue = extremum;
      // 设置数据行的排序值
      model.setDataValue(name, nextValue);
      // 保存新的排序值为对应 where 组合的极值，以供下次计算
      groups.set(combo, nextValue);
    }), Promise.resolve());
  }

  constructor(options: Options.SortOptions, context: FieldContext) {
    super(options, context);
    const Model = context.sourceTable.getModel();
    // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    Model.addHook('beforeCreate', SORT.beforeCreateHook.bind(this));
    Model.addHook('beforeBulkCreate', SORT.beforeBulkCreateHook.bind(this));
  }

  public getDataType(): Function {
    return DataTypes.INTEGER;
  }

  public async getNextValue(this: SORT, { where, transaction, next: n = 'max' }) {
    const table = this.context.sourceTable;
    const Model = table.getModel();
    const { name, next = n } = this.options;
    const extremum: number = await Model[next](name, { where, transaction }) || 0;
    return extremum + (next === 'max' ? 1 : -1);
  }
}

export class Radio extends BOOLEAN {

  public readonly options: Options.RadioOptions;

  static async beforeCreateHook(this: Radio, model, options) {
    const { name, defaultValue = false, scope = [] } = this.options;
    const { transaction } = options;
    const value = model.get(name) || defaultValue;
    model.set(name, value);
    if (value) {
      const where = model.getValuesByFieldNames(scope);
      await this.setOthers({ where, transaction });
    }
  }

  static async beforeUpdateHook(this: Radio, model, options) {
    const { name, scope = [] } = this.options;
    const { transaction, association } = options;
    if (model.changed(name) && model.get(name) && !association) {
      const where = model.getValuesByFieldNames(scope);
      const { primaryKeyAttribute } = model.constructor;
      where[primaryKeyAttribute] = { [Op.ne]: model.get(primaryKeyAttribute) }
      await this.setOthers({ where, transaction });
    }
  }

  static async beforeBulkCreateHook(this: Radio, models, options) {
    const { scope = [] } = this.options;
    const { transaction } = options;

    // 如果未配置范围限定，则可以进行性能优化处理（常用情况）。
    if (!scope.length) {
      await this.makeGroup(models, { transaction });
      return;
    }

    const groups = new Map<{ [key: string]: any }, any[]>();
    // 按 scope 先分组
    models.forEach(model => {
      const where = model.getValuesByFieldNames(scope);
      // 以 map 作为 key
      let combo;
      let group;
      // 查找与 where 值相等的组合
      for (combo of groups.keys()) {
        if (whereCompare(combo, where)) {
          group = groups.get(combo);
          break;
        }
      }
      if (!group) {
        group = [];
        groups.set(where, group);
      }
      group.push(model);
    });

    for (const [where, group] of groups) {
      await this.makeGroup(group, { where, transaction });
    }
  }

  constructor({ type, ...options }: Options.RadioOptions, context: FieldContext) {
    super({ ...options, type: 'boolean' }, context);
    const Model = context.sourceTable.getModel();
    // TODO(feature): 可考虑策略模式，以在需要时对外提供接口
    Model.addHook('beforeCreate', Radio.beforeCreateHook.bind(this));
    Model.addHook('beforeUpdate', Radio.beforeUpdateHook.bind(this));
    // Model.addHook('beforeUpsert', beforeSaveHook);
    Model.addHook('beforeBulkCreate', Radio.beforeBulkCreateHook.bind(this));
    // TODO(optimize): bulkUpdate 的 hooks 参数不一样，没有对象列表，考虑到很少用，暂时不实现
    // Model.addHook('beforeBulkUpdate', beforeBulkCreateHook);
  }

  public getDataType() {
    return DataTypes.BOOLEAN;
  }

  public async setOthers(this: Radio, { where = {}, transaction }) {
    const { name } = this.options;
    const table = this.context.sourceTable;
    const Model = table.getModel();
    // 防止 beforeBulkUpdate hook 死循环，因外层 bulkUpdate 并不禁用，正常更新无影响。
    await Model.update({ [name]: false }, {
      where: {
        ...where,
        [name]: true
      },
      transaction,
      hooks: false
    });
  }

  async makeGroup(this: Radio, models, { where = {}, transaction }) {
    const { name, defaultValue = false } = this.options;
    let lastTrue;
    let lastNull;
    models.forEach(model => {
      const value = model.get(name);
      if (value) {
        lastTrue = model;
      } else if (value == null) {
        lastNull = model;
      }
      model.set(name, false);
    });
    if (lastTrue) {
      lastTrue.set(name, true);
    } else if (defaultValue && lastNull) {
      lastNull.set(name, true);
    }

    await this.setOthers({ where, transaction });
  }
}
