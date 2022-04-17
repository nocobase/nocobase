import { mockDatabase } from '../index';
import { Collection } from '../../collection';
import Database from '../../database';

describe('date operator test', () => {
  let db: Database;

  let User: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();

    User = db.collection({
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

    await db.sync({ force: true, alter: { drop: false } });
  });

  test('$dateOn', async () => {
    const u0 = await User.repository.create({
      values: {
        birthday: '1990-01-02 12:03:02',
        name: 'u0',
      },
    });

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01 12:03:02',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateOn': '1990-01-01' },
    });

    expect(user.get('id')).toEqual(user1.get('id'));
  });

  test('$dateNotOn', async () => {
    const u0 = await User.repository.create({
      values: {
        birthday: '1990-01-02 12:03:02',
        name: 'u0',
      },
    });

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01 12:03:02',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateNotOn': '1990-01-01' },
    });

    expect(user.get('id')).toEqual(u0.get('id'));
  });

  test('$dateBefore', async () => {
    const u0 = await User.repository.create({
      values: {
        birthday: '1990-05-01 12:03:02',
        name: 'u0',
      },
    });

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01 12:03:02',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateBefore': '1990-04-01' },
    });

    expect(user.get('id')).toEqual(user1.get('id'));
  });

  test('$dateNotBefore', async () => {
    const u0 = await User.repository.create({
      values: {
        birthday: '1990-05-01 12:03:02',
        name: 'u0',
      },
    });

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01 12:03:02',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateNotBefore': '1990-04-01' },
    });

    expect(user.get('id')).toEqual(u0.get('id'));
  });

  test('$dateAfter', async () => {
    const u0 = await User.repository.create({
      values: {
        birthday: '1990-05-01 12:03:02',
        name: 'u0',
      },
    });

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01 12:03:02',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateAfter': '1990-04-01' },
    });

    expect(user.get('id')).toEqual(u0.get('id'));
  });

  test('$dateNotAfter', async () => {
    const u0 = await User.repository.create({
      values: {
        birthday: '1990-05-01 12:03:02',
        name: 'u0',
      },
    });

    const user1 = await User.repository.create({
      values: {
        birthday: '1990-01-01 12:03:02',
        name: 'user1',
      },
    });

    const user = await User.repository.findOne({
      filter: { 'birthday.$dateNotAfter': '1990-04-01' },
    });

    expect(user.get('id')).toEqual(user1.get('id'));
  });
});
