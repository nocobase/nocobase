/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createMockClient } from '../MockApplication';
import { Plugin } from '../Plugin';
import PoweredBy from '../components/PoweredBy';

class PoweredByRoutePlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      Component: PoweredBy,
    });
  }
}

class MockCustomBrandPlugin extends Plugin {}

const renderPoweredBy = async (plugins: any[] = [], appInfoData: Record<string, any> = { version: '1.2.3' }) => {
  const app = createMockClient({
    plugins: [PoweredByRoutePlugin as any, ...plugins],
  });

  app.apiMock.onGet('app:getInfo').reply(200, {
    data: appInfoData,
  });

  const Root = app.getRootComponent();
  const result = render(<Root />);

  await waitFor(() => {
    expect(document.querySelector('.ant-spin-spinning')).not.toBeInTheDocument();
  });

  return result;
};

describe('PoweredBy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the default brand when custom-brand is not installed', async () => {
    const { container } = await renderPoweredBy();

    expect(screen.getByRole('link', { name: 'NocoBase' })).toHaveAttribute('href', 'https://www.nocobase.com');
    expect(container).toHaveTextContent('Powered by NocoBase');
    // The `.nb-brand` className is reserved for the custom-brand HTML branch
    // so downstream stylesheets can selectively target customised content
    // without leaking onto the default footer.
    expect(container.querySelector('.nb-brand')).not.toBeInTheDocument();
  });

  it('should render custom-brand HTML and replace appVersion', async () => {
    const { container } = await renderPoweredBy([
      [
        MockCustomBrandPlugin,
        {
          packageName: '@nocobase/plugin-custom-brand',
          options: {
            brand: '<span>Custom Brand</span>{{appVersion}}',
          },
        },
      ],
    ]);

    await waitFor(() => {
      expect(container.querySelector('.nb-brand')).toHaveTextContent('Custom Brandv1.2.3');
    });
    expect(container.querySelector('.nb-app-version')).toHaveTextContent('v1.2.3');
    expect(screen.queryByText('Powered by')).not.toBeInTheDocument();
  });

  it('should not render undefined appVersion when app version is unavailable', async () => {
    const { container } = await renderPoweredBy(
      [
        [
          MockCustomBrandPlugin,
          {
            packageName: '@nocobase/plugin-custom-brand',
            options: {
              brand: '<span>Custom Brand</span>{{appVersion}}',
            },
          },
        ],
      ],
      {},
    );

    expect(container.querySelector('.nb-brand')).toHaveTextContent('Custom Brand');
    expect(container.querySelector('.nb-brand')).not.toHaveTextContent('undefined');
    expect(container.querySelector('.nb-app-version')).not.toBeInTheDocument();
  });

  it('should escape custom-brand appVersion placeholder', async () => {
    // Defence in depth: even if the back-end ever returns a tampered
    // `app:getInfo` payload, the version string must be HTML-escaped
    // before being interpolated into the custom-brand template — never
    // produce a live `<script>` node in the DOM.
    const { container } = await renderPoweredBy(
      [
        [
          MockCustomBrandPlugin,
          {
            packageName: '@nocobase/plugin-custom-brand',
            options: {
              brand: '<span>Custom Brand</span>{{appVersion}}',
            },
          },
        ],
      ],
      {
        version: '<script>alert(1)</script>&"',
      },
    );

    await waitFor(() => {
      expect(container.querySelector('.nb-app-version')).toHaveTextContent('v<script>alert(1)</script>&"');
    });
    expect(container.querySelector('.nb-brand script')).not.toBeInTheDocument();
  });
});
