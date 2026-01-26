/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function loadMysqlDriver() {
  return require('mysql2/promise');
}

export function loadMariadbDriver() {
  return require('mariadb');
}

export function loadPgModule() {
  return require('pg');
}
