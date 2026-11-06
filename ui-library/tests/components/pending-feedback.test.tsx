import { act, render, screen } from '@testing-library/react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readmeTranslations } from '../readme-translations.js';
import {
  Loading,
  RefreshIndicator,
} from '../../registry/components/loading.js';
import { PendingButton } from '../../registry/components/pending-button.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
for (const locale of ['en-US', 'zh-CN'] as const) {
  it(`uses documented ${locale} copy and a single announcement outside the busy element`, async () => {
    const resources = readmeTranslations('components')[locale];
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: '@nocobase/pending-docs', resources },
    });
    const view = render(
      <TestI18nProvider runtime={runtime}>
        <PendingButton busy>Save</PendingButton>
      </TestI18nProvider>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).toBeNull();
    expect(screen.getByRole('button')).toHaveAccessibleName(
      resources['pendingFeedback.working'],
    );
    act(() => vi.advanceTimersByTime(9700));
    expect(screen.getByRole('status')).toHaveTextContent(
      resources['pendingFeedback.longWait']!,
    );
    view.rerender(
      <TestI18nProvider runtime={runtime}>
        <Loading />
      </TestI18nProvider>,
    );
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      resources['status.loading']!,
    );
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).toBeNull();
  });
}

for (const locale of ['en-US', 'zh-CN'] as const) {
  it(`announces a ${locale} background refresh once after the display delay`, async () => {
    const resources = readmeTranslations('components')[locale];
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: '@nocobase/refresh-docs', resources },
    });
    const view = render(
      <TestI18nProvider runtime={runtime}>
        <RefreshIndicator pending />
      </TestI18nProvider>,
    );
    act(() => vi.advanceTimersByTime(299));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      resources['status.refreshing']!,
    );
    act(() => vi.advanceTimersByTime(9700));
    expect(screen.getByRole('status')).toHaveTextContent(
      resources['pendingFeedback.longWait']!,
    );
    view.rerender(
      <TestI18nProvider runtime={runtime}>
        <RefreshIndicator pending={false} />
      </TestI18nProvider>,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
}
