/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VariableTag } from '../VariableTag';

describe('VariableTag', () => {
  it('should render with value', () => {
    render(<VariableTag value="User/Name" />);

    const tag = screen.getByText('User/Name');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<VariableTag value="User/Email" onClear={onClear} />);

    const closeButton = screen.getByLabelText('close');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should not show close button when onClear is not provided', () => {
    render(<VariableTag value="User/Name" />);

    const closeButton = screen.queryByLabelText('close');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should be read-only', () => {
    render(<VariableTag value="User/Name" />);

    const tag = screen.getByText('User/Name');
    // Tag应该是只读的，不能编辑
    expect(tag.tagName).toBe('SPAN');
    expect(tag).not.toHaveAttribute('contentEditable');
    expect(tag.closest('input')).not.toBeInTheDocument();
  });

  it('should apply custom className and style', () => {
    const customStyle = { fontSize: '16px', color: 'red' };
    render(<VariableTag value="Custom Tag" className="custom-class" style={customStyle} />);

    const tag = screen.getByText('Custom Tag').closest('.ant-tag');
    expect(tag).toHaveClass('custom-class');
    expect(tag).toHaveStyle('font-size: 16px');
    expect(tag).toHaveStyle('color: rgb(255, 0, 0)');
  });

  it('should have blue color by default', () => {
    render(<VariableTag value="Test" />);

    const tag = screen.getByText('Test').closest('.ant-tag');
    expect(tag).toHaveClass('ant-tag-blue');
  });

  it('should handle long text with proper text styling', () => {
    const longText = 'Very/Long/Path/That/Should/Be/Truncated/With/Ellipsis';
    render(<VariableTag value={longText} />);

    const tag = screen.getByText(longText).closest('.ant-tag');
    expect(tag).toHaveStyle('text-overflow: clip');
    expect(tag).toHaveStyle('white-space: nowrap');
    expect(tag).toHaveStyle('overflow: visible');
  });

  it('should have proper styling for tag appearance', () => {
    render(<VariableTag value="Styled Tag" />);

    const tag = screen.getByText('Styled Tag').closest('.ant-tag');
    expect(tag).toHaveStyle('border-radius: 10px');
    expect(tag).toHaveStyle('line-height: 19px');
    expect(tag).toHaveStyle('margin: 0px');
    expect(tag).toHaveStyle('padding: 2px 7px');
  });

  it('should render empty value', () => {
    const { container } = render(<VariableTag value="" />);

    const tag = container.querySelector('.ant-tag');
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveTextContent('');
  });

  it('should handle undefined value gracefully', () => {
    render(<VariableTag />);

    // 应该仍然渲染tag，即使没有value
    const tag = document.querySelector('.ant-tag');
    expect(tag).toBeInTheDocument();
  });
});
