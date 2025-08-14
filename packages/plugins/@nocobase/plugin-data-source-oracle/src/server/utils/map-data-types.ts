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
    case 'NUMBER':
      return 'integer';
    case 'FLOAT':
      return 'float';
    case 'VARCHAR2':
    case 'NVARCHAR2':
    case 'CHAR':
    case 'NCHAR':
    case 'CLOB':
    case 'NCLOB':
      return 'string';
    case 'DATE':
    case 'TIMESTAMP':
      return 'datetime';
    default:
      return 'string';
  }
}
