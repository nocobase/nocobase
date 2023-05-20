import type { ArrayFieldOptions } from './array-field';
import type { BelongsToFieldOptions } from './belongs-to-field';
import type { BelongsToManyFieldOptions } from './belongs-to-many-field';
import type { BooleanFieldOptions } from './boolean-field';
import type { ContextFieldOptions } from './context-field';
import type { DateFieldOptions } from './date-field';
import type { BaseFieldOptions } from './field';
import type { HasManyFieldOptions } from './has-many-field';
import type { HasOneFieldOptions } from './has-one-field';
import type { JsonbFieldOptions, JsonFieldOptions } from './json-field';
import type {
  DecimalFieldOptions,
  DoubleFieldOptions,
  FloatFieldOptions,
  IntegerFieldOptions,
  RealFieldOptions,
} from './number-field';
import type { PasswordFieldOptions } from './password-field';
import type { RadioFieldOptions } from './radio-field';
import type { SetFieldOptions } from './set-field';
import type { SortFieldOptions } from './sort-field';
import type { StringFieldOptions } from './string-field';
import type { TextFieldOptions } from './text-field';
import type { TimeFieldOptions } from './time-field';
import type { UidFieldOptions } from './uid-field';
import type { UUIDFieldOptions } from './uuid-field';
import type { VirtualFieldOptions } from './virtual-field';

export * from './array-field';
export * from './belongs-to-field';
export * from './belongs-to-many-field';
export * from './boolean-field';
export * from './context-field';
export * from './date-field';
export * from './field';
export * from './has-many-field';
export * from './has-one-field';
export * from './json-field';
export * from './number-field';
export * from './password-field';
export * from './radio-field';
export * from './relation-field';
export * from './set-field';
export * from './sort-field';
export * from './string-field';
export * from './text-field';
export * from './time-field';
export * from './uid-field';
export * from './uuid-field';
export * from './virtual-field';

export type FieldOptions =
  | BaseFieldOptions
  | StringFieldOptions
  | IntegerFieldOptions
  | FloatFieldOptions
  | DecimalFieldOptions
  | DoubleFieldOptions
  | RealFieldOptions
  | JsonFieldOptions
  | JsonbFieldOptions
  | BooleanFieldOptions
  | RadioFieldOptions
  | SortFieldOptions
  | TextFieldOptions
  | VirtualFieldOptions
  | ArrayFieldOptions
  | SetFieldOptions
  | TimeFieldOptions
  | DateFieldOptions
  | UidFieldOptions
  | UUIDFieldOptions
  | PasswordFieldOptions
  | ContextFieldOptions
  | BelongsToFieldOptions
  | HasOneFieldOptions
  | HasManyFieldOptions
  | BelongsToManyFieldOptions;
