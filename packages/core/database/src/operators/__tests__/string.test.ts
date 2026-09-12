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

  it('should escape LIKE wildcard characters in array values', () => {
    const includesCondition = stringOperators.$includes(['[2026]010', '30%_'], ctx);
    const notIncludesCondition = stringOperators.$notIncludes(['[2026]010', '30%_'], ctx);

    expect(includesCondition[Op.or]).toEqual([{ [Op.like]: '%[[]2026]010%' }, { [Op.like]: '%30[%][_]%' }]);
    expect(notIncludesCondition[Op.and]).toEqual([{ [Op.notLike]: '%[[]2026]010%' }, { [Op.notLike]: '%30[%][_]%' }]);
  });
});
