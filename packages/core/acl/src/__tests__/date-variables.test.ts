/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { getDateVars, parseFilter } from '@nocobase/utils';
import { parseJsonTemplate } from '../acl';

const now = '2026-10-31T10:00:00.500Z';

describe('ACL date variables', () => {
  let db: Database;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(now));
    db = new Database({ dialect: 'postgres' });
    db.collection({
      name: 'deadlines',
      fields: [
        { name: 'day', type: 'dateOnly' },
        { name: 'local', type: 'datetimeNoTz' },
        { name: 'instant', type: 'date' },
        { name: 'timestamp', type: 'unixTimestamp' },
        { name: 'gmt', type: 'date', uiSchema: { 'x-component-props': { gmt: true } } },
      ],
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    await db.close();
  });

  it.each(['$date', '$nDate'])('resolves %s.now for the supported date fields', async (namespace) => {
    for (const name of ['day', 'local', 'instant', 'timestamp']) {
      expect(
        await parseJsonTemplate(
          { [name]: { $dateAfter: `{{${namespace}.now}}` } },
          { collection: db.getCollection('deadlines'), timezone: '+14:00' },
        ),
      ).toEqual({ [name]: { $dateAfter: now } });
    }
  });

  it.each(['+14:00', '-12:00'])(
    'matches ordinary query date variables at the month boundary in %s',
    async (timezone) => {
      const collection = db.getCollection('deadlines');
      for (const name of ['today', 'thisMonth', 'last7Days']) {
        const filter = { $or: [{ day: { $dateOn: `{{$date.${name}}}` } }, { gmt: { $dateOn: `{{$nDate.${name}}}` } }] };
        const expected = await parseFilter(filter, {
          timezone,
          now,
          vars: { $date: getDateVars(), $nDate: getDateVars() },
          getField: (path: string) => collection.getField(path.split('.')[2]),
        });
        expect(await parseJsonTemplate(filter, { collection, timezone })).toEqual(expected);
      }
      expect(await parseJsonTemplate({ gmt: { $dateOn: '{{$nDate.today}}' } }, { collection, timezone })).toEqual({
        gmt: { $dateOn: '2026-10-31+00:00' },
      });
    },
  );

  it('resolves association field paths inside boolean groups', async () => {
    const collection = db.collection({
      name: 'projects',
      fields: [{ name: 'deadline', type: 'belongsTo', target: 'deadlines' }],
    });
    expect(
      await parseJsonTemplate(
        { $and: [{ 'deadline.gmt': { $dateOn: '{{ $nDate.today }}' } }] },
        { collection, timezone: '+14:00' },
      ),
    ).toEqual({ $and: [{ deadline: { gmt: { $dateOn: '2026-10-31+00:00' } } }] });
  });

  it('preserves literal filters and non-date variables alongside date variables', async () => {
    const filter = {
      $and: [
        { local: { $dateBefore: '2026-11-01 00:00:00' } },
        { day: { $dateOn: '2026-11-01' } },
        { day: { $dateOn: '{{ctx.state.cutoff}}' } },
        { instant: { $dateAfter: '{{$nDate.now}}' } },
        { owner: { $eq: '{{$user.id}}' } },
        { role: { $eq: '{{$nRole}}' } },
        { custom: { $eq: '{{$custom.value}}' } },
      ],
    };
    expect(
      await parseJsonTemplate(filter, {
        collection: db.getCollection('deadlines'),
        timezone: '+14:00',
        state: { cutoff: '2026-11-01', currentRole: 'reader' },
        userProvider: async () => ({ id: 7 }),
      }),
    ).toEqual({
      $and: [
        { local: { $dateBefore: '2026-11-01 00:00:00+14:00' } },
        { day: { $dateOn: '2026-11-01+14:00' } },
        { day: { $dateOn: '2026-11-01+14:00' } },
        { instant: { $dateAfter: now } },
        { owner: { $eq: 7 } },
        { role: { $eq: 'reader' } },
        { custom: { $eq: null } },
      ],
    });
  });
});
