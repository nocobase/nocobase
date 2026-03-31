/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, createMockDatabase } from '@nocobase/database';
import { IdentifierError } from '../../errors/identifier-error';

describe('has many field', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should throw error when associated with item that null with source key', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: true,
      timestamps: false,
      fields: [
        { type: 'string', name: 'name', unique: true },
        {
          type: 'hasOne',
          name: 'profile',
          target: 'profiles',
          foreignKey: 'userName',
          sourceKey: 'name',
        },
      ],
    });

    const Profile = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'string',
          name: 'address',
        },
      ],
    });

    await db.sync();

    await expect(
      User.repository.create({
        values: {
          profile: {
            address: 'address1',
          },
        },
      }),
    ).rejects.toThrow('The source key name is not set in users');
  });

  it('should check has one association keys type', async () => {
    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'bigInt', name: 'content' }],
    });

    let error;
    try {
      const User = db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'hasOne',
            name: 'profile',
            foreignKey: 'content', // wrong type
            sourceKey: 'name',
          },
        ],
      });
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toBe(
      'Foreign key "content" type "BIGINT" does not match source key "name" type "STRING" in has one relation "profile" of collection "users"',
    );
  });
  it('association undefined', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile' }],
    });
    await db.sync();
    expect(User.model.associations.profile).toBeUndefined();
  });

  it('association defined', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile' }],
    });
    expect(User.model.associations.phone).toBeUndefined();
    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'string', name: 'content' }],
    });
    const association = User.model.associations.profile;
    expect(association).toBeDefined();
    expect(association.foreignKey).toBe('userId');
    // @ts-ignore
    expect(association.sourceKey).toBe('id');
    expect(Profile.model.rawAttributes['userId']).toBeDefined();
    await db.sync();
    // const post = await model.create<any>();
    // await post.createComment({
    //   content: 'content111',
    // });
    // const postComments = await post.getComments();
    // expect(postComments.map((comment) => comment.content)).toEqual([
    //   'content111',
    // ]);
  });

  it('schema delete', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile' }],
    });
    const Profile = db.collection({
      name: 'profiles',
      fields: [{ type: 'belongsTo', name: 'user' }],
    });
    await db.sync();
    User.removeField('profile');
    expect(User.model.associations.profile).toBeUndefined();
    expect(Profile.model.rawAttributes.userId).toBeDefined();
    Profile.removeField('user');
    expect(Profile.model.rawAttributes.userId).toBeUndefined();
  });

  it('should throw error when foreignKey is too long', async () => {
    const longForeignKey = 'a'.repeat(128);

    const User = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile', foreignKey: longForeignKey }],
    });

    let error;
    try {
      const Profile = db.collection({
        name: 'profiles',
        fields: [{ type: 'belongsTo', name: 'user' }],
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(IdentifierError);
  });
});
