/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { getCollectionFieldActionUrl } from '../collectionFieldApi';

describe('getCollectionFieldActionUrl', () => {
  it('builds field action urls for main and external data sources', () => {
    expect(getCollectionFieldActionUrl('main', 'orders', 'list')).toBe('collections/orders/fields:list');
    expect(getCollectionFieldActionUrl('external', 'orders', 'create')).toBe(
      'dataSourcesCollections/external.orders/fields:create',
    );
  });

  it('appends encoded filterByTk when provided', () => {
    expect(getCollectionFieldActionUrl('main', 'orders', 'update', 'title/id')).toBe(
      'collections/orders/fields:update?filterByTk=title%2Fid',
    );
    expect(getCollectionFieldActionUrl('external', 'orders', 'destroy', 12)).toBe(
      'dataSourcesCollections/external.orders/fields:destroy?filterByTk=12',
    );
  });
});
