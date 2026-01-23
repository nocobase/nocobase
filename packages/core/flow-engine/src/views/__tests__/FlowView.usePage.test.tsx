/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, beforeEach } from 'vitest';
import { render, act, waitFor, screen } from '@testing-library/react';
import { FlowEngine } from '../../flowEngine';
import { FlowEngineProvider } from '../../provider';
import { FlowViewer } from '../FlowView';
import { usePage, GLOBAL_EMBED_CONTAINER_ID } from '../usePage';
import { App, ConfigProvider } from 'antd';

describe('FlowViewer zIndex with usePage', () => {
  let engine: FlowEngine;

  function TestApp({ onReady }: { onReady: (getViewer: () => FlowViewer) => void }) {
    const [page, pageHolder] = usePage() as [{ open: (config: any, flowContext: any) => any }, React.ReactNode];

    React.useEffect(() => {
      const wrappedTypes = {
        embed: {
          open: (props: any, ctx: any) => {
            return page.open(props, ctx);
          },
        },
        drawer: { open: () => Promise.resolve() },
        dialog: { open: () => Promise.resolve() },
        popover: { open: () => Promise.resolve() },
      };

      engine.context.defineProperty('themeToken', {
        value: { zIndexPopupBase: 1000 },
      });

      const getViewer = () => new FlowViewer(engine.context, wrappedTypes);
      onReady(getViewer);
    }, [page, onReady]);

    return <>{pageHolder}</>;
  }

  const Wrapper: React.FC<{ onReady: (getViewer: () => FlowViewer) => void }> = ({ onReady }) => (
    <ConfigProvider>
      <App>
        <FlowEngineProvider engine={engine}>
          <TestApp onReady={onReady} />
        </FlowEngineProvider>
      </App>
    </ConfigProvider>
  );

  beforeEach(() => {
    engine = new FlowEngine();
  });

  it('open page1 -> open page2 -> close page2 -> open page3: internal zIndex counter should be correct', async () => {
    let getViewer: () => FlowViewer;

    const { unmount } = render(
      <Wrapper
        onReady={(fn) => {
          getViewer = fn;
        }}
      />,
    );

    await waitFor(() => expect(getViewer).toBeDefined());

    // Record initial zIndex
    const initialZIndex = getViewer().getNextZIndex();

    // Open page1
    let page1: any;
    await act(async () => {
      page1 = getViewer().embed({ content: <div data-testid="page1">Page 1</div> });
    });

    await waitFor(() => expect(screen.getByTestId('page1')).toBeInTheDocument());

    // After opening page1, zIndex counter should increment
    const afterPage1ZIndex = getViewer().getNextZIndex();
    expect(afterPage1ZIndex).toBe(initialZIndex + 1);

    // Open page2
    let page2: any;
    await act(async () => {
      page2 = getViewer().embed({ content: <div data-testid="page2">Page 2</div> });
    });

    await waitFor(() => expect(screen.getByTestId('page2')).toBeInTheDocument());

    // After opening page2, zIndex counter should increment again
    const afterPage2ZIndex = getViewer().getNextZIndex();
    expect(afterPage2ZIndex).toBe(initialZIndex + 2);

    // Close page2
    await act(async () => {
      page2.close();
    });

    await waitFor(() => expect(screen.queryByTestId('page2')).not.toBeInTheDocument());

    // After closing page2, zIndex counter should decrement back
    const afterClosePage2ZIndex = getViewer().getNextZIndex();
    expect(afterClosePage2ZIndex).toBe(initialZIndex + 1);

    // Open page3
    let page3: any;
    await act(async () => {
      page3 = getViewer().embed({ content: <div data-testid="page3">Page 3</div> });
    });

    await waitFor(() => expect(screen.getByTestId('page3')).toBeInTheDocument());

    // After opening page3, zIndex should be same as after page2 was opened (counter reused)
    const afterPage3ZIndex = getViewer().getNextZIndex();
    expect(afterPage3ZIndex).toBe(afterPage2ZIndex);

    // Cleanup
    await act(async () => {
      page3.close();
      page1.close();
    });

    unmount();
  });

  it('replaces previous embed view when using global #nocobase-embed-container target', async () => {
    let api: { open: (config: any, flowContext: any) => any } | undefined;

    function TestApp({ onReady }: { onReady: (page: any) => void }) {
      const [page, pageHolder] = usePage() as [{ open: (config: any, flowContext: any) => any }, React.ReactNode];

      React.useEffect(() => {
        onReady(page);
      }, [page, onReady]);

      return <>{pageHolder}</>;
    }

    const Wrapper: React.FC<{ onReady: (page: any) => void }> = ({ onReady }) => (
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <TestApp onReady={onReady} />
          </FlowEngineProvider>
        </App>
      </ConfigProvider>
    );

    const target = document.createElement('div');
    target.id = GLOBAL_EMBED_CONTAINER_ID;
    document.body.appendChild(target);

    const { unmount } = render(
      <Wrapper
        onReady={(page) => {
          api = page;
        }}
      />,
    );

    await waitFor(() => expect(api).toBeDefined());

    await act(async () => {
      api!.open({ target, content: <div data-testid="page1">Page 1</div> }, engine.context);
    });
    await waitFor(() => expect(screen.getByTestId('page1')).toBeInTheDocument());

    // Opening page2 into the global embed container should destroy page1 (replace behavior).
    await act(async () => {
      api!.open({ target, content: <div data-testid="page2">Page 2</div> }, engine.context);
    });
    await waitFor(() => expect(screen.getByTestId('page2')).toBeInTheDocument());
    expect(screen.queryByTestId('page1')).not.toBeInTheDocument();

    unmount();
    document.body.removeChild(target);
  });
});
