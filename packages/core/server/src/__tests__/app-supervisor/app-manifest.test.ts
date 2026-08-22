/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppSupervisor } from '../../app-supervisor';
import type { AppDiscoveryAdapter } from '../../app-supervisor';

describe('AppSupervisor app manifests', () => {
  let supervisor: AppSupervisor | undefined;

  afterEach(async () => {
    await supervisor?.destroy();
    supervisor = undefined;
    vi.restoreAllMocks();
  });

  it('stores manifests in the supervisor when the discovery adapter has no custom implementation', async () => {
    supervisor = AppSupervisor.getInstance();
    const customerPortal = {
      uid: 'customer',
      routePath: '/customer',
    };
    const partnerPortal = {
      uid: 'partner',
      routePath: '/partner',
    };

    await supervisor.setAppManifestItem('main', 'multi-portal', 'customer', customerPortal);
    await supervisor.setAppManifestItem('alpha', 'multi-portal', 'partner', partnerPortal);

    await expect(supervisor.getAppManifestItems('main', 'multi-portal')).resolves.toEqual([customerPortal]);
    await expect(supervisor.getAppManifests('multi-portal', ['main', 'alpha', 'beta'])).resolves.toEqual({
      main: [customerPortal],
      alpha: [partnerPortal],
    });

    await supervisor.removeAppManifestItem('main', 'multi-portal', 'customer');
    await expect(supervisor.getAppManifestItems('main', 'multi-portal')).resolves.toEqual([]);

    await supervisor.removeAppManifest('alpha', 'multi-portal');
    await expect(supervisor.getAppManifestItems('alpha', 'multi-portal')).resolves.toEqual([]);
  });

  it('prefers manifest methods implemented by the discovery adapter', async () => {
    supervisor = AppSupervisor.getInstance();
    const customItem = {
      uid: 'shared',
      routePath: '/shared',
    };
    const adapter: AppDiscoveryAdapter = {
      name: 'custom',
      setAppLastSeenAt: vi.fn(),
      getAppLastSeenAt: vi.fn(() => null),
      getAppStatus: vi.fn(() => null),
      setAppStatus: vi.fn(),
      setAppManifestItem: vi.fn(async () => undefined),
      removeAppManifestItem: vi.fn(async () => undefined),
      removeAppManifest: vi.fn(async () => undefined),
      getAppManifestItems: vi.fn(async () => [customItem]),
      getAppManifests: vi.fn(async () => ({ main: [customItem] })),
    };
    Reflect.set(supervisor, 'discoveryAdapter', adapter);

    await supervisor.setAppManifestItem('main', 'multi-portal', 'shared', customItem);
    await supervisor.removeAppManifestItem('main', 'multi-portal', 'shared');
    await supervisor.removeAppManifest('main', 'multi-portal');

    await expect(supervisor.getAppManifestItems('main', 'multi-portal')).resolves.toEqual([customItem]);
    await expect(supervisor.getAppManifests('multi-portal', ['main'])).resolves.toEqual({ main: [customItem] });

    expect(adapter.setAppManifestItem).toHaveBeenCalledWith('main', 'multi-portal', 'shared', customItem);
    expect(adapter.removeAppManifestItem).toHaveBeenCalledWith('main', 'multi-portal', 'shared');
    expect(adapter.removeAppManifest).toHaveBeenCalledWith('main', 'multi-portal');
    expect(adapter.getAppManifestItems).toHaveBeenCalledWith('main', 'multi-portal');
    expect(adapter.getAppManifests).toHaveBeenCalledWith('multi-portal', ['main']);
  });

  it('clears default manifests when the supervisor is destroyed', async () => {
    supervisor = AppSupervisor.getInstance();
    await supervisor.setAppManifestItem('main', 'multi-portal', 'customer', {
      uid: 'customer',
      routePath: '/customer',
    });

    await supervisor.destroy();
    supervisor = AppSupervisor.getInstance();

    await expect(supervisor.getAppManifestItems('main', 'multi-portal')).resolves.toEqual([]);
  });
});
