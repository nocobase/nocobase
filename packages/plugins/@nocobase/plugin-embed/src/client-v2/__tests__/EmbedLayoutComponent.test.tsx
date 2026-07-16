/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routeMocks = vi.hoisted(() => ({
  outlet: null as React.ReactNode,
}));
const clientV2Mocks = vi.hoisted(() => ({
  getLayoutModel: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useOutlet: () => routeMocks.outlet,
  };
});

vi.mock('../EmbedAccessGuard', () => ({
  EmbedAccessGuard: ({ children }: { children: React.ReactNode }) => <div data-testid="embed-access">{children}</div>,
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();
  return {
    ...actual,
    getLayoutModel: clientV2Mocks.getLayoutModel,
  };
});

import { EmbedLayoutComponent } from '../EmbedLayoutComponent';
import { EMBED_LAYOUT_MODEL_UID } from '../constants';
import { EmbedLayoutModelV2, getEmbedLayoutModel } from '../EmbedLayoutModel';

function setMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function createModel(options?: { routeType?: string | null }) {
  return {
    currentLayoutRoute: options?.routeType ? { type: options.routeType } : null,
    setIsMobileLayout: vi.fn(),
    setLayoutContentElement: vi.fn(),
  };
}

describe('EmbedLayoutComponent', () => {
  beforeEach(() => {
    setMatchMedia();
    routeMocks.outlet = null;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the empty page on the embed root route', async () => {
    const model = createModel({ routeType: 'root' });

    render(
      <EmbedLayoutComponent model={model as never}>
        <div data-testid="embed-child" />
      </EmbedLayoutComponent>,
    );

    expect(screen.queryByTestId('embed-child')).not.toBeInTheDocument();
    expect(document.querySelector('.ant-empty')).toBeInTheDocument();
    expect(document.getElementById('nocobase-embed-container')).toBeInTheDocument();
    await waitFor(() => expect(model.setLayoutContentElement).toHaveBeenCalledWith(expect.any(HTMLDivElement)));
  });

  it('wraps children with access guard and tracks desktop layout state', async () => {
    const model = createModel();

    render(
      <EmbedLayoutComponent model={model as never}>
        <div data-testid="embed-child" />
      </EmbedLayoutComponent>,
    );

    expect(screen.getByTestId('embed-access')).toContainElement(screen.getByTestId('embed-child'));
    await waitFor(() => expect(model.setIsMobileLayout).toHaveBeenCalledWith(false));
  });

  it('uses router outlet content and tracks mobile fallback layout state', async () => {
    const model = createModel();
    routeMocks.outlet = <div data-testid="embed-outlet" />;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 375,
    });

    render(<EmbedLayoutComponent model={model as never} />);

    expect(screen.getByTestId('embed-access')).toContainElement(screen.getByTestId('embed-outlet'));
    await waitFor(() => expect(model.setIsMobileLayout).toHaveBeenCalledWith(true));
  });
});

describe('EmbedLayoutModelV2', () => {
  it('renders the embed layout component with model children', () => {
    const model = Object.assign(Object.create(EmbedLayoutModelV2.prototype), {
      currentLayoutRoute: null,
      props: {
        children: <div data-testid="model-child" />,
      },
      setIsMobileLayout: vi.fn(),
      setLayoutContentElement: vi.fn(),
    }) as EmbedLayoutModelV2;

    render(model.render());

    expect(screen.getByTestId('model-child')).toBeInTheDocument();
  });

  it('delegates embed layout model lookup to the layout manager with default and custom model classes', () => {
    class CustomEmbedLayoutModel extends EmbedLayoutModelV2 {}

    const flowEngine = {};
    clientV2Mocks.getLayoutModel.mockReturnValueOnce('default-model').mockReturnValueOnce('custom-model');

    expect(getEmbedLayoutModel(flowEngine as never)).toBe('default-model');
    expect(getEmbedLayoutModel(flowEngine as never, { use: CustomEmbedLayoutModel } as never)).toBe('custom-model');
    expect(clientV2Mocks.getLayoutModel).toHaveBeenNthCalledWith(1, flowEngine, EMBED_LAYOUT_MODEL_UID, {
      use: EmbedLayoutModelV2,
    });
    expect(clientV2Mocks.getLayoutModel).toHaveBeenNthCalledWith(2, flowEngine, EMBED_LAYOUT_MODEL_UID, {
      use: CustomEmbedLayoutModel,
    });
  });
});
