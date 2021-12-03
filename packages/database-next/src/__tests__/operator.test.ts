import { mockDatabase } from './index';

describe('operator test', () => {
  test('date operator', async () => {
    const db = mockDatabase({
      logging: console.log,
    });

    const User = db.collection({
      name: 'users',
      fields: [
        {
          name: 'birthday',
          type: 'date',
        },
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await db.sync();

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateOn': '1990-01-01' },
    });

    expect(user.get('name')).toEqual('user1');
  });
});
