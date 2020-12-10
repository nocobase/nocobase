import * as Fields from './field-types';
import { IField, IFields } from './field-types';
import { FieldOptions } from './option-types';
import { ABSTRACT } from 'sequelize/lib/data-types';

/**
 * 字段统一都叫 Field，分 Column 和 Relation 两大类
 * 
 * Column：
 * 
 * - Boolean
 * - Number
 *   - Integer
 *   - Float
 *   - Double
 *   - Decimal
 *   - Real
 * - String
 * - Text
 * - Array
 * - Json
 * - Jsonb
 * - Time
 * - Date
 * - Dateonly
 * - Virtual
 * - Formula
 * 
 * Relation:
 * 
 * - HasOne
 * - HasMany
 * - BelongsTo
 * - BelongsToMany
 */
export * from './option-types';
export * from './field-types';

/**
 * 全局已注册字段
 */
const registeredFields = new Map<string, any>();

/**
 * 字段注册
 *
 * @param key 
 * @param field 
 */
export function registerField(key: string, field: IField) {
  registeredFields.set(key.toUpperCase(), field);
}

/**
 * 字段批量注册
 * 
 * @param fields 
 */
export function registerFields(fields: IFields) {
  for (const key in fields) {
    if (fields.hasOwnProperty(key)) {
      registerField(key, fields[key]);
    }
  }
}

export function getField(key: string) {
  key = key.toUpperCase();
  if (registeredFields.has(key)) {
    return registeredFields.get(key);
  }
  return Fields.Column;
}

export function getDataTypeKey(type: any): string {
  if (typeof type === 'string') {
    return type.toUpperCase();
  }

  if (Object.prototype.hasOwnProperty.call(type, 'key')) {
    return type.key.toUpperCase();
  }

  if (type instanceof ABSTRACT) {
    return type.constructor.name.toUpperCase();
  }

  return type.toUpperCase();
}

/**
 * 字段配置初始化
 *
 * @param options 
 * @param context 
 */
export function buildField(options: FieldOptions, context: Fields.FieldContext) {
  let { type, required } = options;
  if (type instanceof ABSTRACT) {
    options = {...type.options, ...options};
  }
  type = getDataTypeKey(type);
  if (type !== 'VIRTUAL' && required) {
    options.allowNull = false;
  }
  const Field = getField(type);
  return new Field({type, ...options}, context);
}

registerFields({
  ...Fields,
  // aliases
  INT: Fields.INTEGER,
  TINYINT: Fields.INTEGER,
  TINYINTEGER: Fields.INTEGER,
  SMALLINT: Fields.INTEGER,
  SMALLINTEGER: Fields.INTEGER,
  MEDIUMINT: Fields.INTEGER,
  MEDIUMINTEGER: Fields.INTEGER,
  BIGINT: Fields.INTEGER,
  BIGINTEGER: Fields.INTEGER,
  TIMESTAMP: Fields.DATE,
});
