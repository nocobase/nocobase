/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const routeParams: { name?: string; dataSourceKey?: string } = {};

const flowMocks = {
  ctx: {
    app: {
      pluginSettingsManager: {
        getRoutePath: vi.fn(() => '/settings/data-sources'),
      },
    },
    dataSourceManager: {
      ensureLoaded: vi.fn(() => Promise.resolve()),
      getDataSources: vi.fn(() => [
        {
          key: 'main',
          displayName: 'Main',
          status: 'loaded',
        },
        {
          key: 'external/source',
          displayName: '{{t("External source")}}',
          status: 'loading-failed',
        },
      ]),
    },
    router: {
      navigate: vi.fn(),
    },
  },
  engine: {
    context: {
      t: vi.fn((key: string) => `t:${key}`),
    },
  },
};

vi.mock('@nocobase/flow-engine', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/flow-engine')>();
  return {
    ...actual,
    useFlowContext: () => flowMocks.ctx,
    useFlowEngine: () => flowMocks.engine,
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useParams: () => routeParams,
  };
});

vi.mock('../components/CollectionsPage', () => ({
  default: ({ dataSourceKey, title }: { dataSourceKey: string; title?: React.ReactNode }) => (
    <section data-testid="collections-page">
      <div data-testid="collections-page-key">{dataSourceKey}</div>
      {title}
    </section>
  ),
}));

import DataSourceCollectionsPage from '../DataSourceCollectionsPage';

describe('DataSourceCollectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete routeParams.name;
    delete routeParams.dataSourceKey;
  });

  it('renders a route-bound data source with breadcrumb navigation', async () => {
    routeParams.name = 'external%2Fsource';

    render(<DataSourceCollectionsPage />);

    expect(await screen.findByTestId('collections-page-key')).toHaveTextContent('external/source');
    expect(screen.getByText('t:External source')).toBeInTheDocument();
    expect(screen.getByText('t:Failed')).toBeInTheDocument();

    fireEvent.click(screen.getByText('t:Data sources'));

    expect(flowMocks.ctx.app.pluginSettingsManager.getRoutePath).toHaveBeenCalledWith('data-source-manager.list');
    expect(flowMocks.ctx.router.navigate).toHaveBeenCalledWith('/settings/data-sources');
  });

  it('falls back to an available data source when the current key is unavailable', async () => {
    flowMocks.ctx.dataSourceManager.getDataSources.mockReturnValueOnce([
      {
        key: 'external/source',
        displayName: 'External source',
        status: 'loaded',
      },
    ]);

    render(<DataSourceCollectionsPage />);

    await waitFor(() =>
      expect(flowMocks.ctx.dataSourceManager.ensureLoaded).toHaveBeenCalledWith({ force: true, keys: ['*'] }),
    );
    expect(await screen.findByTestId('collections-page-key')).toHaveTextContent('external/source');
  });
});
