/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ArrayFieldOptions } from './array-field';
import { BelongsToFieldOptions } from './belongs-to-field';
import { BelongsToManyFieldOptions } from './belongs-to-many-field';
import { BooleanFieldOptions } from './boolean-field';
import { ContextFieldOptions } from './context-field';
import { DateFieldOptions } from './date-field';
import { BaseFieldOptions } from './field';
import { HasManyFieldOptions } from './has-many-field';
import { HasOneFieldOptions } from './has-one-field';
import { JsonbFieldOptions, JsonFieldOptions } from './json-field';
import {
  DecimalFieldOptions,
  DoubleFieldOptions,
  FloatFieldOptions,
  IntegerFieldOptions,
  RealFieldOptions,
} from './number-field';
import { PasswordFieldOptions } from './password-field';
import { RadioFieldOptions } from './radio-field';
import { SetFieldOptions } from './set-field';
import { StringFieldOptions } from './string-field';
import { TextFieldOptions } from './text-field';
import { TimeFieldOptions } from './time-field';
import { UidFieldOptions } from './uid-field';
import { UUIDFieldOptions } from './uuid-field';
import { VirtualFieldOptions } from './virtual-field';
import { NanoidFieldOptions } from './nanoid-field';
import { EncryptionField } from './encryption-field';
import { UnixTimestampFieldOptions } from './unix-timestamp-field';
import { DateOnlyFieldOptions } from './date-only-field';
import { DatetimeNoTzField, DatetimeNoTzFieldOptions } from './datetime-no-tz-field';
import { DatetimeTzFieldOptions } from './datetime-tz-field';

export * from './array-field';
export * from './belongs-to-field';
export * from './belongs-to-many-field';
export * from './boolean-field';
export * from './context-field';
export * from './date-field';
export * from './datetime-field';
export * from './datetime-tz-field';
export * from './datetime-no-tz-field';
export * from './date-only-field';
export * from './field';
export * from './has-many-field';
export * from './has-one-field';
export * from './json-field';
export * from './number-field';
export * from './password-field';
export * from './radio-field';
export * from './relation-field';
export * from './set-field';
export * from './string-field';
export * from './text-field';
export * from './time-field';
export * from './uid-field';
export * from './uuid-field';
export * from './virtual-field';
export * from './nanoid-field';
export * from './encryption-field';
export * from './unix-timestamp-field';

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
  | TextFieldOptions
  | VirtualFieldOptions
  | ArrayFieldOptions
  | SetFieldOptions
  | TimeFieldOptions
  | DateFieldOptions
  | DatetimeTzFieldOptions
  | DatetimeNoTzFieldOptions
  | DateOnlyFieldOptions
  | UnixTimestampFieldOptions
  | UidFieldOptions
  | UUIDFieldOptions
  | NanoidFieldOptions
  | PasswordFieldOptions
  | ContextFieldOptions
  | BelongsToFieldOptions
  | HasOneFieldOptions
  | HasManyFieldOptions
  | BelongsToManyFieldOptions
  | EncryptionField;
