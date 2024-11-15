/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mockDatabase } from '..';
import { Database } from '../../database';
import { Collection } from '../../collection';
import { DatetimeInterface } from '../../interfaces/datetime-interface';
import dayjs from 'dayjs';

describe('Date time interface', () => {
  let db: Database;
  let testCollection: Collection;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    testCollection = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'date',
          type: 'date',
        },
        {
          name: 'dateOnly',
          type: 'date',
          uiSchema: {
            ['x-component-props']: {
              showTime: false,
              gmt: false,
            },
          },
        },
        {
          name: 'dateTime',
          type: 'datetime',
          uiSchema: {
            ['x-component-props']: {
              showTime: true,
            },
          },
        },
        {
          name: 'dateTimeGmt',
          type: 'date',
          uiSchema: {
            ['x-component-props']: {
              showTime: true,
              gmt: true,
            },
          },
        },
      ],
    });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should to value', async () => {
    const interfaceInstance = new DatetimeInterface();
    expect(await interfaceInstance.toValue('')).toBe(null);

    expect(await interfaceInstance.toValue('20231223')).toBe(dayjs('2023-12-23 00:00:00.000').toISOString());
    expect(await interfaceInstance.toValue('2023/12/23')).toBe(dayjs('2023-12-23 00:00:00.000').toISOString());
    expect(await interfaceInstance.toValue('2023-12-23')).toBe(dayjs('2023-12-23 00:00:00.000').toISOString());
    expect(await interfaceInstance.toValue(42510)).toBe('2016-05-20T00:00:00.000Z');
    expect(await interfaceInstance.toValue('42510')).toBe('2016-05-20T00:00:00.000Z');
    expect(await interfaceInstance.toValue('2016-05-20T00:00:00.000Z')).toBe('2016-05-20T00:00:00.000Z');
  });
});
