/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { RouteRepository } from '../RouteRepository';

describe('RouteRepository', () => {
  const createRepository = () => {
    const resource = {
      create: vi.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
      update: vi.fn().mockResolvedValue({ data: { data: { id: 1 } } }),
      destroy: vi.fn().mockResolvedValue({ data: { data: true } }),
      move: vi.fn().mockResolvedValue({ data: { data: true } }),
    };
    const api = {
      request: vi.fn().mockResolvedValue({
        data: {
          data: [{ id: 1, schemaUid: 'schema-1' }],
        },
      }),
      resource: vi.fn().mockReturnValue(resource),
    };
    return {
      api,
      resource,
      repository: new RouteRepository({ api }),
    };
  };

  it('should refresh accessible routes and notify subscribers', async () => {
    const { api, repository } = createRepository();
    const subscriber = vi.fn();
    const unsubscribe = repository.subscribe(subscriber);

    await expect(repository.refreshAccessible()).resolves.toEqual([{ id: 1, schemaUid: 'schema-1' }]);
    expect(api.request).toHaveBeenCalledWith({
      url: '/desktopRoutes:listAccessible',
      params: { tree: true, sort: 'sort' },
    });
    expect(repository.listAccessible()).toEqual([{ id: 1, schemaUid: 'schema-1' }]);
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();
    repository.setRoutes([]);
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should create route and refresh repository cache by default', async () => {
    const { resource, repository } = createRepository();
    const refreshSpy = vi.spyOn(repository, 'refreshAccessible').mockResolvedValue([]);

    await repository.createRoute({ title: 'Menu 1' });

    expect(resource.create).toHaveBeenCalledWith({
      values: { title: 'Menu 1' },
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('should update routes with array filter via id.$in', async () => {
    const { resource, repository } = createRepository();
    const refreshSpy = vi.spyOn(repository, 'refreshAccessible').mockResolvedValue([]);

    await repository.updateRoute([1, 2], { hidden: true });

    expect(resource.update).toHaveBeenCalledWith({
      filter: {
        id: {
          $in: [1, 2],
        },
      },
      values: { hidden: true },
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('should skip refresh when delete opts out', async () => {
    const { resource, repository } = createRepository();
    const refreshSpy = vi.spyOn(repository, 'refreshAccessible').mockResolvedValue([]);

    await repository.deleteRoute(1, { refreshAfterMutation: false });

    expect(resource.destroy).toHaveBeenCalledWith({
      filterByTk: 1,
    });
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  it('should move route and refresh with desktopRoutes by default', async () => {
    const { resource, repository } = createRepository();
    const refreshSpy = vi.spyOn(repository, 'refreshAccessible').mockResolvedValue([]);

    await repository.moveRoute({
      sourceId: 1,
      targetId: 2,
      method: 'insertAfter',
    });

    expect(resource.move).toHaveBeenCalledWith({
      sourceId: 1,
      targetId: 2,
      method: 'insertAfter',
    });
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});
