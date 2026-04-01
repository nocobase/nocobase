/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { collectUpdateAssociationValuesFromAssignRules } from '../assignRulesUpdateAssociationValues';

describe('collectUpdateAssociationValuesFromAssignRules', () => {
  it('collects deepest association path from targetPath', () => {
    const profileCollection: any = {
      getField: (name: string) => ({ name, isAssociationField: () => false }),
    };

    const userCollection: any = {
      getField: (name: string) => {
        if (name === 'profile') {
          return { name, isAssociationField: () => true, targetCollection: profileCollection };
        }
        return { name, isAssociationField: () => false };
      },
    };

    const rootCollection: any = {
      getField: (name: string) => {
        if (name === 'user') {
          return { name, isAssociationField: () => true, targetCollection: userCollection };
        }
        if (name === 'users') {
          return { name, isAssociationField: () => true, targetCollection: userCollection };
        }
        return { name, isAssociationField: () => false };
      },
    };

    const items = [
      { targetPath: 'title' },
      { targetPath: 'user.name' },
      { targetPath: 'user.profile.name' },
      { targetPath: 'users.nickname' },
    ];

    const out = collectUpdateAssociationValuesFromAssignRules(items as any, rootCollection);
    expect(out).toEqual(expect.arrayContaining(['user', 'user.profile', 'users']));
  });

  it('returns [] when targetPath does not traverse associations', () => {
    const rootCollection: any = {
      getField: (name: string) => ({ name, isAssociationField: () => false }),
    };

    const out = collectUpdateAssociationValuesFromAssignRules(
      [{ targetPath: 'jsonField.name' }] as any,
      rootCollection,
    );
    expect(out).toEqual([]);
  });

  it('ignores association targetKey-only paths (e.g. user.id)', () => {
    const userCollection: any = {
      getField: (name: string) => ({ name, isAssociationField: () => false }),
      filterTargetKey: 'id',
    };

    const rootCollection: any = {
      getField: (name: string) => {
        if (name === 'user') {
          return { name, isAssociationField: () => true, targetCollection: userCollection };
        }
        return { name, isAssociationField: () => false };
      },
    };

    const out = collectUpdateAssociationValuesFromAssignRules([{ targetPath: 'user.id' }] as any, rootCollection);
    expect(out).toEqual([]);
  });
});
