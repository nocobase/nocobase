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
  it('should render with variable value and display parsed path', () => {
    render(<VariableTag value="{{ ctx.User.Name }}" />);

    const tag = screen.getByText('User/Name');
    expect(tag).toBeInTheDocument();
    expect(tag.closest('.ant-tag')).toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(<VariableTag value="{{ ctx.User.Email }}" onClear={onClear} />);

    const closeButton = screen.getByLabelText('close');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should not show close button when onClear is not provided', () => {
    render(<VariableTag value="{{ ctx.User.Name }}" />);

    const closeButton = screen.queryByLabelText('close');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should be read-only', () => {
    render(<VariableTag value="{{ ctx.User.Name }}" />);

    const tag = screen.getByText('User/Name');
    // Tag应该是只读的，不能编辑
    expect(tag.tagName).toBe('SPAN');
    expect(tag).not.toHaveAttribute('contentEditable');
    expect(tag.closest('input')).not.toBeInTheDocument();
  });

  it('should apply custom className and style', () => {
    const customStyle = { fontSize: '16px', color: 'red' };
    render(<VariableTag value="{{ ctx.Custom.Tag }}" className="custom-class" style={customStyle} />);

    const container = screen.getByText('Custom/Tag').closest('.variable');
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveStyle('font-size: 16px');
    expect(container).toHaveStyle('color: rgb(255, 0, 0)');
  });

  it('should have blue color by default', () => {
    render(<VariableTag value="{{ ctx.Test }}" />);

    const tag = screen.getByText('Test').closest('.ant-tag');
    expect(tag).toHaveClass('ant-tag-blue');
  });

  it('should handle long text with proper text styling', () => {
    const longText = '{{ ctx.Very.Long.Path.That.Should.Be.Truncated.With.Ellipsis }}';
    render(<VariableTag value={longText} />);

    const tag = screen.getByText('Very/Long/Path/That/Should/Be/Truncated/With/Ellipsis').closest('.ant-tag');
    expect(tag).toHaveStyle('text-overflow: clip');
    expect(tag).toHaveStyle('white-space: nowrap');
    expect(tag).toHaveStyle('overflow: visible');
  });

  it('should have proper styling for tag appearance', () => {
    render(<VariableTag value="{{ ctx.Styled.Tag }}" />);

    const tag = screen.getByText('Styled/Tag').closest('.ant-tag');
    expect(tag).toHaveStyle('border-radius: 10px');
    expect(tag).toHaveStyle('line-height: 19px');
    expect(tag).toHaveStyle('margin: 4px 6px');
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

  it('should render container with proper structure', () => {
    render(<VariableTag value="{{ ctx.Test }}" />);

    const container = screen.getByText('Test').closest('.variable');
    expect(container).toBeInTheDocument();

    const innerContainer = container?.querySelector('.variable-input-container');
    expect(innerContainer).toBeInTheDocument();

    const tag = innerContainer?.querySelector('.ant-tag');
    expect(tag).toBeInTheDocument();
  });

  it('should show clear button when onClear is provided', () => {
    const onClear = vi.fn();
    render(<VariableTag value="{{ ctx.Test }}" onClear={onClear} />);

    const container = screen.getByText('Test').closest('.variable');
    const clearButton = container?.querySelector('.clear-button');
    expect(clearButton).toBeInTheDocument();
  });

  it('should have correct container styling when disabled', () => {
    render(<VariableTag value="{{ ctx.Test }}" onClear={undefined} />);

    const container = screen.getByText('Test').closest('.variable');
    const innerContainer = container?.querySelector('.variable-input-container');

    expect(innerContainer).toHaveClass('ant-input-disabled');
  });

  it('should have correct container styling when enabled', () => {
    const onClear = vi.fn();
    render(<VariableTag value="{{ ctx.Test }}" onClear={onClear} />);

    const container = screen.getByText('Test').closest('.variable');
    const innerContainer = container?.querySelector('.variable-input-container');

    expect(innerContainer).not.toHaveClass('ant-input-disabled');
  });

  it('should have proper container role and accessibility attributes', () => {
    render(<VariableTag value="{{ ctx.Test }}" />);

    const innerContainer = screen.getByText('Test').closest('.variable-input-container');
    expect(innerContainer).toHaveAttribute('role', 'button');
    expect(innerContainer).toHaveAttribute('aria-label', 'variable-tag');
  });

  it('should display title when contextSelectorItem and metaTree are provided', () => {
    const mockMetaTree = [
      {
        name: 'user',
        title: 'User Information',
        type: 'object',
        children: [
          {
            name: 'profile',
            title: 'User Profile',
            type: 'object',
            children: [
              {
                name: 'firstName',
                title: 'First Name',
                type: 'string',
              },
            ],
          },
        ],
      },
    ];

    const mockContextSelectorItem = {
      label: 'First Name',
      value: 'firstName',
      isLeaf: true,
      fullPath: ['user', 'profile', 'firstName'],
      meta: mockMetaTree[0].children[0].children[0],
    };

    render(
      <VariableTag
        value="{{ ctx.user.profile.firstName }}"
        contextSelectorItem={mockContextSelectorItem}
        metaTree={mockMetaTree}
      />,
    );

    // 应该显示 title 而不是 name
    const tag = screen.getByText('User Information/User Profile/First Name');
    expect(tag).toBeInTheDocument();
  });

  it('should fallback to path display when metaTree is not provided', () => {
    const mockContextSelectorItem = {
      label: 'First Name',
      value: 'firstName',
      isLeaf: true,
      fullPath: ['user', 'profile', 'firstName'],
      meta: null,
    };

    render(<VariableTag value="{{ ctx.user.profile.firstName }}" contextSelectorItem={mockContextSelectorItem} />);

    // 没有 metaTree 时应该显示 path
    const tag = screen.getByText('user/profile/firstName');
    expect(tag).toBeInTheDocument();
  });

  it('should handle function type metaTree gracefully', () => {
    const mockMetaTreeFunction = () => [
      {
        name: 'user',
        title: 'User Information',
        type: 'object',
      },
    ];

    const mockContextSelectorItem = {
      label: 'User',
      value: 'user',
      isLeaf: true,
      fullPath: ['user'],
      meta: null,
    };

    render(
      <VariableTag
        value="{{ ctx.user }}"
        contextSelectorItem={mockContextSelectorItem}
        metaTree={mockMetaTreeFunction}
      />,
    );

    // 函数类型的 metaTree 现在应该正常工作，显示 title
    const tag = screen.getByText('User Information');
    expect(tag).toBeInTheDocument();
  });
});
