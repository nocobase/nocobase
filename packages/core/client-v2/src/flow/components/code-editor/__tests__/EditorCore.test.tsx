/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CompletionSource } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CodeEditor } from '..';
import { EditorCore } from '../core/EditorCore';

describe('EditorCore', () => {
  it('makes the CodeMirror content element non-editable in readonly mode', () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const { container, rerender } = render(<EditorCore readonly value="const value = 1;" viewRef={viewRef} />);

    expect(container.querySelector('.cm-content')).toHaveAttribute('contenteditable', 'false');
    expect(viewRef.current?.state.readOnly).toBe(true);

    rerender(<EditorCore readonly={false} value="const value = 1;" viewRef={viewRef} />);

    expect(container.querySelector('.cm-content')).toHaveAttribute('contenteditable', 'true');
    expect(viewRef.current?.state.readOnly).toBe(false);
  });

  it('preserves editor identity and focus when the completion source changes', () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const firstCompletionSource: CompletionSource = () => null;
    const secondCompletionSource: CompletionSource = () => null;
    const { container, rerender } = render(
      <EditorCore completionSource={firstCompletionSource} value="{}" viewRef={viewRef} />,
    );
    const originalContent = container.querySelector<HTMLElement>('.cm-content');

    originalContent?.focus();
    expect(document.activeElement).toBe(originalContent);

    rerender(<EditorCore completionSource={secondCompletionSource} value="{}" viewRef={viewRef} />);

    const nextContent = container.querySelector<HTMLElement>('.cm-content');
    expect(nextContent).toBe(originalContent);
    expect(document.activeElement).toBe(nextContent);
  });

  it('keeps focus when workspace module completions change', () => {
    const fullscreenControl = { isFullscreen: false, toggleFullscreen: vi.fn() };
    const { container, rerender } = render(
      <CodeEditor
        fullscreenControl={fullscreenControl}
        moduleImportCompletions={[{ detail: 'src/shared/first.ts', exports: [], specifier: './first' }]}
        showLogs={false}
        value="{}"
      />,
    );
    const originalContent = container.querySelector<HTMLElement>('.cm-content');

    originalContent?.focus();
    expect(document.activeElement).toBe(originalContent);

    rerender(
      <CodeEditor
        fullscreenControl={fullscreenControl}
        moduleImportCompletions={[
          { detail: 'src/shared/first.ts', exports: [], specifier: './first' },
          { detail: '.light-extension/types/settings.d.ts', exports: [], specifier: './settings' },
        ]}
        showLogs={false}
        value="{}"
      />,
    );

    const nextContent = container.querySelector<HTMLElement>('.cm-content');
    expect(nextContent).toBe(originalContent);
    expect(document.activeElement).toBe(nextContent);
  });
});
