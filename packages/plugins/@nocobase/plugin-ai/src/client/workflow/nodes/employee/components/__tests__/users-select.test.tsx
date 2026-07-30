/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const { useWorkflowVariableOptions } = vi.hoisted(() => ({
  useWorkflowVariableOptions: vi.fn((_options: { types: Array<(field: unknown) => boolean> }) => []),
}));

vi.mock('@nocobase/client', () => ({
  RemoteSelect: () => null,
  Variable: {
    Input: () => null,
  },
}));

vi.mock('@nocobase/plugin-workflow/client', () => ({
  useWorkflowVariableOptions,
}));

import { UsersSelect } from '../users-select';

describe('UsersSelect', () => {
  it('passes variable expressions through and accepts context user fields', () => {
    const onChange = vi.fn();
    const element = UsersSelect({
      value: '{{$context.data}}',
      onChange,
    }) as React.ReactElement<{ value: string; onChange: (value: string) => void }>;

    expect(element.props.value).toBe('{{$context.data}}');
    expect(element.props.onChange).toBe(onChange);

    const [{ types }] = useWorkflowVariableOptions.mock.calls[0];
    const [isUserKeyField] = types;
    expect(isUserKeyField({ type: 'context', target: 'users' })).toBe(true);
    expect(isUserKeyField({ type: 'context', target: 'posts' })).toBe(false);
  });
});
