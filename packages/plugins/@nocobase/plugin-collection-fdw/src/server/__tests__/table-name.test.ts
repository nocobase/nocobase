/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { REPLACE_TABLE_NAME_REGEX } from '../bridges/remote-local-bridge';

describe('replace table name', () => {
  it('should replace lowercase table name', () => {
    const sql = 'CREATE TABLE public.lowercase';
    const result = sql.replace(REPLACE_TABLE_NAME_REGEX, `CREATE TABLE "public"."test"`);
    expect(result).toBe('CREATE TABLE "public"."test"');
  });

  it('should replace uppercase table name', () => {
    const sql = 'CREATE TABLE "public"."UPPERCASE"';
    const result = sql.replace(REPLACE_TABLE_NAME_REGEX, `CREATE TABLE "public"."test"`);
    expect(result).toBe('CREATE TABLE "public"."test"');
  });
});
