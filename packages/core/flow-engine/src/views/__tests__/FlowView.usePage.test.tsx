/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
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
    const pageApi = api as NonNullable<typeof api>;

    await act(async () => {
      pageApi.open({ target, content: <div data-testid="page1">Page 1</div> }, engine.context);
    });
    await waitFor(() => expect(screen.getByTestId('page1')).toBeInTheDocument());

    // Opening page2 into the global embed container should destroy page1 (replace behavior).
    await act(async () => {
      pageApi.open({ target, content: <div data-testid="page2">Page 2</div> }, engine.context);
    });
    await waitFor(() => expect(screen.getByTestId('page2')).toBeInTheDocument());
    expect(screen.queryByTestId('page1')).not.toBeInTheDocument();

    unmount();
    document.body.removeChild(target);
  });

  it('keeps active global embed view when replacement beforeClose blocks closing', async () => {
    let getViewer: () => FlowViewer;
    const beforeClose = vi.fn().mockResolvedValue(false);

    const target = document.createElement('div');
    target.id = GLOBAL_EMBED_CONTAINER_ID;
    document.body.appendChild(target);

    const { unmount } = render(
      <Wrapper
        onReady={(fn) => {
          getViewer = fn;
        }}
      />,
    );

    await waitFor(() => expect(getViewer).toBeDefined());
    const initialZIndex = getViewer().getNextZIndex();

    let page1: any;
    await act(async () => {
      page1 = getViewer().embed({
        target,
        content: (currentPage) => {
          currentPage.beforeClose = beforeClose;
          return <div data-testid="page1">Page 1</div>;
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId('page1')).toBeInTheDocument());
    expect(getViewer().getNextZIndex()).toBe(initialZIndex + 1);

    await act(async () => {
      const page2 = getViewer().embed({ target, content: <div data-testid="page2">Page 2</div> });
      await page2;
    });

    expect(beforeClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('page1')).toBeInTheDocument();
    expect(screen.queryByTestId('page2')).not.toBeInTheDocument();
    expect(getViewer().getNextZIndex()).toBe(initialZIndex + 1);

    await act(async () => {
      page1.destroy();
    });

    unmount();
    document.body.removeChild(target);
  });

  it('opens the replacement view after async beforeClose allows global embed replacement', async () => {
    let getViewer: () => FlowViewer;
    const beforeClose = vi.fn().mockResolvedValue(true);

    const target = document.createElement('div');
    target.id = GLOBAL_EMBED_CONTAINER_ID;
    document.body.appendChild(target);

    const { unmount } = render(
      <Wrapper
        onReady={(fn) => {
          getViewer = fn;
        }}
      />,
    );

    await waitFor(() => expect(getViewer).toBeDefined());

    await act(async () => {
      getViewer().embed({
        target,
        content: (currentPage) => {
          currentPage.beforeClose = beforeClose;
          return <div data-testid="page1">Page 1</div>;
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId('page1')).toBeInTheDocument());

    await act(async () => {
      getViewer().embed({ target, content: <div data-testid="page2">Page 2</div> });
    });

    await waitFor(() => expect(screen.getByTestId('page2')).toBeInTheDocument());
    expect(beforeClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('page1')).not.toBeInTheDocument();

    unmount();
    document.body.removeChild(target);
  });

  it('runs a pending close only once and allows retry when beforeClose rejects', async () => {
    let getViewer: () => FlowViewer;
    let resolveFirstClose: (value: boolean) => void;
    const beforeClose = vi
      .fn()
      .mockImplementationOnce(() => new Promise<boolean>((resolve) => (resolveFirstClose = resolve)))
      .mockResolvedValueOnce(true);

    const { unmount } = render(
      <Wrapper
        onReady={(fn) => {
          getViewer = fn;
        }}
      />,
    );

    await waitFor(() => expect(getViewer).toBeDefined());

    let page: any;
    await act(async () => {
      page = getViewer().embed({
        content: (currentPage) => {
          currentPage.beforeClose = beforeClose;
          return <div data-testid="draft-editor">Draft editor</div>;
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId('draft-editor')).toBeInTheDocument());

    const firstClose = page.close();
    const secondClose = page.close();
    expect(firstClose).toBe(secondClose);
    expect(beforeClose).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirstClose(false);
      await firstClose;
    });

    expect(screen.getByTestId('draft-editor')).toBeInTheDocument();

    await act(async () => {
      await page.close();
    });

    expect(beforeClose).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByTestId('draft-editor')).not.toBeInTheDocument());

    unmount();
  });

  it('keeps only the latest pending global embed replacement', async () => {
    let getViewer: () => FlowViewer;
    let resolveBeforeClose: (value: boolean) => void;
    const beforeClose = vi.fn(() => new Promise<boolean>((resolve) => (resolveBeforeClose = resolve)));

    const target = document.createElement('div');
    target.id = GLOBAL_EMBED_CONTAINER_ID;
    document.body.appendChild(target);

    const { unmount } = render(
      <Wrapper
        onReady={(fn) => {
          getViewer = fn;
        }}
      />,
    );

    await waitFor(() => expect(getViewer).toBeDefined());
    const initialZIndex = getViewer().getNextZIndex();

    await act(async () => {
      getViewer().embed({
        target,
        content: (currentPage) => {
          currentPage.beforeClose = beforeClose;
          return <div data-testid="page1">Page 1</div>;
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId('page1')).toBeInTheDocument());

    const page2 = getViewer().embed({ target, content: <div data-testid="page2">Page 2</div> });
    const page3 = getViewer().embed({ target, content: <div data-testid="page3">Page 3</div> });

    await act(async () => {
      resolveBeforeClose(true);
      await page2;
    });

    expect(beforeClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('page1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('page2')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('page3')).toBeInTheDocument());
    expect(getViewer().getNextZIndex()).toBe(initialZIndex + 1);

    unmount();
    document.body.removeChild(target);
  });

  it('keeps the embed close button usable after beforeClose blocks closing', async () => {
    let getViewer: () => FlowViewer;
    const beforeClose = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const { unmount } = render(
      <Wrapper
        onReady={(fn) => {
          getViewer = fn;
        }}
      />,
    );

    await waitFor(() => expect(getViewer).toBeDefined());

    await act(async () => {
      getViewer().embed({
        title: 'Draft editor',
        content: (currentPage) => {
          currentPage.beforeClose = beforeClose;
          return <div data-testid="draft-editor">Draft editor</div>;
        },
      });
    });

    await waitFor(() => expect(screen.getByTestId('draft-editor')).toBeInTheDocument());
    const closeButton = screen.getByRole('button');

    await act(async () => {
      closeButton.click();
    });

    expect(beforeClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('draft-editor')).toBeInTheDocument();

    await act(async () => {
      closeButton.click();
    });

    expect(beforeClose).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByTestId('draft-editor')).not.toBeInTheDocument());

    unmount();
  });
});
