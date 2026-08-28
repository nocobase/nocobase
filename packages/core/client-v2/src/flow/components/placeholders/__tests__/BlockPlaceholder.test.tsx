/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelProvider } from '@nocobase/flow-engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BlockDeletePlaceholder, BlockResourceErrorPlaceholder } from '../BlockPlaceholder';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => {
      return key.replace(/\{\{(\w+)\}\}/g, (_, name) => values?.[name] ?? '');
    },
  }),
}));

function createModel(options: {
  dataSourceKey?: string;
  collectionName?: string;
  dataSource?: { key: string; displayName?: string; status?: string };
  flowSettingsEnabled?: boolean;
  refresh?: () => Promise<unknown>;
}) {
  const model: any = {
    context: {
      flowSettingsEnabled: options.flowSettingsEnabled,
    },
    dataSource: options.dataSource,
    resource: {
      resourceName: options.collectionName,
    },
    getResourceSettingsInitParams: () => ({
      dataSourceKey: options.dataSourceKey,
      collectionName: options.collectionName,
    }),
    refresh: options.refresh,
  };
  model.context.blockModel = model;
  return model;
}

describe('BlockPlaceholder', () => {
  it('should render data source unavailable placeholder in configuration mode when the configured data source is missing', () => {
    const model = createModel({
      dataSourceKey: 'external-mysql',
      collectionName: 'orders',
      flowSettingsEnabled: true,
    });

    render(
      <FlowModelProvider model={model}>
        <BlockDeletePlaceholder />
      </FlowModelProvider>,
    );

    expect(
      screen.getByText(
        'The data source "external-mysql" used by this block is disabled or unavailable. Enable the data source to display this block.',
      ),
    ).toBeInTheDocument();
  });

  it('should render data source unavailable placeholder outside configuration mode', () => {
    const model = createModel({
      dataSourceKey: 'external-mysql',
      collectionName: 'orders',
      flowSettingsEnabled: false,
    });

    render(
      <FlowModelProvider model={model}>
        <BlockDeletePlaceholder />
      </FlowModelProvider>,
    );

    expect(
      screen.getByText(
        'The data source "external-mysql" used by this block is disabled or unavailable. Enable the data source to display this block.',
      ),
    ).toBeInTheDocument();
  });

  it('should treat a failed data source as unavailable', () => {
    const model = createModel({
      dataSourceKey: 'external-mysql',
      collectionName: 'orders',
      dataSource: { key: 'external-mysql', displayName: 'External MySQL', status: 'loading-failed' },
    });

    render(
      <FlowModelProvider model={model}>
        <BlockDeletePlaceholder />
      </FlowModelProvider>,
    );

    expect(
      screen.getByText(
        'The data source "External MySQL" is temporarily unavailable. Please try again later or contact an administrator.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('The Collection "External MySQL > orders" may have been deleted. Please remove this Block.'),
    ).not.toBeInTheDocument();
  });

  it('should keep collection deleted placeholder when the data source is available', () => {
    const model = createModel({
      dataSourceKey: 'external-mysql',
      collectionName: 'orders',
      dataSource: { key: 'external-mysql', displayName: 'External MySQL' },
    });

    render(
      <FlowModelProvider model={model}>
        <BlockDeletePlaceholder />
      </FlowModelProvider>,
    );

    expect(
      screen.getByText('The Collection "External MySQL > orders" may have been deleted. Please remove this Block.'),
    ).toBeInTheDocument();
  });

  it('should render a retryable resource error placeholder', async () => {
    const refresh = vi.fn().mockRejectedValue(new Error('still unavailable'));
    const model = createModel({
      dataSourceKey: 'external-mysql',
      collectionName: 'orders',
      dataSource: { key: 'external-mysql', displayName: 'External MySQL' },
      refresh,
    });

    render(
      <FlowModelProvider model={model}>
        <BlockResourceErrorPlaceholder />
      </FlowModelProvider>,
    );

    expect(screen.getByText('Data loading failed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The data source "External MySQL" is temporarily unavailable. Please try again later or contact an administrator.',
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });
});
