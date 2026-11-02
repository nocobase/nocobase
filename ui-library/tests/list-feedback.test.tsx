import { render, screen, within } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { readmeTranslations } from './readme-translations.js';
import {
  ListFeedback,
  ListFeedbackActions,
} from '../registry/components/list-feedback.js';

it('does not resolve hidden feedback or actions while the list is ready', async () => {
  const runtime = await createTestI18nRuntime({
    application: { namespace: '@nocobase/ready-list', resources: {} },
  });
  render(
    <TestI18nProvider runtime={runtime}>
      <ListFeedback state='ready'>
        <p>Ready records</p>
      </ListFeedback>
      <ListFeedbackActions state='ready' onRetry={vi.fn()} />
    </TestI18nProvider>,
  );
  expect(screen.getByText('Ready records')).toBeVisible();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

for (const locale of ['en-US', 'zh-CN'] as const) {
  it(`renders concise feedback with the documented ${locale} resources`, async () => {
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
            <ListFeedback state={state} />
          </MemoryRouter>
        </TestI18nProvider>,
      );
      const role =
        state === 'empty' || state === 'no-results' ? 'status' : 'alert';
      const status = screen.getByRole(role);
      const messageKey =
        state === 'no-results'
          ? 'noResults'
          : state === 'refresh-failed'
            ? 'refreshFailed'
            : state;
      expect(status.textContent).toBe(
        translations[`listFeedback.${messageKey}`],
      );
      expect(status.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(within(status).queryByRole('button')).not.toBeInTheDocument();
    }
  });
}
