/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { CollectionTemplateRegistry } from '../plugin';
import { DataSourcePermissionTabRegistry, type DataSourcePermissionTabProps } from '../registries';

function PermissionTab() {
  return null;
}

const tabProps: DataSourcePermissionTabProps = {
  activeRole: null,
  availableActions: [],
  dataSource: {
    key: 'main',
  },
  t: (key) => key,
};

describe('data source manager registries', () => {
  it('keeps non-creatable collection templates registered while hiding them from create options', () => {
    const registry = new CollectionTemplateRegistry();

    registry.register({
      name: 'general',
      title: 'General collection',
      order: 10,
    });
    registry.register({
      name: 'calendar',
      title: 'Calendar collection',
      order: 20,
      creatable: false,
    });

    expect(registry.getAll().map((item) => item.name)).toEqual(['general', 'calendar']);
    expect(registry.getCreatable().map((item) => item.name)).toEqual(['general']);
  });

  it('returns sorted data source permission tabs and filters empty resolvers', () => {
    const registry = new DataSourcePermissionTabRegistry();

    registry.add({
      key: 'late',
      label: 'Late',
      sort: 20,
      componentLoader: async () => ({ default: PermissionTab }),
    });
    registry.add(() => null);
    registry.add({
      key: 'early',
      label: 'Early',
      sort: 10,
      componentLoader: async () => ({ default: PermissionTab }),
    });

    expect(registry.getPermissionTabs(tabProps).map((item) => item.key)).toEqual(['early', 'late']);
  });

  it('overwrites data source permission tabs with the same key', () => {
    const registry = new DataSourcePermissionTabRegistry();

    registry.add({
      key: 'custom',
      label: 'Before',
      componentLoader: async () => ({ default: PermissionTab }),
    });
    registry.add({
      key: 'custom',
      label: 'After',
      componentLoader: async () => ({ default: PermissionTab }),
    });

    expect(registry.getPermissionTabs(tabProps)).toMatchObject([
      {
        key: 'custom',
        label: 'After',
      },
    ]);
  });
});
