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
    case 'integer':
    case 'bigint':
    case 'smallint':
      return 'integer';
    case 'decimal':
    case 'numeric':
    case 'real':
    case 'double precision':
      return 'float';
    case 'character varying':
    case 'character':
    case 'text':
      return 'string';
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return 'datetime';
    case 'date':
      return 'date';
    case 'time with time zone':
    case 'time without time zone':
      return 'time';
    case 'boolean':
      return 'boolean';
    default:
      return 'string';
  }
}
