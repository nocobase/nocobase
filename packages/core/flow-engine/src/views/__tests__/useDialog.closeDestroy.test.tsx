/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDialog } from '../useDialog';
import { FlowContext } from '../../flowContext';

// Mock dependencies
vi.mock('../provider', () => ({
  FlowEngineProvider: ({ children }) => children,
}));

vi.mock('../FlowContextProvider', () => ({
  FlowViewContextProvider: ({ children }) => children,
}));

vi.mock('../ViewScopedFlowEngine', () => ({
  createViewScopedEngine: (engine) => ({
    context: new FlowContext(),
    unlinkFromStack: vi.fn(),
  }),
}));

vi.mock('../utils/variablesParams', () => ({
  createViewRecordResolveOnServer: vi.fn(),
  getViewRecordFromParent: vi.fn(),
}));

vi.mock('../DialogComponent', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

// Mock usePatchElement to return a mock close function
const mockCloseFunc = vi.fn();
const mockPatchElement = vi.fn(() => mockCloseFunc);
vi.mock('../usePatchElement', () => ({
  default: () => [[], mockPatchElement],
}));

describe('useDialog - close/destroy logic', () => {
  const createMockFlowContext = () => {
    const ctx = new FlowContext();
    ctx.engine = {
      context: new FlowContext(),
    };
    return ctx;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderUseDialog = () => {
    let api: any;
    const TestComponent = () => {
      const [dialogApi, contextHolder] = useDialog();
      api = dialogApi;
      return contextHolder as any;
    };
    render(<TestComponent />);
    return api;
  };

  it('should call destroy (and thus closeFunc) when close is called without preventClose', () => {
    const api = renderUseDialog();
    const flowContext = createMockFlowContext();

    const dialog = api.open({}, flowContext);

    dialog.close();

    expect(mockCloseFunc).toHaveBeenCalled();
  });

  it('should not call destroy (and thus closeFunc) when close is called with preventClose=true', () => {
    const api = renderUseDialog();
    const flowContext = createMockFlowContext();

    const dialog = api.open({ preventClose: true }, flowContext);

    dialog.close();

    expect(mockCloseFunc).not.toHaveBeenCalled();
  });

  it('should call destroy (and thus closeFunc) when close is called with preventClose=true but force=true', () => {
    const api = renderUseDialog();
    const flowContext = createMockFlowContext();

    const dialog = api.open({ preventClose: true }, flowContext);

    dialog.close(undefined, true);

    expect(mockCloseFunc).toHaveBeenCalled();
  });

  it('should delegate to navigation.back when triggerByRouter is true', () => {
    const api = renderUseDialog();
    const flowContext = createMockFlowContext();
    const backMock = vi.fn();

    const dialog = api.open(
      {
        triggerByRouter: true,
        inputArgs: {
          navigation: {
            back: backMock,
          },
        },
      },
      flowContext,
    );

    dialog.close();

    expect(backMock).toHaveBeenCalled();
    // Should not call destroy directly, let router handle it
    expect(mockCloseFunc).not.toHaveBeenCalled();
  });
});
