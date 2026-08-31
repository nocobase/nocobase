/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op } from 'sequelize';
import stringOperators from '../string';

describe('SQL Server string operator', () => {
  const ctx = {
    db: {
      sequelize: {
        getDialect: () => 'mssql',
      },
    },
  };

  it('should escape LIKE wildcard characters', () => {
    const condition = stringOperators.$includes('[2026]%_010', ctx);

    expect(condition[Op.like]).toBe('%[[]2026][%][_]010%');
  });
});
