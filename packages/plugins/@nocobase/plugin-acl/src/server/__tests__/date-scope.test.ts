/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { dayjs } from '@nocobase/utils';
import { prepareApp } from './prepare';

describe('date variables in role scopes', () => {
  it('filters list and get at the local calendar boundary and rejects unknown date variables', async () => {
    const app = await prepareApp();
    try {
      const role = 'date-reader';
      await app.db.getRepository('roles').create({ values: { name: role } });
      const user = await app.db.getRepository('users').create({ values: { nickname: role, roles: [{ name: role }] } });
      const agent = await app.agent().login(user, role);
      const endpoint = (app.resourcer.options.prefix || '').replace(/\/$/, '') + '/deadlines:';
      const dates = app.db.collection({ name: 'deadlines', fields: [{ name: 'day', type: 'dateOnly' }] });
      await dates.sync();
      const today = dayjs().utcOffset(14 * 60);
      const rows = [];
      for (const offset of [-1, 0, 1]) {
        rows.push(await dates.repository.create({ values: { day: today.add(offset, 'day').format('YYYY-MM-DD') } }));
      }
      await dates.repository.create({ values: { day: null } });
      const reader = app.acl.define({ role });
      for (const action of ['list', 'get'])
        reader.grantAction('deadlines:' + action, { filter: { day: { $dateAfter: '{{$nDate.now}}' } } });
      for (const [zone, cutoff] of [
        ['+14:00', today.format('YYYY-MM-DD')],
        ['-12:00', today.utcOffset(-12 * 60).format('YYYY-MM-DD')],
      ]) {
        const expected = rows.filter((row) => row.get('day') > cutoff);
        const list = await agent
          .get(endpoint + 'list')
          .query({ sort: 'id' })
          .set('X-Timezone', zone);
        expect(list.status).toBe(200);
        expect(list.body.data.map((row) => String(row.id))).toEqual(expected.map((row) => String(row.id)));
        for (const row of rows) {
          const get = await agent
            .get(endpoint + 'get')
            .query({ filterByTk: row.id })
            .set('X-Timezone', zone);
          expect(get.status).toBe(200);
          expect(get.body.data?.id ?? null).toBe(expected.includes(row) ? row.id : null);
        }
      }
      reader.grantAction('deadlines:list', { filter: { day: { $dateAfter: '{{$nDate.missing}}' } } });
      expect((await agent.get(endpoint + 'list').set('X-Timezone', '+14:00')).status).toBe(403);
    } finally {
      await app.destroy();
    }
  });
});
