/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import CodeEditor from '../CodeEditor';

describe('workflow JavaScript CodeEditor', () => {
  it('keeps the CodeMirror view mounted when the form echoes a new value', async () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<CodeEditor value="return old;" onChange={onChange} />);

    const editor = await waitFor(() => {
      const node = container.querySelector('.cm-editor');
      expect(node).not.toBeNull();
      return node as Element;
    });

    rerender(<CodeEditor value="return changed;" onChange={onChange} />);

    await waitFor(() => {
      expect(container.querySelector('.cm-editor')).toBe(editor);
      expect(container.querySelector('.cm-content')?.textContent).toContain('return changed;');
    });
  });
});
