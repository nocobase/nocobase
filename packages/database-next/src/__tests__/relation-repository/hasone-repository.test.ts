import { mockDatabase } from '../index';
import { HasOneRepository } from '../../relation-repository/hasone-repository';

describe('has one repository', () => {
  let db;

  let User;
  let Profile;

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

  test('find', async () => {
    const user = await User.repository.create({
      name: 'u1',
    });

    const UserProfileRepository = new HasOneRepository(
      User,
      'profile',
      user.id,
    );

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

    await UserProfileRepository.set(newProfile.id);
    userProfile = await UserProfileRepository.find();
    expect(userProfile['id']).toEqual(newProfile.id);

    await UserProfileRepository.update({
      values: {
        avatar: 'new_updated_avatar',
      },
    });
    expect((await UserProfileRepository.find())['avatar']).toEqual(
      'new_updated_avatar',
    );
    await UserProfileRepository.destroy();
    expect(await UserProfileRepository.find()).toBeNull();
  });
});
