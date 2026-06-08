/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModelProvider } from '@nocobase/flow-engine';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BlockDeletePlaceholder } from '../BlockPlaceholder';

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
  dataSource?: { key: string; displayName?: string };
  flowSettingsEnabled?: boolean;
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

  it('should hide data source unavailable block outside configuration mode', () => {
    const model = createModel({
      dataSourceKey: 'external-mysql',
      collectionName: 'orders',
      flowSettingsEnabled: false,
    });

    const { container } = render(
      <FlowModelProvider model={model}>
        <BlockDeletePlaceholder />
      </FlowModelProvider>,
    );

    expect(
      screen.queryByText(
        'The data source "external-mysql" used by this block is disabled or unavailable. Enable the data source to display this block.',
      ),
    ).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
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
});
