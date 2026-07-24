/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  acceptCompletion,
  completionStatus,
  currentCompletions,
  startCompletion,
  type CompletionResult,
  type CompletionSource,
} from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { diagnosticCount } from '@codemirror/lint';
import { Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { CodeEditor } from '..';
import { EditorCore } from '../core/EditorCore';

describe('EditorCore', () => {
  const jsonCompletionSchema = {
    uri: 'urn:nocobase:test:json-completion',
    schema: {
      additionalProperties: false,
      properties: {
        settingsSchema: {
          additionalProperties: false,
          properties: {
            enum: { type: 'array' },
            type: { enum: ['string', 'number'] },
          },
          type: 'object',
        },
      },
      type: 'object',
    },
  };

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

  it('accepts the active completion with Tab without moving focus out of the editor', async () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const completionSource: CompletionSource = () => ({
      from: 0,
      options: [{ label: 'focusedCompletion' }],
    });
    const { container } = render(<EditorCore completionSource={completionSource} value="focused" viewRef={viewRef} />);
    const view = viewRef.current;
    const content = container.querySelector<HTMLElement>('.cm-content');
    if (!view || !content) {
      throw new Error('EditorView was not initialized');
    }

    content.focus();
    view.dispatch({ selection: { anchor: view.state.doc.length } });
    startCompletion(view);

    await waitFor(() => expect(completionStatus(view.state)).toBe('active'));

    const tabEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Tab',
      key: 'Tab',
      keyCode: 9,
    });
    content.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
    expect(view.state.doc.toString()).toBe('focusedCompletion');
    expect(document.activeElement).toBe(content);
  });

  it('keeps focus in the editor when Tab is pressed while completion is pending', async () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    let resolveCompletion: ((result: CompletionResult) => void) | undefined;
    const completionSource: CompletionSource = () =>
      new Promise<CompletionResult>((resolve) => {
        resolveCompletion = resolve;
      });
    const { container } = render(<EditorCore completionSource={completionSource} value="focused" viewRef={viewRef} />);
    const view = viewRef.current;
    const content = container.querySelector<HTMLElement>('.cm-content');
    if (!view || !content) {
      throw new Error('EditorView was not initialized');
    }

    content.focus();
    view.dispatch({ selection: { anchor: view.state.doc.length } });
    startCompletion(view);
    await waitFor(() => {
      expect(completionStatus(view.state)).toBe('pending');
      expect(resolveCompletion).toBeTypeOf('function');
    });

    const tabEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Tab',
      key: 'Tab',
      keyCode: 9,
    });
    content.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(true);
    expect(view.state.doc.toString()).toBe('focused');
    expect(document.activeElement).toBe(content);

    resolveCompletion?.({ from: 0, options: [{ label: 'focusedCompletion' }] });
    await waitFor(() => expect(completionStatus(view.state)).toBe('active'));
  });

  it('does not consume Tab when no completion is active', () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const { container } = render(<EditorCore value="const focused = true;" viewRef={viewRef} />);
    const content = container.querySelector<HTMLElement>('.cm-content');
    if (!content) {
      throw new Error('EditorView was not initialized');
    }

    content.focus();
    const tabEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      code: 'Tab',
      key: 'Tab',
      keyCode: 9,
    });
    content.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBe(false);
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

  it('uses the JSON parser and preserves unsaved text, focus, and selection when the Schema changes', () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const firstSchema = {
      uri: 'urn:nocobase:test:first',
      schema: { type: 'object', properties: { first: { type: 'string' } } },
    };
    const secondSchema = {
      uri: 'urn:nocobase:test:second',
      schema: { type: 'object', properties: { second: { type: 'string' } } },
    };
    const initialJson = '{\n  "first": true\n}';
    const trueOffset = initialJson.indexOf('true');
    const { container, rerender } = render(
      <EditorCore jsonSchema={firstSchema} language="json" value={initialJson} viewRef={viewRef} />,
    );
    const originalContent = container.querySelector<HTMLElement>('.cm-content');
    const originalView = viewRef.current;
    if (!originalView) {
      throw new Error('EditorView was not initialized');
    }

    originalView?.dispatch({
      changes: { from: trueOffset, to: trueOffset + 4, insert: '"draft"' },
      selection: { anchor: trueOffset + 1, head: trueOffset + 6 },
    });
    originalContent?.focus();
    expect(syntaxTree(originalView.state).topNode.name).toBe('JsonText');

    rerender(<EditorCore jsonSchema={secondSchema} language="json" value={initialJson} viewRef={viewRef} />);

    expect(viewRef.current).toBe(originalView);
    expect(viewRef.current?.state.doc.toString()).toContain('"draft"');
    expect(viewRef.current?.state.selection.main).toMatchObject({
      anchor: trueOffset + 1,
      head: trueOffset + 6,
    });
    expect(document.activeElement).toBe(originalContent);
  });

  it('keeps editor identity and selection when switching active file content and language', () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const { container, rerender } = render(
      <EditorCore language="json" value={'{\n  "key": "demo"\n}'} viewRef={viewRef} />,
    );
    const originalView = viewRef.current;
    const originalContent = container.querySelector<HTMLElement>('.cm-content');
    if (!originalView) {
      throw new Error('EditorView was not initialized');
    }
    originalView?.dispatch({ selection: { anchor: 4, head: 9 } });
    originalContent?.focus();

    rerender(<EditorCore language="typescript" value={'const active = true;\n'} viewRef={viewRef} />);

    expect(viewRef.current).toBe(originalView);
    expect(viewRef.current?.state.doc.toString()).toBe('const active = true;\n');
    expect(viewRef.current?.state.selection.main).toMatchObject({ anchor: 4, head: 9 });
    expect(syntaxTree(viewRef.current?.state || originalView.state).topNode.name).not.toBe('JsonText');
    expect(document.activeElement).toBe(originalContent);
  });

  it('reveals a source line and column without applying the runtime wrapper offset', () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const onRevealPositionApplied = vi.fn();
    const value = 'first\nsecond\nthird';
    const firstPosition = { line: 2, column: 3 };
    const { rerender } = render(
      <EditorCore
        onRevealPositionApplied={onRevealPositionApplied}
        revealPosition={firstPosition}
        value={value}
        viewRef={viewRef}
      />,
    );

    expect(viewRef.current?.state.selection.main).toMatchObject({ anchor: 8, head: 8 });
    expect(onRevealPositionApplied).toHaveBeenLastCalledWith(firstPosition);

    const secondPosition = { line: 3, column: 2 };
    rerender(
      <EditorCore
        onRevealPositionApplied={onRevealPositionApplied}
        revealPosition={secondPosition}
        value={value}
        viewRef={viewRef}
      />,
    );

    expect(viewRef.current?.state.selection.main).toMatchObject({ anchor: 14, head: 14 });
    expect(onRevealPositionApplied).toHaveBeenLastCalledWith(secondPosition);
  });

  it('wires JSON Schema validation into CodeMirror', async () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    render(
      <EditorCore
        jsonSchema={{
          uri: 'urn:nocobase:test:wiring',
          schema: {
            additionalProperties: false,
            properties: { title: { type: 'string' } },
            type: 'object',
          },
        }}
        language="json"
        value={'{\n  "ti"\n}'}
        viewRef={viewRef}
      />,
    );
    const view = viewRef.current;
    if (!view) {
      throw new Error('EditorView was not initialized');
    }

    await waitFor(() => expect(diagnosticCount(view.state)).toBeGreaterThan(0));
  });

  it('filters JSON Schema completions by the typed property name', async () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const value = '{"settingsSchema":{"en"}}';
    const cursor = value.lastIndexOf('en') + 'en'.length;
    render(<EditorCore jsonSchema={jsonCompletionSchema} language="json" value={value} viewRef={viewRef} />);
    const view = viewRef.current;
    if (!view) {
      throw new Error('EditorView was not initialized');
    }

    view.dispatch({ selection: { anchor: cursor } });
    startCompletion(view);

    await waitFor(() => expect(completionStatus(view.state)).toBe('active'));
    expect(currentCompletions(view.state).map((completion) => completion.displayLabel || completion.label)).toContain(
      'enum',
    );

    view.dispatch({
      annotations: Transaction.userEvent.of('input.type'),
      changes: { from: cursor, insert: 'um' },
      selection: { anchor: cursor + 2 },
    });

    expect(currentCompletions(view.state).map((completion) => completion.displayLabel || completion.label)).toEqual([
      'enum',
    ]);

    view.dispatch({
      annotations: Transaction.userEvent.of('input.type'),
      changes: { from: cursor + 2, insert: 'x' },
      selection: { anchor: cursor + 3 },
    });

    expect(currentCompletions(view.state)).toEqual([]);
  });

  it('converts JSON language service snippets before applying a completion', async () => {
    const viewRef = { current: null } as React.MutableRefObject<EditorView | null>;
    const value = '{"settingsSchema":{"ty"}}';
    const cursor = value.indexOf('ty') + 'ty'.length;
    render(<EditorCore jsonSchema={jsonCompletionSchema} language="json" value={value} viewRef={viewRef} />);
    const view = viewRef.current;
    if (!view) {
      throw new Error('EditorView was not initialized');
    }

    view.dispatch({ selection: { anchor: cursor } });
    startCompletion(view);

    await waitFor(() => expect(completionStatus(view.state)).toBe('active'));
    expect(currentCompletions(view.state).map((completion) => completion.displayLabel || completion.label)).toEqual([
      'type',
    ]);
    await waitFor(() => expect(acceptCompletion(view)).toBe(true));
    expect(view.state.doc.toString()).toBe('{"settingsSchema":{"type": }}');
  });

  it('hides RunJS snippets and the default Run action for JSON documents', () => {
    render(<CodeEditor fullscreenControl={{ isFullscreen: false, toggleFullscreen: vi.fn() }} language="json" />);

    expect(screen.queryByRole('button', { name: 'Snippets' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run' })).not.toBeInTheDocument();
  });
});
