/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { vi } from 'vitest';

describe('find with invalid appends', () => {
  let db: Database;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    warnSpy = vi.spyOn(db.logger, 'warn');
  });

  afterEach(async () => {
    warnSpy.mockRestore();
    await db.close();
  });

  it('should warn and skip when appending a non-existent association', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ name: 'name', type: 'string' }],
    });

    await db.sync();

    await User.repository.create({ values: { name: 'u1' } });

    const rows = await User.repository.find({
      appends: ['nonExistentRelation'],
    });

    expect(rows.length).toBe(1);
    expect(rows[0].get('name')).toBe('u1');
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain('nonExistentRelation');
  });

  it('should warn and skip multiple non-existent associations', async () => {
    const User = db.collection({
      name: 'users',
      fields: [{ name: 'name', type: 'string' }],
    });

    await db.sync();

    await User.repository.create({ values: { name: 'u1' } });

    const rows = await User.repository.find({
      appends: ['badRelation1', 'badRelation2'],
    });

    expect(rows.length).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain('badRelation1');
    expect(warnSpy.mock.calls[0][0]).toContain('badRelation2');
  });

  it('should still load valid appends when mixed with non-existent ones', async () => {
    db.collection({
      name: 'profiles',
      fields: [{ name: 'bio', type: 'string' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'profile', type: 'belongsTo', target: 'profiles' },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: { name: 'u1', profile: { bio: 'hello' } },
    });

    const rows = await User.repository.find({
      appends: ['profile', 'nonExistent'],
    });

    expect(rows.length).toBe(1);
    expect(rows[0].get('profile')).toBeTruthy();
    expect(rows[0].get('profile').get('bio')).toBe('hello');
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain('nonExistent');
    expect(warnSpy.mock.calls[0][0]).not.toContain('profile');
  });

  it('should warn when nested append has non-existent association', async () => {
    db.collection({
      name: 'profiles',
      fields: [{ name: 'bio', type: 'string' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'profile', type: 'belongsTo', target: 'profiles' },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: { name: 'u1', profile: { bio: 'hello' } },
    });

    const rows = await User.repository.find({
      appends: ['profile.nonExistentNested'],
    });

    expect(rows.length).toBe(1);
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain('nonExistentNested');
  });

  it('should not warn when all appends are valid', async () => {
    db.collection({
      name: 'profiles',
      fields: [{ name: 'bio', type: 'string' }],
    });

    const User = db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'profile', type: 'belongsTo', target: 'profiles' },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: { name: 'u1', profile: { bio: 'hello' } },
    });

    const rows = await User.repository.find({
      appends: ['profile'],
    });

    expect(rows.length).toBe(1);
    expect(rows[0].get('profile')).toBeTruthy();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
