/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MariaDBTypeInterfaceMap } from './mariadb';
import { MySQLTypeInterfaceMap } from './mysql';
import { PostTypeInterfaceMap } from './postgres';

export const getInterfaceTypeMapByDialect = (dialect: string) => {
  switch (dialect) {
    case 'mysql':
      return MySQLTypeInterfaceMap;
    case 'mariadb':
      return MariaDBTypeInterfaceMap;
    case 'postgres':
      return PostTypeInterfaceMap;
    default:
      throw new Error(`Unsupported dialect: ${dialect}`);
  }
};
