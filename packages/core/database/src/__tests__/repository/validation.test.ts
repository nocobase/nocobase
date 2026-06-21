/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';
import { randomStr } from '@nocobase/test';
import { uid } from '@nocobase/utils';

describe('validation', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  describe('string field validation', () => {
    let StringCollection: Collection;
    beforeEach(async () => {
      StringCollection = db.collection({
        name: 'test',
        fields: [
          {
            type: 'string',
            name: 'name',
            allowNull: true,
            validation: {
              type: 'string',
              rules: [
                { key: `r_${uid()}`, name: 'required' },
                { key: `r_${uid()}`, name: 'min', args: { limit: 2 } },
                { key: `r_${uid()}`, name: 'max', args: { limit: 5 } },
                { key: `r_${uid()}`, name: 'pattern', args: { regex: /^[a-zA-Z]+$/ } }, // only letters
              ],
            },
          },
        ],
      });
      await db.sync();
    });

    it('should throw validation error for string field that is too short', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: 'a',
          },
        }),
      ).rejects.toThrow();
    });

    it('should throw validation error for string field that is too long', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: 'abcdef',
          },
        }),
      ).rejects.toThrow();
    });

    it('should throw validation error for invalid pattern', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: 'abc123',
          },
        }),
      ).rejects.toThrow();
    });

    it('should succeed with valid string values', async () => {
      const result = await StringCollection.repository.create({
        values: {
          name: 'abc',
        },
      });

      expect(result.get('name')).toBe('abc');
    });

    it('should throw validation error for invalid null', async () => {
      await expect(
        StringCollection.repository.create({
          values: {
            name: null,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('number field validation', () => {
    let NumberCollection: Collection;
    beforeEach(async () => {
      NumberCollection = db.collection({
        name: 'numbers',
        fields: [
          {
            type: 'double',
            name: 'amount',
            allowNull: true,
            validation: {
              type: 'number',
              rules: [{ key: `r_${uid()}`, name: 'precision', args: { limit: 2 } }],
            },
          },
        ],
      });
      await db.sync();
    });

    it('should throw validation error when precision exceeds limit', async () => {
      await expect(
        NumberCollection.repository.create({
          values: {
            amount: 1.234,
          },
        }),
      ).rejects.toThrow();
    });

    it('should throw validation error when precision exceeds limit with string input', async () => {
      await expect(
        NumberCollection.repository.create({
          values: {
            amount: '1.234',
          },
        }),
      ).rejects.toThrow();
    });

    it('should succeed when precision is within limit', async () => {
      const result = await NumberCollection.repository.create({
        values: {
          amount: 1.23,
        },
      });

      expect(result.get('amount')).toBeCloseTo(1.23, 10);
    });

    it('should succeed when precision is within limit with string input', async () => {
      const result = await NumberCollection.repository.create({
        values: {
          amount: '1.23',
        },
      });

      expect(result.get('amount')).toBeCloseTo(1.23, 10);
    });

    it('should succeed when zero string input keeps fixed decimal places within precision limit', async () => {
      const result = await NumberCollection.repository.create({
        values: {
          amount: '0.00',
        },
      });

      expect(result.get('amount')).toBeCloseTo(0, 10);
    });

    it('should throw validation error when string input has trailing decimals beyond precision limit', async () => {
      await expect(
        NumberCollection.repository.create({
          values: {
            amount: '1.230',
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe('date field validation', () => {
    let DateCollection: Collection;

    beforeEach(async () => {
      DateCollection = db.collection({
        name: 'dates',
        fields: [
          {
            type: 'date',
            name: 'scheduledAt',
            allowNull: true,
            validation: {
              type: 'date',
              rules: [{ key: `r_${uid()}`, name: 'required' }],
            },
          },
        ],
      });

      await db.sync();
    });

    it('should accept date string input when validation type is date', async () => {
      const result = await DateCollection.repository.create({
        values: {
          scheduledAt: '2026-03-13 10:00:00',
        },
      });

      expect(result.get('scheduledAt')).toBeTruthy();
    });
  });

  describe('association field validation', () => {
    let User: Collection;
    let Profile: Collection;
    beforeEach(async () => {
      User = db.collection({
        name: 'users',
        fields: [
          { type: 'hasOne', name: 'profile' },
          { type: 'belongsTo', name: 'group' },
          { type: 'string', name: 'name' },
        ],
      });

      Profile = db.collection({
        name: 'profiles',
        fields: [
          {
            type: 'string',
            name: 'avatar',
            validation: {
              type: 'string',
              rules: [{ key: `r_${uid()}`, name: 'length', args: { limit: 2 } }],
            },
          },
        ],
      });

      await db.sync();
    });

    it('should throw validation error for invalid avatar', async () => {
      await expect(
        User.repository.create({
          values: {
            name: randomStr().slice(0, 2),
            profile: {
              avatar: 'avatar',
            },
          },
        }),
      ).rejects.toThrow();
    });

    it('should succeed with valid profile', async () => {
      const user = await User.repository.create({
        values: {
          name: randomStr().slice(0, 2),
          profile: {
            avatar: 'av',
          },
        },
      });

      expect(await user.getProfile()).toMatchObject({ avatar: 'av' });
    });

    it('should succeed when creating user with existing profile', async () => {
      const profile = await Profile.model.create({
        avatar: 'avatar',
      });
      const user = await User.repository.create({
        values: {
          name: randomStr().slice(0, 2),
          profile: {
            id: profile.get('id'),
            avatar: 'avatar',
          },
        },
      });

      expect(await user.getProfile()).toMatchObject({ avatar: 'avatar' });
    });
  });
});
