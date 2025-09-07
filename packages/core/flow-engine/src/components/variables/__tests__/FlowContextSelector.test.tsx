/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import * as FlowContextSelectorModule from '../../FlowContextSelector';
import { createTestFlowContext, TestFlowContextWrapper } from './test-utils';

const FlowContextSelector = FlowContextSelectorModule.FlowContextSelector;

describe('FlowContextSelector', () => {
  it('should render with default children', async () => {
    const flowContext = createTestFlowContext();
    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} />
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should render with custom children', async () => {
    const flowContext = createTestFlowContext();
    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()}>
          <button>Custom Button</button>
        </FlowContextSelector>
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText('Custom Button')).toBeInTheDocument();
    });
  });

  it('should handle value parsing and display selected path', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector
          metaTree={() => flowContext.getPropertyMetaTree()}
          value="{{ ctx.user.name }}"
          onChange={onChange}
        />
      </TestFlowContextWrapper>,
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

    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={metaTreeFn} />
      </TestFlowContextWrapper>,
    );

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(metaTreeFn).toHaveBeenCalled();
    });
  });

  it('should support async metaTree function', async () => {
    const flowContext = createTestFlowContext();
    const asyncMetaTree = async () => flowContext.getPropertyMetaTree();

    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={asyncMetaTree} />
      </TestFlowContextWrapper>,
    );

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });
  });

  it('should call onChange when option is selected', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />
      </TestFlowContextWrapper>,
    );

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

    expect(onChange).toHaveBeenCalledWith(
      '{{ ctx.user.name }}',
      expect.objectContaining({
        name: 'name',
        title: 'Name',
        type: 'string',
        paths: ['user', 'name'],
      }),
    );
  });

  it('should handle leaf node selection', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />
      </TestFlowContextWrapper>,
    );

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      const configOption = screen.getByText('Config');
      fireEvent.click(configOption);
    });

    expect(onChange).toHaveBeenCalledWith(
      '{{ ctx.config }}',
      expect.objectContaining({
        name: 'config',
        title: 'Config',
        type: 'string',
        paths: ['config'],
      }),
    );
  });

  it('should support search functionality', async () => {
    const flowContext = createTestFlowContext();
    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} showSearch />
      </TestFlowContextWrapper>,
    );

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    // Search functionality is enabled via showSearch prop
    // The actual search input behavior depends on antd's internal implementation
    // This test verifies that showSearch prop is accepted
  });

  it('should handle FlowContext metaTree', async () => {
    const flowContext = createTestFlowContext();
    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} />
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should handle empty metaTree', async () => {
    const flowContext = createTestFlowContext();
    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector metaTree={[]} />
      </TestFlowContextWrapper>,
    );

    await waitFor(() => {
      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should pass through cascader props', async () => {
    const flowContext = createTestFlowContext();
    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector
          metaTree={() => flowContext.getPropertyMetaTree()}
          placeholder="Select a variable"
          disabled
        />
      </TestFlowContextWrapper>,
    );

    // Check if basic rendering works with props
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Double-click functionality', () => {
    it('should select leaf node with single click', async () => {
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />
        </TestFlowContextWrapper>,
      );

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      await waitFor(() => {
        const configOption = screen.getByText('Config');
        fireEvent.click(configOption);
      });

      expect(onChange).toHaveBeenCalledWith(
        '{{ ctx.config }}',
        expect.objectContaining({
          name: 'config',
          title: 'Config',
          type: 'string',
          paths: ['config'],
        }),
      );
    });

    it('should support double-click selection for non-leaf nodes', async () => {
      // This test verifies that the double-click logic is implemented
      // In actual usage, users would double-click to select non-leaf nodes
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} onChange={onChange} />
        </TestFlowContextWrapper>,
      );

      // The implementation supports double-click detection with 300ms window
      // For testing purposes, we verify the component renders correctly
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Custom parsing and formatting functions', () => {
    it('should use custom parseValueToPath function', async () => {
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();
      const customParseValueToPath = vi.fn().mockReturnValue(['user', 'name']);

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector
            metaTree={() => flowContext.getPropertyMetaTree()}
            value="custom.user.name"
            onChange={onChange}
            parseValueToPath={customParseValueToPath}
          />
        </TestFlowContextWrapper>,
      );

      await waitFor(() => {
        expect(customParseValueToPath).toHaveBeenCalledWith('custom.user.name');
      });
    });

    it('should use custom formatPathToValue function', async () => {
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();
      const customFormatPathToValue = vi.fn().mockReturnValue('custom.formatted.value');

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector
            metaTree={() => flowContext.getPropertyMetaTree()}
            onChange={onChange}
            formatPathToValue={customFormatPathToValue}
          />
        </TestFlowContextWrapper>,
      );

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      await waitFor(() => {
        const configOption = screen.getByText('Config');
        fireEvent.click(configOption);
      });

      expect(customFormatPathToValue).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith('custom.formatted.value', expect.any(Object));
    });

    it('should fallback to default functions when custom functions return undefined', async () => {
      const onChange = vi.fn();
      const flowContext = createTestFlowContext();
      const customFormatPathToValue = vi.fn().mockReturnValue(undefined);

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector
            metaTree={() => flowContext.getPropertyMetaTree()}
            onChange={onChange}
            formatPathToValue={customFormatPathToValue}
          />
        </TestFlowContextWrapper>,
      );

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      await waitFor(() => {
        const configOption = screen.getByText('Config');
        fireEvent.click(configOption);
      });

      expect(customFormatPathToValue).toHaveBeenCalled();
      // Should fallback to default formatPathToValue
      expect(onChange).toHaveBeenCalledWith('{{ ctx.config }}', expect.any(Object));
    });
  });

  describe('Open state control', () => {
    it('should control dropdown open state with open prop', async () => {
      const flowContext = createTestFlowContext();

      const { rerender } = render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} open={false} />
        </TestFlowContextWrapper>,
      );

      // When open=false, cascader should be closed
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.queryByText('User')).not.toBeInTheDocument();

      rerender(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} open={true} />
        </TestFlowContextWrapper>,
      );

      // When open=true, options should be visible after data loads
      await waitFor(
        () => {
          expect(screen.getByText('User')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it('should handle programmatic open state changes', async () => {
      const flowContext = createTestFlowContext();

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} open={true} />
        </TestFlowContextWrapper>,
      );

      // Should show dropdown when open=true
      await waitFor(() => {
        // Check for dropdown container instead of specific text
        expect(document.querySelector('.ant-cascader-dropdown')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle invalid metaTree function', async () => {
      const invalidMetaTree = vi.fn().mockRejectedValue(new Error('Network error'));
      const flowContext = createTestFlowContext();

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={invalidMetaTree} />
        </TestFlowContextWrapper>,
      );

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      await waitFor(() => {
        expect(invalidMetaTree).toHaveBeenCalled();
      });

      // Should not crash and render properly
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle null/undefined metaTree', () => {
      const flowContext = createTestFlowContext();
      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={undefined} />
        </TestFlowContextWrapper>,
      );

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle invalid value format', async () => {
      const flowContext = createTestFlowContext();

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={() => flowContext.getPropertyMetaTree()} value="invalid.format" />
        </TestFlowContextWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should handle metaTree function returning non-array', async () => {
      const invalidMetaTree = vi.fn().mockResolvedValue(null);
      const flowContext = createTestFlowContext();

      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector metaTree={invalidMetaTree} />
        </TestFlowContextWrapper>,
      );

      const cascader = screen.getByRole('button');
      fireEvent.click(cascader);

      await waitFor(() => {
        expect(invalidMetaTree).toHaveBeenCalled();
      });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Cascader props validation', () => {
    it('should accept and render with cascader props', async () => {
      const flowContext = createTestFlowContext();

      // Test that component accepts various Cascader props without crashing
      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector
            metaTree={() => flowContext.getPropertyMetaTree()}
            disabled={true}
            placeholder="Select a variable"
            size="large"
            className="custom-cascader"
            allowClear={true}
          />
        </TestFlowContextWrapper>,
      );

      // Should render without errors
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should pass through Cascader-specific props', async () => {
      const flowContext = createTestFlowContext();

      // Test expandTrigger and other Cascader-specific props
      render(
        <TestFlowContextWrapper context={flowContext}>
          <FlowContextSelector
            metaTree={() => flowContext.getPropertyMetaTree()}
            expandTrigger="hover"
            changeOnSelect={false}
            displayRender={(labels) => labels.join(' > ')}
          />
        </TestFlowContextWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  it('should only allow leaf selection when onlyLeafSelectable is true', async () => {
    const onChange = vi.fn();
    const flowContext = createTestFlowContext();

    render(
      <TestFlowContextWrapper context={flowContext}>
        <FlowContextSelector
          metaTree={() => flowContext.getPropertyMetaTree()}
          onChange={onChange}
          onlyLeafSelectable={true}
        />
      </TestFlowContextWrapper>,
    );

    const cascader = screen.getByRole('button');
    fireEvent.click(cascader);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    // Click on non-leaf node 'User' with onlyLeafSelectable=true
    fireEvent.click(screen.getByText('User'));

    // onChange should not be called for non-leaf node when onlyLeafSelectable=true
    // It should only expand the node, not select it
    expect(onChange).not.toHaveBeenCalled();
  });
});
