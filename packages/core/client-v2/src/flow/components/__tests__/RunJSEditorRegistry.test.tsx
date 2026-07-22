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

  it('uses the latest registered provider that can handle the source locator', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'fallback-provider',
      renderEditor: () => <div>fallback provider</div>,
    });
    RunJSEditorRegistry.registerProvider({
      key: 'flow-step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => <button type="button">{props.label || props.locator?.kind}</button>,
    });

    render(
      <RunJSEditorField
        label="Write JavaScript"
        locator={{
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Write JavaScript' })).toBeInTheDocument();
    expect(screen.queryByText('fallback provider')).toBeNull();
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

  it('lets a specialized provider compose the next matching provider', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'wrapper-provider',
      priority: 100,
      canHandle: (props) => props.locator?.kind === 'flowModel.flowRegistry.runjs',
      renderEditor: (props) => (
        <section aria-label="wrapper provider">
          <span>wrapper provider</span>
          {props.renderNext?.()}
        </section>
      ),
    });
    RunJSEditorRegistry.registerProvider({
      key: 'workspace-provider',
      canHandle: (props) => Boolean(props.locator),
      renderEditor: () => <div>workspace provider</div>,
    });

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

    expect(screen.getByText('wrapper provider')).toBeInTheDocument();
    expect(screen.getByText('workspace provider')).toBeInTheDocument();
  });

  it('re-evaluates downstream providers after renderNext overrides', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'locator-wrapper',
      priority: 100,
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <section aria-label="locator wrapper">
          locator wrapper
          {props.renderNext?.({
            locator: {
              kind: 'chart.option',
              modelUid: 'chart_1',
            },
          })}
        </section>
      ),
    });
    RunJSEditorRegistry.registerProvider({
      key: 'step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: () => <div>step provider</div>,
    });

    render(
      <RunJSEditorField
        locator={{
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByLabelText('locator wrapper')).toBeInTheDocument();
    expect(screen.queryByText('step provider')).toBeNull();
    expect(screen.getByLabelText('// Use return to output value')).toBeInTheDocument();
  });

  it('normalizes sourceLocator and sourceLabel aliases before provider selection', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'source-locator-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.flowRegistry.runjs',
      renderEditor: (props) => <button type="button">{props.label || props.locator?.kind}</button>,
    });

    render(
      <RunJSEditorField
        sourceLabel="Rule value"
        sourceLocator={{
          kind: 'flowModel.flowRegistry.runjs',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          sourcePath: ['defaultParams', 'code'],
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Rule value' })).toBeInTheDocument();
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

  it('keeps a replacement provider when the previous provider unregisters', () => {
    const unregisterPrevious = RunJSEditorRegistry.registerProvider({
      key: 'replaceable',
      renderEditor: () => <div>previous provider</div>,
    });
    const replacement = {
      key: 'replaceable',
      renderEditor: () => <div>replacement provider</div>,
    };

    RunJSEditorRegistry.registerProvider(replacement);
    unregisterPrevious();

    expect(RunJSEditorRegistry.getProviders()).toEqual([replacement]);
  });
});
