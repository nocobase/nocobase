import { Database } from '../database';
import { ArrayValueParser } from './array-value-parser';
import { BaseValueParser } from './base-value-parser';
import { BooleanValueParser } from './boolean-value-parser';
import { DateValueParser } from './date-value-parser';
import { JsonValueParser } from './json-value-parser';
import { NumberValueParser } from './number-value-parser';
import { StringValueParser } from './string-value-parser';
import { ToManyValueParser } from './to-many-value-parser';
import { ToOneValueParser } from './to-one-value-parser';

export function registerFieldValueParsers(db: Database) {
  db.registerFieldValueParsers({
    default: BaseValueParser,
    array: ArrayValueParser,
    set: ArrayValueParser,
    boolean: BooleanValueParser,
    date: DateValueParser,
    json: JsonValueParser,
    jsonb: JsonValueParser,
    number: NumberValueParser,
    integer: NumberValueParser,
    bigInt: NumberValueParser,
    float: NumberValueParser,
    double: NumberValueParser,
    real: NumberValueParser,
    decimal: NumberValueParser,
    string: StringValueParser,
    hasOne: ToOneValueParser,
    hasMany: ToManyValueParser,
    belongsTo: ToOneValueParser,
    belongsToMany: ToManyValueParser,
  });
}

export {
  ArrayValueParser,
  BaseValueParser,
  BooleanValueParser,
  DateValueParser,
  JsonValueParser,
  NumberValueParser,
  StringValueParser,
  ToManyValueParser,
  ToOneValueParser,
};
