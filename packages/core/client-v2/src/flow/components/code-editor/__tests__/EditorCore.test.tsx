/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EditorView } from '@codemirror/view';
import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

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
});
