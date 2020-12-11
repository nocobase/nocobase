import {
  Utils,
  DataType,
  DataTypes,
  Sequelize,
  ModelAttributeColumnOptions,
  ThroughOptions,
  StringDataTypeOptions,
  IntegerDataTypeOptions,
  NumberDataTypeOptions,
  TextDataTypeOptions,
  FloatDataTypeOptions,
  DecimalDataTypeOptions,
  DoubleDataTypeOptions,
  RealDataTypeOptions,
  DateDataTypeOptions,
  HasOneOptions as SequelizeHasOneOptions,
  HasManyOptions as SequelizeHasManyOptions,
  BelongsToOptions as SequelizeBelongsToOptions,
  BelongsToManyOptions as SequelizeBelongsToManyOptions,
  ModelIndexesOptions,
} from 'sequelize';

export interface AbstractFieldOptions {
  name: string;
  [key: string]: any;
}

export interface AbstractColumnOptions extends AbstractFieldOptions, Omit<ModelAttributeColumnOptions, 'type'> {
  dataType?: DataType;
  index?: boolean | ModelIndexesOptions;
}

export interface AbstractRelationOptions extends AbstractFieldOptions {
  target?: string;
}

export interface BooleanOptions extends AbstractColumnOptions {
  type: 'boolean';
}

export interface NumberOptions extends AbstractColumnOptions {
  // type: 'number' | typeof DataTypes.NUMBER | string;
}

export interface IntegerOptions extends IntegerDataTypeOptions, NumberOptions {
  type: 'int'       | 'integer'       | typeof DataTypes.INTEGER |
        'tinyint'   | 'tinyInteger'   | typeof DataTypes.TINYINT |
        'smallint'  | 'smallInteger'  | typeof DataTypes.SMALLINT |
        'mediumint' | 'mediumInteger' | typeof DataTypes.MEDIUMINT |
        'bigint'    | 'bigInteger'    | typeof DataTypes.BIGINT;
}

export interface FloatOptions extends FloatDataTypeOptions, NumberOptions {
  type: 'float' | typeof DataTypes.FLOAT;
}

export interface DoubleOptions extends DoubleDataTypeOptions, NumberOptions {
  type: 'double' | typeof DataTypes.DOUBLE;
}

export interface DecimalOptions extends DecimalDataTypeOptions, NumberOptions {
  type: 'decimal' | typeof DataTypes.DECIMAL;
}

export interface RealOptions extends RealDataTypeOptions, NumberOptions {
  type: 'real' | typeof DataTypes.REAL;
}

export interface StringOptions extends StringDataTypeOptions, AbstractColumnOptions {
  type: 'string' | typeof DataTypes.STRING;
}

export interface PasswordOptions extends Omit<StringOptions, 'type'> {
  type: 'password';
}

export interface TextOptions extends TextDataTypeOptions, AbstractColumnOptions {
  type: 'text' | typeof DataTypes.TEXT;
}

export interface TimeOptions extends DateDataTypeOptions, AbstractColumnOptions {
  type: 'time' | typeof DataTypes.TIME;
}

export interface DateOptions extends DateDataTypeOptions, AbstractColumnOptions {
  type: 'date' | typeof DataTypes.DATE;
}

export interface DateOnlyOptions extends AbstractColumnOptions {
  type: 'dateonly' | typeof DataTypes.DATEONLY;
}

export interface ArrayOptions extends AbstractColumnOptions {
  type: 'array' | typeof DataTypes.ARRAY;
  items?: any;
}

export interface JsonOptions extends AbstractColumnOptions {
  type: 'json' | 'jsonb' | typeof DataTypes.JSON | typeof DataTypes.JSONB;
  fields?: any;
}

export interface VirtualOptions extends AbstractColumnOptions {
  type: 'virtual';
}

export interface FormulaOptions extends AbstractColumnOptions {
  type: 'formula';
  formula: string;
  format: 'string' | 'number';
}

export interface ReferenceOptions extends AbstractColumnOptions {
  type: 'reference';
  source: string;
  dataIndex: string;
}

export interface HasOneOptions extends SequelizeHasOneOptions, AbstractRelationOptions {
  type: 'hasOne' | 'hasone';
}

export interface HasManyOptions extends SequelizeHasManyOptions, AbstractRelationOptions {
  type: 'hasMany' | 'hasmany';
  /**
   * The name of the field to use as the key for the association in the source table. 
   * Defaults to the primary key of the source table
   */
  sourceKey?: string;
  /**
   * Defaults to source singular name + sourceKey
   */
  foreignKey?: string;
}

export interface BelongsToOptions extends SequelizeBelongsToOptions, AbstractRelationOptions {
  type: 'belongsTo' | 'belongsto';
  /**
   * The name of the field to use as the key for the association in the target table. 
   * Defaults to the primary key of the target table
   */
  targetKey?: string;
  /**
   * Defaults to name + targetKey
   */
  foreignKey?: string;
}

export interface BelongsToManyOptions extends Omit<SequelizeBelongsToManyOptions, 'through'>, AbstractRelationOptions {
  type: 'belongsToMany' | 'belongstomany';
  /**
   * Defaults to the name of source + the name of target
   * 
   * 两个 name 按字母顺序排序之后连接，如：
   * users.belongsToMany(posts) -> through = posts_users
   */
  through?: string;
  /**
   * Defaults to the primary key of the source table
   */
  sourceKey?: string;
  /**
   *  Defaults to the name of source + sourceKey
   */
  foreignKey?: string;
  /**
   * Defaults to the primary key of the target table
   */
  targetKey?: string;
  /**
   *  Defaults to the name of target + targetKey
   */
  otherKey?: string;
}

export interface SortOptions extends NumberOptions {
  type: 'sort';
  /**
   * 排序限定范围
   * 
   * 在同表的限定范围内的字段值相等的数据行中排序
   */
  scope?: string[];
  /**
   * 新值创建策略
   * 
   * max: 使用最大值
   * min: 使用最小值
   * 
   * Defaults to 'max'
   */
  next?: 'min' | 'max';
}

export type ColumnOptions = AbstractFieldOptions 
                          | BooleanOptions 
                          | NumberOptions 
                          | IntegerOptions 
                          | FloatOptions
                          | DoubleOptions
                          | DecimalOptions
                          | RealOptions
                          | StringOptions
                          | PasswordOptions
                          | TextOptions
                          | TimeOptions
                          | DateOptions
                          | DateOnlyOptions
                          | ArrayOptions
                          | JsonOptions
                          | VirtualOptions
                          | FormulaOptions
                          | ReferenceOptions;

export type ElementOptions = BooleanOptions 
                          | IntegerOptions 
                          | FloatOptions
                          | DoubleOptions
                          | DecimalOptions
                          | RealOptions
                          | StringOptions
                          | TextOptions
                          | TimeOptions
                          | DateOptions
                          | DateOnlyOptions
                          | ArrayOptions
                          | JsonOptions
                          | VirtualOptions;

export type RelationOptions = HasOneOptions | HasManyOptions | BelongsToOptions | BelongsToManyOptions;

export type FieldOptions = ColumnOptions | RelationOptions;
