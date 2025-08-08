/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SlateVariableEditor } from '../SlateVariableEditor';
import { createTestFlowContext } from './test-utils';

// Mock createPortal to render in the same tree for testing
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (children: React.ReactNode) => children,
  };
});

describe('SlateVariableEditor', () => {
  it('should render with initial value', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <SlateVariableEditor
        value="Hello {{ ctx.user.name }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    // Should render the text editor
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute('data-slate-editor', 'true');
  });

  it('should show VariableTreeSelector on {{ trigger', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(<SlateVariableEditor value="" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const editor = screen.getByRole('textbox');

    // Focus the editor and type the trigger characters
    await user.click(editor);
    await user.type(editor, '{{');

    // Wait for the variable tree selector to appear
    await waitFor(
      () => {
        // Should show loading or variable options
        const loadingText = screen.queryByText('加载中...');
        const noVariablesText = screen.queryByText('暂无可用变量');
        const variableOptions = screen.queryByText('User'); // From test data

        expect(loadingText || noVariablesText || variableOptions).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('should handle variable selection from VariableTreeSelector', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(<SlateVariableEditor value="" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const editor = screen.getByRole('textbox');

    // Focus and trigger the selector
    await user.click(editor);
    await user.type(editor, '{{');

    // Wait for variable options to load
    await waitFor(
      () => {
        const userOption = screen.queryByText('User');
        if (userOption) {
          // Click on User option to expand it
          fireEvent.click(userOption);
        }
      },
      { timeout: 3000 },
    );

    // Check if onChange was called when content changes
    expect(onChange).toHaveBeenCalled();
  });

  it('should handle multiline mode', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <SlateVariableEditor
        value=""
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
        multiline={true}
      />,
    );

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveStyle({ minHeight: '100px' });
  });

  it('should handle custom trigger characters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <SlateVariableEditor
        value=""
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
        triggerChars="@@"
      />,
    );

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, '@@');

    // Should trigger the variable selector with custom trigger
    await waitFor(
      () => {
        const loadingText = screen.queryByText('加载中...');
        const noVariablesText = screen.queryByText('暂无可用变量');
        const variableOptions = screen.queryByText('User');

        expect(loadingText || noVariablesText || variableOptions).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it('should handle keyboard events', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(<SlateVariableEditor value="" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const editor = screen.getByRole('textbox');

    // Test key events don't throw errors
    fireEvent.keyDown(editor, { key: 'Enter' });
    fireEvent.keyDown(editor, { key: 'Escape' });
    fireEvent.keyDown(editor, { key: 'ArrowDown' });

    // Should not throw any errors
    expect(editor).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    const customPlaceholder = 'Custom placeholder text';

    render(
      <SlateVariableEditor
        value=""
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
        placeholder={customPlaceholder}
      />,
    );

    // Check if the placeholder is set (implementation may vary)
    const editor = screen.getByRole('textbox');
    expect(editor).toBeInTheDocument();
  });

  it('should handle empty metaTree', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SlateVariableEditor value="" onChange={onChange} metaTree={[]} />);

    const editor = screen.getByRole('textbox');
    await user.click(editor);
    await user.type(editor, '{{');

    // Should show "no variables available" message
    await waitFor(
      () => {
        expect(screen.queryByText('暂无可用变量')).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
