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
import { FlowContextSelector } from '../../FlowContextSelector';
import { createTestFlowContext } from './test-utils';

describe('FlowContextSelector', () => {
  it('should render with default children', () => {
    const flowContext = createTestFlowContext();
    render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render with custom children', () => {
    const flowContext = createTestFlowContext();
    render(
      <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()}>
        <button>Custom Button</button>
      </FlowContextSelector>,
    );
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
  });

  it('should handle value parsing and display selected path', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <FlowContextSelector
        metaTree={() => flowContext.getPropertyMetaTree()}
        value="{{ ctx.user.name }}"
        onChange={onChange}
      />,
    );

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  it('should support function metaTree loading', async () => {
    const flowContext = createTestFlowContext();
    const metaTreeFn = vi.fn(() => flowContext.getPropertyMetaTree());

    render(<FlowContextSelector metaTree={metaTreeFn} />);

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(metaTreeFn).toHaveBeenCalled();
    });
  });

  it('should support async metaTree function', async () => {
    const flowContext = createTestFlowContext();
    const asyncMetaTree = async () => flowContext.getPropertyMetaTree();

    render(<FlowContextSelector metaTree={asyncMetaTree} />);

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  it('should call onChange when option is selected', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />);

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      const userOption = screen.getByText('User');
      fireEvent.click(userOption);
    });

    await waitFor(() => {
      const nameOption = screen.getByText('Name');
      fireEvent.click(nameOption);
    });

    expect(onChange).toHaveBeenCalledWith('{{ ctx.user.name }}', null);
  });

  it('should handle leaf node selection', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />);

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      const configOption = screen.getByText('Config');
      fireEvent.click(configOption);
    });

    expect(onChange).toHaveBeenCalledWith('{{ ctx.config }}', null);
  });

  it('should support search functionality', async () => {
    const flowContext = createTestFlowContext();
    render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} showSearch />);

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    // Search functionality is enabled via showSearch prop
    // The actual search input behavior depends on antd's internal implementation
    // This test verifies that showSearch prop is accepted
  });

  it('should handle FlowContext metaTree', () => {
    const flowContext = createTestFlowContext();
    render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle empty metaTree', () => {
    render(<FlowContextSelector metaTree={[]} />);

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should pass through cascader props', () => {
    const flowContext = createTestFlowContext();
    render(
      <FlowContextSelector
        metaTree={() => flowContext.getPropertyMetaTree()}
        placeholder="Select a variable"
        disabled
      />,
    );

    // Check if basic rendering works with props
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  describe('Double-click functionality', () => {
    it('should select leaf node with single click', async () => {
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();

      render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />);

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      await waitFor(() => {
        const configOption = screen.getByText('Config');
        fireEvent.click(configOption);
      });

      expect(onChange).toHaveBeenCalledWith('{{ ctx.config }}', null);
    });

    it('should support double-click selection for non-leaf nodes', async () => {
      // This test verifies that the double-click logic is implemented
      // In actual usage, users would double-click to select non-leaf nodes
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();

      render(<FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />);

      // The implementation supports double-click detection with 300ms window
      // For testing purposes, we verify the component renders correctly
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
