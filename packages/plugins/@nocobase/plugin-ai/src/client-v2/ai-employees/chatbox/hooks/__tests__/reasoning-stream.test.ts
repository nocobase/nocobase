/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { applyReasoningStreamUpdate } from '../reasoning-stream';

describe('applyReasoningStreamUpdate', () => {
  it('accepts an empty stop event and preserves accumulated reasoning text', () => {
    const content = applyReasoningStreamUpdate(
      {
        type: 'text',
        content: '',
        reasoning: { status: 'streaming', content: 'accumulated reasoning' },
      },
      '',
      'stop',
    );

    expect(content.reasoning).toEqual({
      status: 'stop',
      content: 'accumulated reasoning',
    });
  });

  it('appends a new reasoning delta without changing the answer body', () => {
    const content = applyReasoningStreamUpdate(
      {
        type: 'text',
        content: 'answer',
        reasoning: { status: 'streaming', content: 'step one' },
      },
      ' step two',
      'streaming',
    );

    expect(content.content).toBe('answer');
    expect(content.reasoning).toEqual({ status: 'streaming', content: 'step one step two' });
  });
});
