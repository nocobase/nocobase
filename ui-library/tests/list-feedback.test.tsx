import { render, screen } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { readmeTranslations } from './readme-translations.js';
import { ListFeedback } from '../registry/components/list-feedback.js';

it('does not resolve hidden feedback or actions while the list is ready', async () => {
  const runtime = await createTestI18nRuntime({
    application: { namespace: '@nocobase/ready-list', resources: {} },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <ListFeedback state='ready' onRetry={vi.fn()}>
        <p>Ready records</p>
      </ListFeedback>
    </TestI18nProvider>,
  );
  expect(screen.getByText('Ready records')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

for (const locale of ['en-US', 'zh-CN'] as const) {
  it(`renders every feedback state with the documented ${locale} resources`, async () => {
    const translations = readmeTranslations('components')[locale];
    const runtime = await createTestI18nRuntime({
      locale,
      application: {
        namespace: '@nocobase/feedback-docs',
        resources: translations,
      },
    });
    const view = render(
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter>
          <ListFeedback state='loading' />
        </MemoryRouter>
      </TestI18nProvider>,
    );
    for (const state of [
      'empty',
      'no-results',
      'forbidden',
      'unauthenticated',
      'failed',
      'refresh-failed',
    ] as const) {
      view.rerender(
        <TestI18nProvider runtime={runtime}>
          <MemoryRouter>
            <ListFeedback state={state} onClear={vi.fn()} onRetry={vi.fn()} />
          </MemoryRouter>
        </TestI18nProvider>,
      );
      expect(
        screen.getByRole(
          state === 'empty' || state === 'no-results' ? 'status' : 'alert',
        ),
      ).toBeVisible();
      if (state === 'no-results') {
        expect(
          screen.getByText(translations['listFeedback.noResults']!),
        ).toBeVisible();
        expect(
          screen.queryByText(/Try another search|请尝试其他关键词/),
        ).not.toBeInTheDocument();
      }
    }
  });
}
