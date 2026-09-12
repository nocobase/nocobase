/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { getOrCreateGlobalStore } from '../../../stores/global-store';

type GlobalWithPluginAIStores = typeof globalThis & {
  __nocobasePluginAIStores?: Record<string, unknown>;
};

const resetPluginAIStores = () => {
  const stores = (globalThis as GlobalWithPluginAIStores).__nocobasePluginAIStores;
  delete stores?.['@nocobase/plugin-ai/test-store'];
  delete stores?.['@nocobase/plugin-ai/test-store-a'];
  delete stores?.['@nocobase/plugin-ai/test-store-b'];
};

afterEach(() => {
  resetPluginAIStores();
});

describe('plugin-ai global store registry', () => {
  it('reuses the same store instance for the same key', () => {
    const createStore = vi.fn(() => ({ open: false }));

    const firstStore = getOrCreateGlobalStore('@nocobase/plugin-ai/test-store', createStore);
    const secondStore = getOrCreateGlobalStore('@nocobase/plugin-ai/test-store', () => ({ open: true }));

    expect(secondStore).toBe(firstStore);
    expect(createStore).toHaveBeenCalledTimes(1);
    expect(secondStore.open).toBe(false);
  });

  it('keeps different keys isolated', () => {
    const firstStore = getOrCreateGlobalStore('@nocobase/plugin-ai/test-store-a', () => ({ key: 'a' }));
    const secondStore = getOrCreateGlobalStore('@nocobase/plugin-ai/test-store-b', () => ({ key: 'b' }));

    expect(firstStore).not.toBe(secondStore);
    expect(firstStore.key).toBe('a');
    expect(secondStore.key).toBe('b');
  });

  it('shares state when the same store is initialized from different bundle entries', () => {
    const createFromClientBundle = vi.fn(() => ({
      selectable: '',
      startSelect(selectable: string) {
        this.selectable = selectable;
      },
    }));
    const createFromClientV2Bundle = vi.fn(() => ({
      selectable: '',
      startSelect(selectable: string) {
        this.selectable = selectable;
      },
    }));

    const storeFromClientBundle = getOrCreateGlobalStore('@nocobase/plugin-ai/test-store', createFromClientBundle);
    storeFromClientBundle.startSelect('block');

    const storeFromClientV2Bundle = getOrCreateGlobalStore('@nocobase/plugin-ai/test-store', createFromClientV2Bundle);

    expect(storeFromClientV2Bundle).toBe(storeFromClientBundle);
    expect(storeFromClientV2Bundle.selectable).toBe('block');
    expect(createFromClientBundle).toHaveBeenCalledTimes(1);
    expect(createFromClientV2Bundle).not.toHaveBeenCalled();
  });
});
