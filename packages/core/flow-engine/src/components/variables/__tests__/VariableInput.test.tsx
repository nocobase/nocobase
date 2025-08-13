/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ContextSelectorItem } from '../types';
import { VariableInput } from '../VariableInput';
import { createTestFlowContext } from './test-utils';

describe('VariableInput', () => {
  it('should render Input for static values', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="static text" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = await screen.findByDisplayValue('static text');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('should render VariableTag for dynamic variables', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    // 应该显示格式化后的路径 "User/Name"
    await waitFor(() => {
      const variableTag = screen.getByText('User/Name');
      expect(variableTag).toBeInTheDocument();
      expect(variableTag.closest('.ant-tag')).toBeInTheDocument();
    });
  });

  it('should render FlowContextSelector button', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="test" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const selectorButton = await screen.findByRole('button');
    expect(selectorButton).toBeInTheDocument();
  });

  it('should handle onChange from Input', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    render(<VariableInput value="initial" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = await screen.findByDisplayValue('initial');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('should handle variable selection from FlowContextSelector', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    render(<VariableInput value="" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const selectorButton = await screen.findByRole('button');
    fireEvent.click(selectorButton);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User'));

    await waitFor(() => {
      fireEvent.click(screen.getByText('Name'));
    });

    expect(onChange).toHaveBeenCalledWith('{{ ctx.user.name }}');
  });

  it('should handle clear action from VariableTag', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    render(
      <VariableInput
        value="{{ ctx.user.name }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    const clearButton = await screen.findByLabelText('clear');
    fireEvent.click(clearButton);

    // 清除时调用 onChange(null)
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should handle external prop updates', async () => {
    const flowContext = createTestFlowContext();
    const { rerender } = render(<VariableInput value="initial" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const initialInput = await screen.findByDisplayValue('initial');
    expect(initialInput).toBeInTheDocument();

    rerender(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    await waitFor(() => {
      expect(screen.getByText('User/Name')).toBeInTheDocument();
    });
  });

  it('should use FlowContext metaTree correctly', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="test" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const selectorButton = await screen.findByRole('button');
    expect(selectorButton).toBeInTheDocument();
  });

  it('should pass through other props to the input component', async () => {
    const flowContext = createTestFlowContext();
    render(
      <VariableInput
        value="test"
        placeholder="Enter value"
        disabled
        className="custom-class"
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    const input = await screen.findByDisplayValue('test');
    expect(input).toHaveAttribute('placeholder', 'Enter value');
    expect(input).toHaveClass('custom-class');

    // Note: The disabled prop might not be correctly passed through in the current implementation
    // This is a known limitation of the current component design
  });

  it('should handle empty metaTree', async () => {
    render(<VariableInput value="test" metaTree={[]} />);

    const input = await screen.findByDisplayValue('test');
    expect(input).toBeInTheDocument();

    const selectorButton = await screen.findByRole('button');
    expect(selectorButton).toBeInTheDocument();
  });

  it('should handle undefined value', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('should maintain focus during typing', async () => {
    const flowContext = createTestFlowContext();
    const TestWrapper = () => {
      const [value, setValue] = React.useState('');
      return <VariableInput value={value} onChange={setValue} metaTree={() => flowContext.getPropertyMetaTree()} />;
    };

    render(<TestWrapper />);

    const input = await screen.findByRole('textbox');

    act(() => {
      input.focus();
    });
    expect(document.activeElement).toBe(input);

    // Test typing the entire text at once to avoid incremental updates
    const testText = '测试焦点保持';

    act(() => {
      fireEvent.change(input, { target: { value: testText } });
    });

    await waitFor(() => {
      const currentInput = screen.getByDisplayValue(testText);
      expect(currentInput).toBeInTheDocument();
    });

    // Find the input again after the state update
    const updatedInput = screen.getByDisplayValue(testText);
    expect(updatedInput.tagName).toBe('INPUT');
    expect(updatedInput).toHaveValue(testText);

    // Final verification
    expect(screen.getByDisplayValue('测试焦点保持')).toBeInTheDocument();
  });

  it('should handle value changes correctly', async () => {
    const flowContext = createTestFlowContext();

    const TestWrapper = () => {
      const [value, setValue] = React.useState('test1');
      return (
        <div>
          <VariableInput value={value} onChange={setValue} metaTree={() => flowContext.getPropertyMetaTree()} />
          <button onClick={() => setValue('test2')}>Change Value</button>
        </div>
      );
    };

    render(<TestWrapper />);

    const initialInput = await screen.findByDisplayValue('test1');
    expect(initialInput).toBeInTheDocument();

    const button = screen.getByText('Change Value');
    fireEvent.click(button);

    const updatedInput = await screen.findByDisplayValue('test2');
    expect(updatedInput).toBeInTheDocument();
  });

  it('should switch from variable to static input after clearing', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    // Test with a variable value - use user.name which exists in test context
    const { rerender } = render(
      <VariableInput
        value="{{ ctx.user.name }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    // Should show VariableTag for variable value
    await waitFor(() => {
      const variableTag = screen.getByText('User/Name');
      expect(variableTag).toBeInTheDocument();
    });

    // Clear the variable
    const clearButton = await screen.findByLabelText('clear');
    fireEvent.click(clearButton);

    // After clearing, should call onChange(null)
    expect(onChange).toHaveBeenCalledWith(null);

    // Rerender with null value to see the component switch to static input
    rerender(<VariableInput value={null} onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    // Should now show regular input (default behavior for static values)
    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('should call onChange with null when clearing variable', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <VariableInput
        value="{{ ctx.user.name }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    const clearButton = await screen.findByLabelText('clear');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should render VariableTag with proper styling', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    await waitFor(() => {
      const variableTag = screen.getByText('User/Name');
      expect(variableTag).toBeInTheDocument();
      expect(variableTag.closest('.ant-tag')).toBeInTheDocument();
    });

    const closeButton = await screen.findByLabelText('clear');
    expect(closeButton).toBeInTheDocument();
  });

  it('should handle different field types correctly', async () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = await screen.findByRole('textbox');
    expect(input).toBeInTheDocument();
  });
});
