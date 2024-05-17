/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { formatter } from '../actions/formatter';

describe('formatter', () => {
  const field = 'field';
  const format = 'YYYY-MM-DD hh:mm:ss';
  it('should return correct format for sqlite', () => {
    const sequelize = {
      fn: (fn: string, format: string, field: string) => ({
        fn,
        format,
        field,
      }),
      col: (field: string) => field,
      getDialect: () => 'sqlite',
    } as any;
    const result = formatter(sequelize, 'datetime', field, format) as any;
    expect(result.format).toEqual('%Y-%m-%d %H:%M:%S');
  });

  it('should return correct format for mysql', () => {
    const sequelize = {
      fn: (fn: string, field: string, format: string) => ({
        fn,
        format,
        field,
      }),
      col: (field: string) => field,
      getDialect: () => 'mysql',
    } as any;
    const result = formatter(sequelize, 'datetime', field, format) as any;
    expect(result.format).toEqual('%Y-%m-%d %H:%i:%S');
  });

  it('should return correct format for postgres', () => {
    const sequelize = {
      fn: (fn: string, field: string, format: string) => ({
        fn,
        format,
        field,
      }),
      col: (field: string) => field,
      getDialect: () => 'postgres',
    } as any;
    const result = formatter(sequelize, 'datetime', field, format) as any;
    expect(result.format).toEqual('YYYY-MM-DD HH24:MI:SS');
  });
});
