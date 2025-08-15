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
import { VariableTag } from '../VariableTag';

describe('VariableTag', () => {
  it('should render with variable value and display parsed path', async () => {
    render(<VariableTag value="{{ ctx.User.Name }}" />);

    await waitFor(() => {
      const tag = screen.getByText('User/Name');
      expect(tag).toBeInTheDocument();
      expect(tag.closest('.ant-tag')).toBeInTheDocument();
    });
  });

  it('should call onClear when clear button is clicked', async () => {
    const onClear = vi.fn();
    render(<VariableTag value="{{ ctx.User.Email }}" onClear={onClear} />);

    await waitFor(() => {
      expect(screen.getByText('User/Email')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('clear');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should not show close button when onClear is not provided', async () => {
    render(<VariableTag value="{{ ctx.User.Name }}" />);

    await act(async () => {
      // 等待状态更新完成
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const closeButton = screen.queryByLabelText('clear');
    expect(closeButton).not.toBeInTheDocument();
  });

  it('should be read-only', async () => {
    render(<VariableTag value="{{ ctx.User.Name }}" />);

    await waitFor(() => {
      const tag = screen.getByText('User/Name');
      expect(tag).toBeInTheDocument();
      expect(tag).not.toHaveAttribute('contentEditable');
    });
  });

  it('should apply custom className and style', async () => {
    const customStyle = { fontSize: '16px', color: 'red' };
    render(<VariableTag value="{{ ctx.Custom.Tag }}" className="custom-class" style={customStyle} />);

    await waitFor(() => {
      const container = screen.getByText('Custom/Tag').closest('.variable');
      expect(container).toHaveClass('custom-class');
      expect(container).toHaveStyle('font-size: 16px');
      expect(container).toHaveStyle('color: rgb(255, 0, 0)');
    });
  });

  it('should have blue color by default', async () => {
    render(<VariableTag value="{{ ctx.Test }}" />);

    await waitFor(() => {
      const tag = screen.getByText('Test');
      expect(tag.closest('.ant-tag')).toHaveClass('ant-tag-blue');
    });
  });

  it('should handle long text with proper text styling', async () => {
    const longText = '{{ ctx.Very.Long.Path.That.Should.Be.Truncated.With.Ellipsis }}';
    render(<VariableTag value={longText} />);

    await waitFor(() => {
      const tag = screen.getByText('Very/Long/Path/That/Should/Be/Truncated/With/Ellipsis');
      expect(tag).toBeInTheDocument();
    });
  });

  it('should have proper styling for tag appearance', async () => {
    render(<VariableTag value="{{ ctx.Styled.Tag }}" />);

    await waitFor(() => {
      const tag = screen.getByText('Styled/Tag').closest('.ant-tag');
      expect(tag).toHaveClass('ant-tag');
      expect(tag).toHaveClass('ant-tag-blue');
    });
  });

  it('should render empty value', async () => {
    const { container } = render(<VariableTag value="" />);

    await act(async () => {
      // 等待状态更新完成
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const tag = container.querySelector('.ant-tag');
    expect(tag).toBeInTheDocument();
    expect(tag).toHaveTextContent('');
  });

  it('should handle undefined value gracefully', async () => {
    render(<VariableTag />);

    await act(async () => {
      // 等待状态更新完成
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // 应该仍然渲染tag，即使没有value
    const tag = document.querySelector('.ant-tag');
    expect(tag).toBeInTheDocument();
  });

  it('should render container with proper structure', async () => {
    render(<VariableTag value="{{ ctx.Test }}" />);

    await waitFor(() => {
      const container = screen.getByText('Test').closest('.variable');
      expect(container).toBeInTheDocument();

      const innerContainer = container?.querySelector('.variable-input-container');
      expect(innerContainer).toBeInTheDocument();

      const tag = innerContainer?.querySelector('.ant-tag');
      expect(tag).toBeInTheDocument();
    });
  });

  it('should show clear button when onClear is provided', async () => {
    const onClear = vi.fn();
    render(<VariableTag value="{{ ctx.Test }}" onClear={onClear} />);

    await waitFor(() => {
      const container = screen.getByText('Test').closest('.variable');
      const clearButton = container?.querySelector('.clear-button');
      expect(clearButton).toBeInTheDocument();
    });
  });

  it('should have correct container styling when disabled', async () => {
    render(<VariableTag value="{{ ctx.Test }}" onClear={undefined} />);

    await waitFor(() => {
      const container = screen.getByText('Test').closest('.variable');
      const innerContainer = container?.querySelector('.variable-input-container');

      expect(innerContainer).toHaveClass('ant-input-disabled');
    });
  });

  it('should have correct container styling when enabled', async () => {
    const onClear = vi.fn();
    render(<VariableTag value="{{ ctx.Test }}" onClear={onClear} />);

    await waitFor(() => {
      const container = screen.getByText('Test').closest('.variable');
      const innerContainer = container?.querySelector('.variable-input-container');

      expect(innerContainer).not.toHaveClass('ant-input-disabled');
    });
  });

  it('should have proper container role and accessibility attributes', async () => {
    render(<VariableTag value="{{ ctx.Test }}" />);

    await waitFor(() => {
      const innerContainer = screen.getByText('Test').closest('.variable-input-container');
      expect(innerContainer).toHaveAttribute('role', 'button');
      expect(innerContainer).toHaveAttribute('aria-label', 'variable-tag');
    });
  });

  it('should display title when contextSelectorItem and metaTree are provided', async () => {
    const mockMetaTree = [
      {
        name: 'user',
        title: 'User Information',
        type: 'object',
        paths: ['user'],
        children: [
          {
            name: 'profile',
            title: 'User Profile',
            type: 'object',
            paths: ['user', 'profile'],
            children: [
              {
                name: 'firstName',
                title: 'First Name',
                type: 'string',
                paths: ['user', 'profile', 'firstName'],
              },
            ],
          },
        ],
      },
    ];

    const mockMetaTreeNode = {
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      paths: ['user', 'profile', 'firstName'],
      parentTitles: ['User Information', 'User Profile'],
    };

    render(
      <VariableTag value="{{ ctx.user.profile.firstName }}" metaTreeNode={mockMetaTreeNode} metaTree={mockMetaTree} />,
    );

    // 应该显示 title 而不是 name
    await waitFor(() => {
      const tag = screen.getByText('User Information/User Profile/First Name');
      expect(tag).toBeInTheDocument();
    });
  });

  it('should fallback to title when titles is not provided', async () => {
    const mockMetaTreeNode = {
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      paths: ['user', 'profile', 'firstName'],
      // 没有 titles 属性
    };

    render(<VariableTag value="{{ ctx.user.profile.firstName }}" metaTreeNode={mockMetaTreeNode} />);

    // 没有 titles 时应该显示 title
    await waitFor(() => {
      const tag = screen.getByText('First Name');
      expect(tag).toBeInTheDocument();
    });
  });

  it('should handle function type metaTree gracefully', async () => {
    const mockMetaTreeFunction = () => [
      {
        name: 'user',
        title: 'User Information',
        type: 'object',
        paths: ['user'],
      },
    ];

    const mockMetaTreeNode = {
      name: 'user',
      title: 'User Information',
      type: 'object',
      paths: ['user'],
    };

    render(<VariableTag value="{{ ctx.user }}" metaTreeNode={mockMetaTreeNode} metaTree={mockMetaTreeFunction} />);

    await waitFor(() => {
      const tag = screen.getByText('User Information');
      expect(tag).toBeInTheDocument();
    });
  });
});
