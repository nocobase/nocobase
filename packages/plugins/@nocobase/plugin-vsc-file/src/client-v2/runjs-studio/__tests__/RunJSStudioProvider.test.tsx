/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { runJSStudioProvider } from '../RunJSStudioProvider';

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    value,
    onChange,
    placeholder,
    readonly,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
  }) => (
    <textarea
      aria-label={placeholder}
      readOnly={readonly}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

vi.mock('../../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('runJSStudioProvider', () => {
  it('renders the Studio entry while preserving inline editing until the source is connected', () => {
    const onChange = vi.fn();

    render(
      <>
        {runJSStudioProvider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          onChange,
          locator: {
            kind: 'flowModel.step',
            modelUid: 'fm_1',
            flowKey: 'settings',
            stepKey: 'runjs',
            paramPath: ['code'],
          },
        })}
      </>,
    );

    expect(screen.getByRole('button', { name: 'Open RunJS Studio' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('// Use return to output value'), {
      target: {
        value: 'return 2;',
      },
    });

    expect(onChange).toHaveBeenCalledWith({
      code: 'return 2;',
      version: 'v2',
    });
  });
});
