/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, Plugin } from '@nocobase/client-v2';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import LicenseSetting from '../pages/LicenseSetting';

let mountId = 0;

const MockLicenseCard = () => {
  const currentMountId = React.useState(() => {
    mountId += 1;
    return mountId;
  })[0];

  return <div data-testid="license-card">{currentMountId}</div>;
};

class LicenseSettingRoutePlugin extends Plugin {
  async load() {
    this.router.add('root', {
      path: '/',
      Component: LicenseSetting,
    });
  }
}

describe('LicenseSetting', () => {
  afterEach(() => {
    cleanup();
    mountId = 0;
    vi.clearAllMocks();
  });

  it('should remount the license card after saving a changed key', async () => {
    const app = createMockClient({
      components: {
        LicenseCard: MockLicenseCard,
      },
      plugins: [LicenseSettingRoutePlugin as any],
    });

    app.apiMock.onGet('/license:is-exists').reply(200, {
      data: true,
    });
    app.apiMock.onGet('/license:instance-id').reply(200, {
      data: 'instance-id-1',
    });
    app.apiMock.onGet('/license:license-validate').reply(200, {
      data: {
        licenseStatus: 'active',
        isServiceConnection: true,
        isPkgLogin: true,
      },
    });
    app.apiMock.onPost('/license:license-key').reply(200, {
      data: {
        keyStatus: 'valid',
        licenseStatus: 'active',
        envMatch: true,
        domainMatch: true,
        isPkgLogin: true,
      },
    });

    const Root = app.getRootComponent();
    render(<Root />);

    expect(await screen.findByTestId('license-card')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: 'Change key' }));
    fireEvent.change(screen.getByPlaceholderText('Enter license key'), {
      target: { value: 'new-license-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByTestId('license-card')).toHaveTextContent('2');
    });

    expect(app.apiMock.history.post.find((request) => request.url === '/license:license-key')).toBeTruthy();
  });
});
