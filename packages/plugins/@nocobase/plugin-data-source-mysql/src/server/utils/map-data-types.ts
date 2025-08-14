/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function mapDataType(dataType: string) {
  switch (dataType) {
    case 'int':
    case 'bigint':
    case 'smallint':
    case 'tinyint':
      return 'integer';
    case 'decimal':
    case 'numeric':
    case 'float':
    case 'double':
    case 'real':
      return 'float';
    case 'varchar':
    case 'char':
    case 'text':
      return 'string';
    case 'datetime':
      return 'datetime';
    case 'date':
      return 'date';
    case 'time':
      return 'time';
    case 'bit':
      return 'boolean';
    default:
      return 'string';
  }
}
