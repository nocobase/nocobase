/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearMountedChatBoxes, getMountedChatBox, registerMountedChatBox } from '../mounted-chat-boxes';
import { createChatBoxRuntime } from '../runtime';

describe('mounted chat box registry', () => {
  afterEach(() => {
    clearMountedChatBoxes();
  });

  it('registers and cleans up mounted chat boxes without removing newer entries', () => {
    const first = {
      uid: 'chat-box-1',
      runtime: createChatBoxRuntime({ mode: 'block' }),
      triggerTask: vi.fn(),
      clear: vi.fn(),
      syncContextItems: vi.fn(),
    };
    const second = {
      uid: 'chat-box-1',
      runtime: createChatBoxRuntime({ mode: 'block' }),
      triggerTask: vi.fn(),
      clear: vi.fn(),
      syncContextItems: vi.fn(),
    };

    const cleanupFirst = registerMountedChatBox(first);
    expect(getMountedChatBox('chat-box-1')).toBe(first);

    const cleanupSecond = registerMountedChatBox(second);
    expect(getMountedChatBox('chat-box-1')).toBe(second);

    cleanupFirst();
    expect(getMountedChatBox('chat-box-1')).toBe(second);

    cleanupSecond();
    expect(getMountedChatBox('chat-box-1')).toBeUndefined();
  });
});
