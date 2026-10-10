import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { DeliveryStatus } from '../../client/git/webhook-section.js';

it.each([
  ['en-US', enUS, 'Last received'],
  ['zh-CN', zhCN, '最后收到'],
] as const)(
  'shows signed receipts independently of delivery outcomes in %s',
  async (locale, resources, label) => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'studio', resources },
      locale,
    });
    const at = new Date().toISOString();
    const view = render(
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <DeliveryStatus delivery={null} lastReceivedAt={at} />
      </TestI18nProvider>,
    );
    expect(screen.getByText(new RegExp(label))).toBeInTheDocument();
    expect(
      view.container.querySelector('[data-last-delivery]'),
    ).toHaveAttribute('data-last-delivery', 'none');
    expect(
      view.container.querySelector('[data-last-received]'),
    ).toHaveAttribute('data-last-received', at);
    view.rerender(
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <DeliveryStatus delivery={null} lastReceivedAt={null} />
      </TestI18nProvider>,
    );
    expect(
      screen.getByText(resources.studioGit.webhook.noReceived),
    ).toBeInTheDocument();
  },
);
