/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { prepareApp } from './prepare';

const now = '2026-10-31T10:00:00.500Z';

describe('date variables in role scopes', () => {
  it.each(['date', 'dateOnly', 'datetimeNoTz', 'unixTimestamp'])(
    'matches ordinary list/get filters for %s with both date namespaces and request timezones',
    async (type) => {
      const app = await prepareApp();
      try {
        const role = 'date-reader';
        await app.db.getRepository('roles').create({ values: { name: role } });
        const user = await app.db
          .getRepository('users')
          .create({ values: { nickname: role, roles: [{ name: role }] } });
        const agent = await app.agent().login(user, role);
        const admin = await app.agent().login(1, 'root');
        const endpoint = (app.resourcer.options.prefix || '').replace(/\/$/, '') + '/deadlines:';
        const dates = app.db.collection({ name: 'deadlines', fields: [{ name: 'value', type }] });
        await dates.sync();
        const rows = [];
        for (const value of ['2026-10-30', '2026-10-31', '2026-11-01', null]) {
          rows.push(await dates.repository.create({ values: { value } }));
        }
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(now));
        const reader = app.acl.define({ role });
        for (const namespace of ['$date', '$nDate']) {
          const filter = { value: { $dateAfter: `{{${namespace}.now}}` } };
          for (const action of ['list', 'get']) {
            reader.grantAction('deadlines:' + action, { filter });
          }
          for (const timezone of ['+14:00', '-12:00']) {
            const expected = await admin
              .get(endpoint + 'list')
              .query({ filter, sort: 'id' })
              .set('X-Timezone', timezone);
            expect(expected.status).toBe(200);
            expect(expected.body.data.map((row) => row.id)).toEqual([rows[2].id]);
            const list = await agent
              .get(endpoint + 'list')
              .query({ sort: 'id' })
              .set('X-Timezone', timezone);
            expect(list.status).toBe(200);
            expect(list.body.data.map((row) => row.id)).toEqual(expected.body.data.map((row) => row.id));
            for (const row of rows) {
              const get = await agent
                .get(endpoint + 'get')
                .query({ filterByTk: row.id })
                .set('X-Timezone', timezone);
              expect(get.status).toBe(200);
              expect(get.body.data?.id ?? null).toBe(row.id === rows[2].id ? row.id : null);
            }
          }
        }
      } finally {
        vi.useRealTimers();
        await app.destroy();
      }
    },
  );
});
