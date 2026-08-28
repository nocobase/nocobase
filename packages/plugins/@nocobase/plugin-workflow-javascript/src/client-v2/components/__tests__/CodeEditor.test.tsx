/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import CodeEditor from '../CodeEditor';

type MockEditorState = {
  doc: {
    toString: () => string;
  };
  extensions: unknown[];
};

type MockEditorViewConfig = {
  state: MockEditorState;
  parent: HTMLElement;
};

const mocks = vi.hoisted(() => {
  class MockCompartment {
    of = vi.fn((extension: unknown) => ({ compartment: this, extension }));
    reconfigure = vi.fn((extension: unknown) => ({ compartment: this, extension, type: 'reconfigure' }));
  }

  class MockEditorView {
    static editable = { of: vi.fn((value: boolean) => ({ kind: 'editable', value })) };
    static updateListener = { of: vi.fn((listener: unknown) => ({ kind: 'updateListener', listener })) };
    static theme = vi.fn((themeConfig: unknown) => ({ kind: 'theme', themeConfig }));

    state: MockEditorState;
    parent: HTMLElement;
    dispatch = vi.fn((transaction: { changes?: { insert: string } }) => {
      if (!transaction.changes) {
        return;
      }

      const value = transaction.changes.insert;
      this.state = {
        ...this.state,
        doc: {
          toString: () => value,
        },
      };
    });
    destroy = vi.fn();

    constructor(config: MockEditorViewConfig) {
      this.state = config.state;
      this.parent = config.parent;
      mocks.editorViews.push(this);
    }
  }

  return {
    compartmentClass: MockCompartment,
    editorStateCreate: vi.fn((config: { doc: string; extensions: unknown[] }) => ({
      doc: {
        toString: () => config.doc,
      },
      extensions: config.extensions,
    })),
    editorViews: [] as MockEditorView[],
    editorViewClass: MockEditorView,
  };
});

vi.mock('antd', () => ({
  theme: {
    useToken: () => ({
      token: {
        borderRadiusLG: 6,
        colorBgContainer: '#fff',
        colorBgContainerDisabled: '#f5f5f5',
        colorBorder: '#d9d9d9',
        colorPrimary: '#1677ff',
        colorPrimaryHover: '#4096ff',
        controlHeight: 32,
        fontFamilyCode: 'monospace',
        fontSize: 14,
      },
    }),
  },
}));

vi.mock('@codemirror/lang-javascript', () => ({
  javascript: vi.fn(() => ({ kind: 'javascript' })),
}));

vi.mock('@codemirror/state', () => ({
  Compartment: mocks.compartmentClass,
  EditorState: {
    create: mocks.editorStateCreate,
    readOnly: { of: vi.fn((value: boolean) => ({ kind: 'readOnly', value })) },
  },
}));

vi.mock('@codemirror/view', () => ({
  EditorView: mocks.editorViewClass,
}));

vi.mock('codemirror', () => ({
  basicSetup: { kind: 'basicSetup' },
}));

describe('CodeEditor', () => {
  it('keeps the CodeMirror view mounted when the controlled value changes', () => {
    const { rerender, unmount } = render(<CodeEditor value="const a = 1;" />);

    expect(mocks.editorViews).toHaveLength(1);

    const editor = mocks.editorViews[0];

    rerender(<CodeEditor value="const a = 12;" />);

    expect(mocks.editorViews).toHaveLength(1);
    expect(editor.destroy).not.toHaveBeenCalled();
    expect(editor.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 0,
        to: 'const a = 1;'.length,
        insert: 'const a = 12;',
      },
    });

    unmount();

    expect(editor.destroy).toHaveBeenCalledTimes(1);
  });
});
