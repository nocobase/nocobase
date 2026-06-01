/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  createUiLayout,
  deleteUiLayouts,
  getUiLayoutRouteUrl,
  type UiLayoutFormValues,
  type UiLayoutResource,
  updateUiLayout,
} from '../pages/UiLayoutsPage';

const formValues: UiLayoutFormValues = {
  uid: 'desktop-layout',
  layoutType: 'desktop',
  routeName: 'adminDesktop',
  routePath: '/admin',
  authCheck: true,
  enabled: true,
};

function makeResource(overrides: Partial<UiLayoutResource> = {}): UiLayoutResource {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('plugin-ui-layout submit pipeline', () => {
  it('should fire resource.create with the form values', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await createUiLayout({ resource, values: formValues, onSubmitted });

    expect(resource.create).toHaveBeenCalledTimes(1);
    expect(resource.create).toHaveBeenCalledWith({ values: formValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onSubmitted when resource.create rejects', async () => {
    const resource = makeResource({ create: vi.fn().mockRejectedValue(new Error('boom')) });
    const onSubmitted = vi.fn();

    await expect(createUiLayout({ resource, values: formValues, onSubmitted })).rejects.toThrow(/boom/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should fire resource.update with the numeric id as filterByTk on edit', async () => {
    const resource = makeResource();
    const onSubmitted = vi.fn();

    await updateUiLayout({ resource, filterByTk: 42, values: formValues, onSubmitted });

    expect(resource.update).toHaveBeenCalledTimes(1);
    expect(resource.update).toHaveBeenCalledWith({ filterByTk: 42, values: formValues });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onSubmitted when resource.update rejects', async () => {
    const resource = makeResource({ update: vi.fn().mockRejectedValue(new Error('nope')) });
    const onSubmitted = vi.fn();

    await expect(updateUiLayout({ resource, filterByTk: 1, values: formValues, onSubmitted })).rejects.toThrow(/nope/);
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it('should fire resource.destroy with the numeric id as filterByTk on row delete', async () => {
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteUiLayouts({ resource, filterByTk: 42, onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: 42 });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should fire resource.destroy with selected ids on batch delete', async () => {
    const resource = makeResource();
    const onDeleted = vi.fn();

    await deleteUiLayouts({ resource, filterByTk: [42, 43], onDeleted });

    expect(resource.destroy).toHaveBeenCalledTimes(1);
    expect(resource.destroy).toHaveBeenCalledWith({ filterByTk: [42, 43] });
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('should not invoke onDeleted when resource.destroy rejects', async () => {
    const resource = makeResource({ destroy: vi.fn().mockRejectedValue(new Error('delete failed')) });
    const onDeleted = vi.fn();

    await expect(deleteUiLayouts({ resource, filterByTk: 1, onDeleted })).rejects.toThrow(/delete failed/);
    expect(onDeleted).not.toHaveBeenCalled();
  });
});

describe('plugin-ui-layout route URL', () => {
  it('should build route URL from router basename', () => {
    expect(
      getUiLayoutRouteUrl(
        {
          router: {
            getBasename: () => '/v2/apps/app1',
          },
        },
        '/admin',
      ),
    ).toBe('/v2/apps/app1/admin');
  });

  it('should fall back to app route URL', () => {
    expect(
      getUiLayoutRouteUrl(
        {
          getRouteUrl: (pathname: string) => `/v2/${pathname.replace(/^\/+/, '')}`,
        },
        '/mobile',
      ),
    ).toBe('/v2/mobile');
  });

  it('should keep absolute URLs unchanged', () => {
    expect(getUiLayoutRouteUrl(undefined, 'https://www.nocobase.com/docs')).toBe('https://www.nocobase.com/docs');
  });
});
