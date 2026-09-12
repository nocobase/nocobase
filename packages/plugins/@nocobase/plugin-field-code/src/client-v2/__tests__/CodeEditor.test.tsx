/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, cleanup, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CodeEditor from '../CodeEditor';

const mocks = vi.hoisted(() => ({
  createdViews: [] as any[],
  indentLess: vi.fn(() => true),
  keymaps: [] as Array<Array<{ key: string; run: (view: any) => boolean }>>,
  languageLoaders: {
    javascript: vi.fn(() => 'javascript-parser'),
  },
  updateListeners: [] as Array<(update: { docChanged: boolean; state: any }) => void>,
}));

vi.mock('@formily/react', () => ({
  connect: (Component: React.ComponentType) => Component,
  mapReadPretty: (Component: React.ComponentType) => Component,
}));

vi.mock('antd-style', () => ({
  createStyles: () => () => ({
    styles: {
      box: 'code-editor-box',
    },
  }),
}));

vi.mock('@codemirror/commands', () => ({
  indentLess: mocks.indentLess,
}));

vi.mock('@codemirror/language', () => ({
  indentUnit: {
    of: (value: string) => ({
      type: 'indentUnit',
      value,
    }),
  },
}));

vi.mock('@codemirror/lang-javascript', () => ({
  javascript: mocks.languageLoaders.javascript,
}));

vi.mock('codemirror', () => ({
  basicSetup: 'basic-setup',
}));

vi.mock('@codemirror/state', () => {
  class MockCompartment {
    of(value: unknown) {
      return {
        compartment: this,
        value,
      };
    }

    reconfigure(value: unknown) {
      return {
        compartment: this,
        reconfigured: value,
      };
    }
  }

  class MockEditorState {
    doc: {
      length: number;
      toString: () => string;
    };

    private editable = true;

    constructor(doc: string, extensions: unknown[]) {
      this.doc = {
        length: doc.length,
        toString: () => doc,
      };
      const editableExtension = extensions.find((extension: any) => extension?.value?.type === 'editable') as any;
      this.editable = editableExtension?.value?.value ?? true;
    }

    static tabSize = {
      of: (value: number) => ({
        type: 'tabSize',
        value,
      }),
    };

    static create({ doc, extensions }: { doc: string; extensions: unknown[] }) {
      return new MockEditorState(doc, extensions);
    }

    facet(facet: unknown) {
      return facet === 'editable' ? this.editable : undefined;
    }

    changeByRange(callback: (range: { from: number; to: number }) => unknown) {
      return callback({ from: 0, to: 0 });
    }
  }

  return {
    Compartment: MockCompartment,
    EditorSelection: {
      cursor: (position: number) => ({
        position,
      }),
    },
    EditorState: MockEditorState,
    Prec: {
      highest: (value: Array<{ key: string; run: (view: unknown) => boolean }>) => {
        mocks.keymaps.push(value);
        return {
          type: 'keymap',
          value,
        };
      },
    },
  };
});

vi.mock('@codemirror/view', () => {
  class MockEditorView {
    static editable = {
      of: (value: boolean) => ({
        type: 'editable',
        value,
      }),
    };

    static updateListener = {
      of: (listener: (update: { docChanged: boolean; state: unknown }) => void) => {
        mocks.updateListeners.push(listener);
        return {
          type: 'updateListener',
          listener,
        };
      },
    };

    static theme(config: unknown) {
      return {
        type: 'theme',
        config,
      };
    }

    destroyed = false;
    dispatches: unknown[] = [];
    parent: HTMLElement;
    state: any;

    constructor({ state, parent }: { state: any; parent: HTMLElement }) {
      this.state = state;
      this.parent = parent;
      mocks.createdViews.push(this);
    }

    dispatch(payload: any) {
      this.dispatches.push(payload);
      if (payload.changes) {
        const nextDoc = payload.changes.insert;
        this.state.doc = {
          length: nextDoc.length,
          toString: () => nextDoc,
        };
        mocks.updateListeners.forEach((listener) =>
          listener({
            docChanged: true,
            state: this.state,
          }),
        );
      }
    }

    destroy() {
      this.destroyed = true;
    }
  }

  return {
    EditorView: MockEditorView,
    keymap: {
      of: (value: Array<{ key: string; run: (view: unknown) => boolean }>) => value,
    },
  };
});

function latestView() {
  const view = mocks.createdViews.at(-1);
  expect(view).toBeDefined();
  return view;
}

describe('CodeEditor', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.createdViews = [];
    mocks.keymaps = [];
    mocks.updateListeners = [];
  });

  it('creates and destroys the editor with the provided value', () => {
    const { unmount } = render(<CodeEditor value="const a = 1;" language="unsupported" />);

    expect(latestView().state.doc.toString()).toBe('const a = 1;');

    unmount();
    expect(latestView().destroyed).toBe(true);
  });

  it('emits changed document text and syncs external value changes', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<CodeEditor value="old" onChange={onChange} language="unsupported" />);

    act(() => {
      latestView().dispatch({
        changes: {
          from: 0,
          to: 3,
          insert: 'typed',
        },
      });
    });
    expect(onChange).toHaveBeenCalledWith('typed');

    rerender(<CodeEditor value="external" onChange={onChange} language="unsupported" />);

    await waitFor(() => {
      expect(latestView().state.doc.toString()).toBe('external');
    });
  });

  it('reconfigures language, editable state, height and indentation props', async () => {
    const { rerender } = render(
      <CodeEditor value="" language="javascript" height="auto" indentUnit={0} disabled={false} />,
    );

    await waitFor(() => {
      expect(mocks.languageLoaders.javascript).toHaveBeenCalled();
    });

    rerender(<CodeEditor value="" language="unsupported" height="320px" indentUnit={4.8} disabled />);

    await waitFor(() => {
      expect(latestView().dispatches.length).toBeGreaterThan(0);
    });
    expect(latestView().dispatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          effects: expect.any(Array),
        }),
      ]),
    );
  });

  it('handles Tab and Shift-Tab through the configured keymap', () => {
    const dispatch = vi.fn();

    render(<CodeEditor value="" language="unsupported" indentUnit={3} />);
    const tab = mocks.keymaps.flat().find((item) => item.key === 'Tab');
    const shiftTab = mocks.keymaps.flat().find((item) => item.key === 'Shift-Tab');

    expect(
      tab?.run({
        dispatch,
        state: {
          facet: () => true,
          changeByRange: (callback: (range: { from: number; to: number }) => unknown) => callback({ from: 2, to: 2 }),
        },
      }),
    ).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({
      changes: {
        from: 2,
        to: 2,
        insert: '   ',
      },
      range: {
        position: 5,
      },
    });

    expect(
      tab?.run({
        dispatch,
        state: {
          facet: () => false,
        },
      }),
    ).toBe(false);
    expect(shiftTab?.run({})).toBe(true);
    expect(mocks.indentLess).toHaveBeenCalled();
  });
});
