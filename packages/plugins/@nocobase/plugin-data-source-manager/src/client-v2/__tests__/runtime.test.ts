/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataSource } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';
import { removeDataSourcesFromRuntime, syncDataSourcesToRuntime } from '../runtime';

describe('data source runtime helpers', () => {
  it('skips synchronization when runtime manager is unavailable', () => {
    expect(() => syncDataSourcesToRuntime(undefined, [{ key: 'main' }])).not.toThrow();
    expect(() => removeDataSourcesFromRuntime(undefined, ['external'])).not.toThrow();
  });

  it('patches existing data sources and adds missing runtime data sources', () => {
    const runtimeDataSources = new Map<
      string,
      { patchOptions?: ReturnType<typeof vi.fn>; setCollections: ReturnType<typeof vi.fn> }
    >();
    runtimeDataSources.set('main', {
      patchOptions: vi.fn(),
      setCollections: vi.fn(),
    });
    const manager = {
      addDataSource: vi.fn((options: { key: string }) => {
        runtimeDataSources.set(options.key, {
          setCollections: vi.fn(),
        });
      }),
      getDataSource: vi.fn((key: string) => runtimeDataSources.get(key)),
    };

    syncDataSourcesToRuntime(manager as never, [
      {
        key: 'main',
        displayName: 'Main',
        collections: [{ name: 'users' }],
      },
      {
        key: 'external',
        displayName: 'External',
        collections: [{ name: 'orders' }],
      },
      {
        key: 'empty',
        displayName: 'Empty',
      },
    ]);

    expect(runtimeDataSources.get('main')?.patchOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'main',
        use: undefined,
      }),
    );
    expect(runtimeDataSources.get('main')?.setCollections).toHaveBeenCalledWith([{ name: 'users' }], {
      clearFields: true,
    });
    expect(manager.addDataSource).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'external',
        use: DataSource,
      }),
    );
    expect(runtimeDataSources.get('external')?.setCollections).toHaveBeenCalledWith([{ name: 'orders' }], {
      clearFields: true,
    });
    expect(runtimeDataSources.get('empty')?.setCollections).not.toHaveBeenCalled();
  });

  it('removes non-main runtime data sources only', () => {
    const manager = {
      removeDataSource: vi.fn(),
    };

    removeDataSourcesFromRuntime(manager as never, ['main', 'external', 12]);

    expect(manager.removeDataSource).toHaveBeenCalledWith('external');
    expect(manager.removeDataSource).toHaveBeenCalledWith('12');
    expect(manager.removeDataSource).not.toHaveBeenCalledWith('main');
  });
});
