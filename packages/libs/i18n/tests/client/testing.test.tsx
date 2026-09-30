import { act, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { useTranslation } from '../../src/client/index.js';
import { APP_NS } from '../../src/core/index.js';
import {
  MissingTranslationError,
  TestI18nProvider,
  createTestI18nRuntime,
} from '../../src/testing/index.js';

const APP = '@acme/app';
const PLUGIN = '@acme/app-plugin-orders';

const appEnUS = { save: 'Save', title: 'Acme' };
const ordersEnUS = {
  title: 'Orders',
  count_one: '{{count}} order',
  count_other: '{{count}} orders',
  actions: { create: 'New order' },
};

function OrdersTitle(): ReactElement {
  const { t } = useTranslation();
  return <h1>{t('title')}</h1>;
}

function OrdersToolbar(): ReactElement {
  const { t } = useTranslation(PLUGIN);
  return (
    <>
      <button type='button'>{t('actions.create')}</button>
      <button type='button'>{t('save')}</button>
      <span>{t('count', { count: 3 })}</span>
      <span>{t('title', { ns: APP_NS })}</span>
    </>
  );
}

function Key({ name }: { readonly name: string }): ReactElement {
  const { t } = useTranslation(PLUGIN);
  return <span>{t(name, { defaultValue: 'Fallback' })}</span>;
}

describe('createTestI18nRuntime', () => {
  it('translates nested keys, plurals, interpolation and the namespace fallback chain', async () => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: APP, resources: appEnUS },
      namespaces: { [PLUGIN]: ordersEnUS },
    });

    render(
      <TestI18nProvider runtime={runtime}>
        <OrdersToolbar />
      </TestI18nProvider>,
    );

    expect(
      screen.getByRole('button', { name: 'New order' }),
    ).toBeInTheDocument();
    // The plugin has no `save`; the chain reaches the application's.
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByText('3 orders')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('accepts a loader map and switches language like an application', async () => {
    const runtime = await createTestI18nRuntime({
      namespaces: {
        [PLUGIN]: {
          'en-US': () => Promise.resolve({ default: ordersEnUS }),
          'zh-CN': () => Promise.resolve({ default: { title: '订单' } }),
        },
      },
    });

    render(
      <TestI18nProvider runtime={runtime} namespace={PLUGIN}>
        <OrdersTitle />
      </TestI18nProvider>,
    );
    expect(screen.getByRole('heading')).toHaveTextContent('Orders');

    await act(() => runtime.changeLanguage('zh-CN'));
    expect(screen.getByRole('heading')).toHaveTextContent('订单');
    expect(runtime.i18n.language).toBe('zh-CN');
  });

  it('renders in the requested locale from the first frame', async () => {
    const runtime = await createTestI18nRuntime({
      locale: 'zh-CN',
      namespaces: { [PLUGIN]: { title: '订单' } },
    });

    render(
      <TestI18nProvider runtime={runtime} namespace={PLUGIN}>
        <OrdersTitle />
      </TestI18nProvider>,
    );

    expect(screen.getByRole('heading')).toHaveTextContent('订单');
    expect(runtime.getLocale()).toBe('zh-CN');
  });

  it('throws on a key missing from the whole chain, even when a defaultValue would hide it', async () => {
    const runtime = await createTestI18nRuntime({
      namespaces: { [PLUGIN]: ordersEnUS },
    });

    expect(() =>
      render(
        <TestI18nProvider runtime={runtime}>
          <Key name='actions.saving' />
        </TestI18nProvider>,
      ),
    ).toThrow(MissingTranslationError);
  });

  it('falls back to defaultValue and the key when strict mode is off', async () => {
    const runtime = await createTestI18nRuntime({
      strict: false,
      namespaces: { [PLUGIN]: ordersEnUS },
    });

    render(
      <TestI18nProvider runtime={runtime}>
        <Key name='actions.saving' />
      </TestI18nProvider>,
    );

    expect(screen.getByText('Fallback')).toBeInTheDocument();
  });

  it('reports a component that relies on a scope it is not rendered in', async () => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: APP, resources: { save: 'Save' } },
      namespaces: { [PLUGIN]: ordersEnUS },
    });

    // Rendered by the application rather than under its own routes, a bare `useTranslation()` reads the application's
    // namespace, which has no `title`.
    expect(() =>
      render(
        <TestI18nProvider runtime={runtime}>
          <OrdersTitle />
        </TestI18nProvider>,
      ),
    ).toThrow(/Missing translation "title" in namespace "@acme\/app"/);
  });
});
