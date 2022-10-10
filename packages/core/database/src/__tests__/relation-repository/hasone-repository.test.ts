import { mockDatabase } from '../index';
import { HasOneRepository } from '../../relation-repository/hasone-repository';
import Database from '../../database';
import { Collection } from '../../collection';

describe('has one repository', () => {
  let db: Database;

  let User: Collection;
  let Profile: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    User = db.collection({
      name: 'users',
      fields: [
        { type: 'hasOne', name: 'profile' },
        { type: 'string', name: 'name' },
      ],
    });

    Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'string', name: 'avatar' }],
    });

    await db.sync();
  });

  test('create', async () => {
    const user = await User.repository.create({
      values: { name: 'u1' },
    });

    const userProfileRepository = new HasOneRepository(User, 'profile', user['id']);
    let profile = await userProfileRepository.find();

    profile = await userProfileRepository.create({
      values: {
        avatar: 'avatar1',
      },
    });

    console.log(profile.toJSON());
  });

  test('find', async () => {
    const user = await User.repository.create({
      values: { name: 'u1' },
    });

    const UserProfileRepository = new HasOneRepository(User, 'profile', user['id']);

    let userProfile = await UserProfileRepository.create({
      values: {
        avatar: 'test_avatar',
      },
    });

    expect(userProfile).toBeDefined();

    userProfile = await UserProfileRepository.find();
    expect(userProfile['avatar']).toEqual('test_avatar');
    userProfile = await UserProfileRepository.find({
      fields: ['id'],
    });
    expect(userProfile['id']).toBeDefined();
    expect(userProfile['avatar']).toBeUndefined();

    await UserProfileRepository.remove();
    expect(await UserProfileRepository.find()).toBeNull();

    const newProfile = await Profile.repository.create({
      values: { avatar: 'new_avatar' },
    });

    await UserProfileRepository.set(newProfile['id']);
    userProfile = await UserProfileRepository.find();
    expect(userProfile['id']).toEqual(newProfile['id']);

    await UserProfileRepository.update({
      values: {
        avatar: 'new_updated_avatar',
      },
    });

    expect((await UserProfileRepository.find())['avatar']).toEqual('new_updated_avatar');
    await UserProfileRepository.destroy();
    expect(await UserProfileRepository.find()).toBeNull();
  });
});
