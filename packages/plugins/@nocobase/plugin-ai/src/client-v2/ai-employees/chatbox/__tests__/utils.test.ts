/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isCurrentLiveMessage } from '../utils';

describe('client-v2 chatbox utils', () => {
  it('matches live messages by rendered message id', () => {
    expect(isCurrentLiveMessage('message-1', 'message-1')).toBe(true);
    expect(isCurrentLiveMessage('message-1', 'message-2')).toBe(false);
  });

  it('matches streaming messages before the server assigns a message id', () => {
    expect(isCurrentLiveMessage(undefined, '')).toBe(true);
    expect(isCurrentLiveMessage(undefined, undefined)).toBe(true);
  });

  it('falls back to the tool call message id when the rendered message id is empty', () => {
    expect(isCurrentLiveMessage('message-1', '', 'message-1')).toBe(true);
    expect(isCurrentLiveMessage('message-1', '', 'message-2')).toBe(false);
  });
});
