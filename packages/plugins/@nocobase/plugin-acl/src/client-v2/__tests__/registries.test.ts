/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ACLSettingsUI, RolesManager, type PermissionTabProps } from '../registries';

describe('RolesManager', () => {
  it('keeps role tabs sorted by configured sort value and supports replacement by name', async () => {
    const manager = new RolesManager();
    const lateLoader = vi.fn(async () => ({ default: () => null }));
    const earlyLoader = vi.fn(async () => ({ default: () => null }));
    const replacementLoader = vi.fn(async () => ({ default: () => null }));

    manager.add('late', { title: 'Late', sort: 200, componentLoader: lateLoader });
    manager.add('early', { title: 'Early', sort: 10, componentLoader: earlyLoader });
    manager.add('late', { title: 'Replacement', sort: 5, componentLoader: replacementLoader });

    expect(manager.list()).toEqual([
      ['late', { title: 'Replacement', sort: 5, componentLoader: replacementLoader }],
      ['early', { title: 'Early', sort: 10, componentLoader: earlyLoader }],
    ]);
  });
});

describe('ACLSettingsUI', () => {
  const props: PermissionTabProps = {
    activeKey: 'general',
    activeRole: { name: 'admin', title: 'Admin' },
    currentUserRole: { name: 'root', title: 'Root' },
    onRoleChange: vi.fn(),
  };

  it('resolves static and dynamic permission tabs, filters disabled tabs, and sorts them', async () => {
    const settingsUI = new ACLSettingsUI();
    const generalLoader = vi.fn(async () => ({ default: () => null }));
    const menuLoader = vi.fn(async () => ({ default: () => null }));

    settingsUI.addPermissionsTab({
      key: 'menu',
      label: 'Desktop routes',
      sort: 20,
      componentLoader: menuLoader,
    });
    settingsUI.addPermissionsTab((inputProps) => {
      expect(inputProps).toBe(props);
      return {
        key: 'general',
        label: 'System',
        sort: 10,
        componentLoader: generalLoader,
      };
    });
    settingsUI.addPermissionsTab(() => null);

    expect(settingsUI.getPermissionsTabs(props)).toEqual([
      {
        key: 'general',
        label: 'System',
        sort: 10,
        componentLoader: generalLoader,
      },
      {
        key: 'menu',
        label: 'Desktop routes',
        sort: 20,
        componentLoader: menuLoader,
      },
    ]);
  });
});
