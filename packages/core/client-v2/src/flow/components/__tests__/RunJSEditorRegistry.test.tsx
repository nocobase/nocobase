/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSEditorField, RunJSEditorRegistry } from '../runjs-studio';

vi.mock('../code-editor', () => ({
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

setupRunJSTestHosts();

describe('RunJSEditorRegistry', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
  });

  it('falls back to the inline RunJS editor when no provider is registered', () => {
    const onChange = vi.fn();

    render(<RunJSEditorField value={{ code: 'return 1;', version: 'v2' }} onChange={onChange} />);

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

  it('uses provider priority before registration order', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'specialized-provider',
      priority: 100,
      canHandle: (props) => props.locator?.kind === 'flowModel.flowRegistry.runjs',
      renderEditor: () => <div>specialized provider</div>,
    });
    RunJSEditorRegistry.registerProvider({
      key: 'generic-provider',
      canHandle: (props) => Boolean(props.locator),
      renderEditor: () => <div>generic provider</div>,
    });

    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      'specialized-provider',
      'generic-provider',
    ]);

    render(
      <RunJSEditorField
        locator={{
          kind: 'flowModel.flowRegistry.runjs',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          sourcePath: ['defaultParams', 'code'],
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByText('specialized provider')).toBeInTheDocument();
    expect(screen.queryByText('generic provider')).toBeNull();
  });

  it('removes a provider with the unregister callback', () => {
    const unregister = RunJSEditorRegistry.registerProvider({
      key: 'temporary',
      renderEditor: () => <div>temporary provider</div>,
    });

    unregister();

    render(<RunJSEditorField value={{ code: '', version: 'v2' }} />);

    expect(screen.queryByText('temporary provider')).toBeNull();
    expect(screen.getByLabelText('// Use return to output value')).toBeInTheDocument();
  });
});
