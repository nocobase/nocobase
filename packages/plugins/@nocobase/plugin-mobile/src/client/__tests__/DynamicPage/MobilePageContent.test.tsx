/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, render, screen, userEvent, waitFor, waitForApp } from '@nocobase/test/client';
import Basic from '../../demos/pages-page-content-basic';
import FirstRoute from '../../demos/pages-page-content-first-route';
import NotFound from '../../demos/pages-page-content-404';
import { MobilePageContentContainer } from '../../pages/dynamic-page/content';

const device = vi.hoisted(() => ({ isDesktop: false }));

vi.mock('react-device-detect', async () => ({
  ...(await vi.importActual('react-device-detect')),
  get isDesktop() {
    return device.isDesktop;
  },
}));

describe('MobilePageContent', () => {
  let resizeObserverCallback: ResizeObserverCallback | undefined;
  let resizeObserverObserve: ReturnType<typeof vi.fn>;

  const mockDynamicViewportUnitSupport = (supported: boolean) => {
    vi.stubGlobal('CSS', {
      supports: vi.fn(() => supported),
    });
  };

  const notifyResizeObserver = async () => {
    const resizeObserver = {
      disconnect: vi.fn(),
      observe: vi.fn(),
      unobserve: vi.fn(),
    } as unknown as ResizeObserver;

    await act(async () => {
      resizeObserverCallback?.([], resizeObserver);
    });
  };

  const flushLayoutFrame = async () => {
    await act(async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    });
  };

  beforeEach(() => {
    device.isDesktop = false;
    resizeObserverCallback = undefined;
    resizeObserverObserve = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn((callback: ResizeObserverCallback) => {
        resizeObserverCallback = callback;
        return {
          observe: resizeObserverObserve,
          disconnect: vi.fn(),
        };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('basic', async () => {
    render(<Basic />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('Schema Test Page')).toBeInTheDocument();
    });
  });

  it('render first route', async () => {
    render(<FirstRoute />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('First Route Content')).toBeInTheDocument();
    });
  });

  it('not found', async () => {
    render(<NotFound />);
    await waitForApp();

    await waitFor(() => {
      expect(screen.queryByText('404')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Back Home'));
    });

    await waitFor(() => {
      expect(screen.queryByText('404')).not.toBeInTheDocument();
    });
  });

  it('keeps page content scrollable on mobile devices', async () => {
    mockDynamicViewportUnitSupport(true);
    let headerHeight = 50;
    let tabBarHeight = 49;
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('mobile-page-header')) {
        return headerHeight;
      }

      if (this.classList.contains('mobile-tab-bar')) {
        return tabBarHeight;
      }

      return 0;
    });

    render(
      <>
        <div className="mobile-page-header" />
        <MobilePageContentContainer>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="mobile-tab-bar" />
      </>,
    );

    await waitFor(() => {
      const content = screen.getByTestId('mobile-page-content');
      expect(content.style.height).toBe('calc(100dvh - 99px)');
      expect(content.style.overflowY).toBe('auto');
      expect(content.style.WebkitOverflowScrolling).toBe('touch');
    });

    headerHeight = 80;
    tabBarHeight = 60;
    await notifyResizeObserver();

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100dvh - 140px)');
    });
  });

  it('does not re-observe layout elements from resize notifications', async () => {
    mockDynamicViewportUnitSupport(true);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('mobile-page-header')) {
        return 50;
      }

      if (this.classList.contains('mobile-tab-bar')) {
        return 49;
      }

      return 0;
    });

    render(
      <>
        <div className="mobile-page-header" />
        <MobilePageContentContainer>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="mobile-tab-bar" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100dvh - 99px)');
    });
    await flushLayoutFrame();

    const observeCount = resizeObserverObserve.mock.calls.length;
    await notifyResizeObserver();
    await flushLayoutFrame();

    expect(resizeObserverObserve).toHaveBeenCalledTimes(observeCount);
  });

  it('falls back to 100vh when dynamic viewport units are unsupported', async () => {
    mockDynamicViewportUnitSupport(false);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('mobile-page-header')) {
        return 50;
      }

      if (this.classList.contains('mobile-tab-bar')) {
        return 49;
      }

      return 0;
    });

    render(
      <>
        <div className="mobile-page-header" />
        <MobilePageContentContainer>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="mobile-tab-bar" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100vh - 99px)');
    });
  });

  it('does not reserve a hidden page header height', async () => {
    mockDynamicViewportUnitSupport(true);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('mobile-page-header')) {
        return 50;
      }

      if (this.classList.contains('mobile-tab-bar')) {
        return 49;
      }

      return 0;
    });

    const { rerender } = render(
      <>
        <div className="mobile-page-header" />
        <MobilePageContentContainer>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="mobile-tab-bar" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100dvh - 99px)');
    });

    rerender(
      <>
        <div className="mobile-page-header" />
        <MobilePageContentContainer displayPageHeader={false}>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="mobile-tab-bar" />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100dvh - 49px)');
    });
  });

  it('reserves fixed action page footer space in the scroll container', async () => {
    mockDynamicViewportUnitSupport(true);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('nb-mobile-action-page-footer')) {
        return 46;
      }

      return 0;
    });

    render(
      <div className="nb-mobile-action-page">
        <MobilePageContentContainer hideTabBar displayPageHeader={false}>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="nb-mobile-action-page-footer" />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100dvh - 46px)');
    });
  });

  it('does not reserve a parent action page footer for a nested action page without footer', async () => {
    mockDynamicViewportUnitSupport(true);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('nb-mobile-action-page-footer')) {
        return 46;
      }

      return 0;
    });

    render(
      <div className="nb-mobile-action-page">
        <div className="nb-mobile-action-page">
          <MobilePageContentContainer hideTabBar displayPageHeader={false}>
            <div>Nested content</div>
          </MobilePageContentContainer>
        </div>
        <div className="nb-mobile-action-page-footer" />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mobile-page-content').style.height).toBe('calc(100dvh - 0px)');
    });
  });

  it('keeps desktop preview height based on its container', async () => {
    device.isDesktop = true;
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      if (this.classList.contains('mobile-page-header')) {
        return 50;
      }

      if (this.classList.contains('mobile-tab-bar')) {
        return 49;
      }

      return 0;
    });

    render(
      <>
        <div className="mobile-page-header" />
        <MobilePageContentContainer>
          <div>Scrollable content</div>
        </MobilePageContentContainer>
        <div className="mobile-tab-bar" />
      </>,
    );

    await waitFor(() => {
      const content = screen.getByTestId('mobile-page-content');
      expect(content.style.height).toBe('calc(100% - 99px)');
      expect(content.style.overflowY).toBe('');
      expect(content.style.WebkitOverflowScrolling).toBe('');
    });
  });
});
