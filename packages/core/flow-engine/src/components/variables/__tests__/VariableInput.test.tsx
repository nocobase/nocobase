/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VariableInput } from '../VariableInput';
import { createTestFlowContext } from './test-utils';
import type { ContextSelectorItem } from '../types';

describe('VariableInput', () => {
  it('should render Input for static values', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="static text" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = screen.getByDisplayValue('static text');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('should render VariableTag for dynamic variables', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    // 应该显示格式化后的路径 "user/name"
    const variableTag = screen.getByText('user/name');
    expect(variableTag).toBeInTheDocument();
    expect(variableTag.closest('.ant-tag')).toBeInTheDocument();
  });

  it('should render FlowContextSelector button', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="test" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const selectorButton = screen.getByRole('button');
    expect(selectorButton).toBeInTheDocument();
  });

  it('should handle onChange from Input', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    render(<VariableInput value="initial" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = screen.getByDisplayValue('initial');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('should handle variable selection from FlowContextSelector', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    render(<VariableInput value="" onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    const selectorButton = screen.getByRole('button');
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

  it('should handle clear action from VariableTag', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();
    render(
      <VariableInput
        value="{{ ctx.user.name }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    const clearButton = screen.getByLabelText('close');
    fireEvent.click(clearButton);

    // 清除时调用 onChange(null)
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should use custom converters', () => {
    const flowContext = createTestFlowContext();
    const customConverters = {
      renderInputComponent: (contextSelectorItem: ContextSelectorItem | null) => {
        // 对于静态值（contextSelectorItem为null），返回自定义组件
        if (!contextSelectorItem) {
          return (props: any) => <input {...props} data-testid="custom-input" />;
        }
        return null;
      },
      resolvePathFromValue: (value: any) => {
        if (value === 'custom') return ['custom', 'path'];
        return null;
      },
      resolveValueFromPath: (item: ContextSelectorItem) => {
        return `custom-${item?.fullPath.join('.')}`;
      },
    };

    render(
      <VariableInput value="custom" converters={customConverters} metaTree={() => flowContext.getPropertyMetaTree()} />,
    );

    const customInput = screen.getByTestId('custom-input');
    expect(customInput).toBeInTheDocument();
  });

  it('should handle external prop updates', () => {
    const flowContext = createTestFlowContext();
    const { rerender } = render(<VariableInput value="initial" metaTree={() => flowContext.getPropertyMetaTree()} />);

    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    expect(screen.getByText('user/name')).toBeInTheDocument();
  });

  it('should handle external prop updates', () => {
    const flowContext = createTestFlowContext();
    const { rerender } = render(<VariableInput value="initial" metaTree={() => flowContext.getPropertyMetaTree()} />);

    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    expect(screen.getByText('user/name')).toBeInTheDocument();
  });

  it('should use FlowContext metaTree correctly', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="test" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const selectorButton = screen.getByRole('button');
    expect(selectorButton).toBeInTheDocument();
  });

  it('should pass through other props to the input component', () => {
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

    const input = screen.getByDisplayValue('test');
    expect(input).toHaveAttribute('placeholder', 'Enter value');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('custom-class');
  });

  it('should handle empty metaTree', () => {
    render(<VariableInput value="test" metaTree={[]} />);

    const input = screen.getByDisplayValue('test');
    expect(input).toBeInTheDocument();

    const selectorButton = screen.getByRole('button');
    expect(selectorButton).toBeInTheDocument();
  });

  it('should handle undefined value', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('should always use VariableTag for variable values regardless of converters', () => {
    const flowContext = createTestFlowContext();
    const customConverters = {
      renderInputComponent: (contextSelectorItem: ContextSelectorItem | null) => {
        // This converter should NOT be used for variable values
        return (props: any) => <input {...props} data-testid="should-not-appear" />;
      },
    };

    render(
      <VariableInput
        value="{{ ctx.user.name }}"
        converters={customConverters}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    // Should render VariableTag, not the custom input
    const variableTag = screen.getByText('user/name');
    expect(variableTag).toBeInTheDocument();
    expect(variableTag.closest('.ant-tag')).toBeInTheDocument();

    // Should NOT render the custom input
    expect(screen.queryByTestId('should-not-appear')).not.toBeInTheDocument();

    // Should have the clear button (antd Tag close icon)
    const clearButton = screen.getByLabelText('close');
    expect(clearButton).toBeInTheDocument();
  });

  it('should use custom converters for static values only', () => {
    const flowContext = createTestFlowContext();
    const customConverters = {
      renderInputComponent: (contextSelectorItem: ContextSelectorItem | null) => {
        // 对于静态值（contextSelectorItem为null），返回number input
        if (!contextSelectorItem) {
          return (props: any) => <input {...props} data-testid="number-input" type="number" />;
        }
        return null;
      },
    };

    render(
      <VariableInput value={42} converters={customConverters} metaTree={() => flowContext.getPropertyMetaTree()} />,
    );

    // Should use custom converter for static number value
    const numberInput = screen.getByTestId('number-input');
    expect(numberInput).toBeInTheDocument();
    expect(numberInput).toHaveAttribute('type', 'number');
  });

  it('should maintain focus during typing', async () => {
    const flowContext = createTestFlowContext();
    const TestWrapper = () => {
      const [value, setValue] = React.useState('');
      return <VariableInput value={value} onChange={setValue} metaTree={() => flowContext.getPropertyMetaTree()} />;
    };

    render(<TestWrapper />);

    const input = screen.getByRole('textbox');
    input.focus();
    expect(document.activeElement).toBe(input);

    // Test typing character by character
    const testText = '测试焦点保持';
    for (let i = 0; i < testText.length; i++) {
      const currentValue = testText.substring(0, i + 1);
      fireEvent.change(input, { target: { value: currentValue } });

      await waitFor(() => {
        const currentInput = screen.getByDisplayValue(currentValue);
        expect(currentInput).toBeInTheDocument();
      });

      // Verify focus is maintained
      const activeInput = document.activeElement as HTMLInputElement;
      expect(activeInput).toBeTruthy();
      expect(activeInput.tagName).toBe('INPUT');
      expect(activeInput).toHaveValue(currentValue);
    }

    // Final verification
    expect(screen.getByDisplayValue('测试焦点保持')).toBeInTheDocument();
  });

  it('should handle value changes correctly', () => {
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

    const initialInput = screen.getByDisplayValue('test1');
    expect(initialInput).toBeInTheDocument();

    const button = screen.getByText('Change Value');
    fireEvent.click(button);

    const updatedInput = screen.getByDisplayValue('test2');
    expect(updatedInput).toBeInTheDocument();
  });

  it('should switch from variable to static input after clearing', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    // Test with a variable value
    const { rerender } = render(
      <VariableInput
        value="{{ ctx.user.userRating }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    // Should show VariableTag for variable value - display as "user/userRating" since userRating maps to User parent
    const variableTag = screen.getByText('user/userRating');
    expect(variableTag).toBeInTheDocument();

    // Clear the variable
    const clearButton = screen.getByLabelText('close');
    fireEvent.click(clearButton);

    // After clearing, should call onChange(null)
    expect(onChange).toHaveBeenCalledWith(null);

    // Rerender with null value to see the component switch to static input
    rerender(<VariableInput value={null} onChange={onChange} metaTree={() => flowContext.getPropertyMetaTree()} />);

    // Should now show regular input (default behavior for static values)
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('should call onChange with null when clearing variable', () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <VariableInput
        value="{{ ctx.user.name }}"
        onChange={onChange}
        metaTree={() => flowContext.getPropertyMetaTree()}
      />,
    );

    const clearButton = screen.getByLabelText('close');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('should render VariableTag with proper styling', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="{{ ctx.user.name }}" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const variableTag = screen.getByText('user/name');
    expect(variableTag).toBeInTheDocument();
    expect(variableTag.closest('.ant-tag')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('close');
    expect(closeButton).toBeInTheDocument();
  });

  it('should handle different field types correctly', () => {
    const flowContext = createTestFlowContext();
    render(<VariableInput value="" metaTree={() => flowContext.getPropertyMetaTree()} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });
});
