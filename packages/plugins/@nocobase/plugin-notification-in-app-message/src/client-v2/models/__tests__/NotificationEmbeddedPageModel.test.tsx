/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({
    t: (key: string) => key,
  }),
  tExpr: (key: string) => key,
}));

vi.mock('@nocobase/client-v2', () => ({
  ChildPageModel: class {
    static define = vi.fn();

    props = {};

    onInit() {}

    renderTabs() {
      return <div data-testid="default-child-tabs" />;
    }
  },
}));

vi.mock('../../components/MobileNotificationContent', async () => {
  const ReactModule = await import('react');
  return {
    MobileNotificationContent: () => ReactModule.createElement('div', { 'data-testid': 'mobile-notification-content' }),
  };
});

import { NotificationEmbeddedPageModel } from '../NotificationEmbeddedPageModel';

describe('NotificationEmbeddedPageModel', () => {
  it('disables flow settings toolbar from page model props', () => {
    const model = Object.create(NotificationEmbeddedPageModel.prototype) as NotificationEmbeddedPageModel & {
      setProps: ReturnType<typeof vi.fn>;
    };
    model.setProps = vi.fn();

    model.onInit({});

    expect(model.setProps).toHaveBeenCalledWith('showFlowSettings', false);
  });

  it('renders mobile notification content directly instead of default child page tabs', () => {
    const model = Object.create(NotificationEmbeddedPageModel.prototype) as NotificationEmbeddedPageModel & {
      props: NotificationEmbeddedPageModel['props'];
    };
    model.props = {
      enableTabs: true,
    } as NotificationEmbeddedPageModel['props'];

    render(model.render() as React.ReactElement);

    expect(screen.getByTestId('mobile-notification-content')).toBeInTheDocument();
    expect(screen.queryByTestId('default-child-tabs')).not.toBeInTheDocument();
    expect(screen.queryByText('Notification')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });
});
