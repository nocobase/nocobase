import { StringFieldOptions } from './string-field';

import { BooleanFieldOptions } from './boolean-field';
import { BelongsToFieldOptions } from './belongs-to-field';
import { HasOneFieldOptions } from './has-one-field';
import { HasManyFieldOptions } from './has-many-field';
import { BelongsToManyFieldOptions } from './belongs-to-many-field';
import {
  DecimalFieldOptions,
  DoubleFieldOptions,
  FloatFieldOptions,
  IntegerFieldOptions,
  RealFieldOptions,
} from './number-field';
import { JsonbFieldOptions, JsonFieldOptions } from './json-field';
import { SortFieldOptions } from './sort-field';
import { TextFieldOptions } from './text-field';
import { VirtualFieldOptions } from './virtual-field';
import { TimeFieldOptions } from './time-field';
import { DateFieldOptions } from './date-field';

export * from './field';
export * from './string-field';
export * from './relation-field';
export * from './belongs-to-field';
export * from './belongs-to-many-field';
export * from './boolean-field';
export * from './has-one-field';
export * from './has-many-field';
export * from './json-field';
export * from './sort-field';
export * from './number-field';
export * from './uid-field';

export type FieldOptions =
  | StringFieldOptions
  | IntegerFieldOptions
  | FloatFieldOptions
  | DecimalFieldOptions
  | DoubleFieldOptions
  | RealFieldOptions
  | JsonFieldOptions
  | JsonbFieldOptions
  | BooleanFieldOptions
  | SortFieldOptions
  | TextFieldOptions
  | VirtualFieldOptions
  | TimeFieldOptions
  | DateFieldOptions
  | BelongsToFieldOptions
  | HasOneFieldOptions
  | HasManyFieldOptions
  | BelongsToManyFieldOptions;
