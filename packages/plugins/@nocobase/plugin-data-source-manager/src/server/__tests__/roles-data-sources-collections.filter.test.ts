/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { matchesCollectionSearchFilter } from '../resourcers/roles-data-sources-collections';

const t = (key: string) => {
  const resources: Record<string, string> = {
    Users: '用户',
    Posts: '文章',
  };
  return resources[key] || key;
};

describe('roles.dataSourcesCollections filter helpers', () => {
  it('matches collection display name by translated visible title', () => {
    const collection = {
      options: {
        name: 'users',
        title: 'Users',
        uiSchema: {
          title: '{{t("Users")}}',
        },
      },
    };

    expect(
      matchesCollectionSearchFilter(
        collection,
        {
          $and: [{ title: { $includes: '用户' } }],
        },
        t,
      ),
    ).toBe(true);
  });

  it('matches translated title with a legacy namespace option', () => {
    const collection = {
      options: {
        name: 'users',
        title: '{{t("Users", {"ns":"client"})}}',
      },
    };

    expect(
      matchesCollectionSearchFilter(
        collection,
        {
          $and: [{ title: { $includes: '用户' } }],
        },
        t,
      ),
    ).toBe(true);
  });

  it('matches collection name by identifier', () => {
    const collection = {
      options: {
        name: 'users',
        title: 'Users',
      },
    };

    expect(
      matchesCollectionSearchFilter(
        collection,
        {
          $and: [{ name: { $includes: 'use' } }],
        },
        t,
      ),
    ).toBe(true);
  });

  it('preserves nested filter group logic', () => {
    const collection = {
      options: {
        name: 'posts',
        title: '{{t("Posts")}}',
      },
    };

    expect(
      matchesCollectionSearchFilter(
        collection,
        {
          $and: [
            {
              $or: [{ title: { $includes: '用户' } }, { name: { $includes: 'post' } }],
            },
          ],
        },
        t,
      ),
    ).toBe(true);
  });
});
