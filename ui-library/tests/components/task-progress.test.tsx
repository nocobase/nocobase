import { render as renderBare, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';
import { readmeTranslations } from '../readme-translations.js';
import { TaskProgress } from '../../registry/components/task-progress.js';

const english = readmeTranslations('components')['en-US'];
const runtime = await createTestI18nRuntime({
  locale: 'en-US',
  application: { namespace: '@nocobase/task-progress', resources: english },
});
/** Render inside the application i18n provider, as an installed copy runs. */
function render(ui: ReactElement) {
  const view = renderBare(
    <TestI18nProvider runtime={runtime}>{ui}</TestI18nProvider>,
  );
  return {
    ...view,
    rerender: (next: ReactElement) =>
      view.rerender(
        <TestI18nProvider runtime={runtime}>{next}</TestI18nProvider>,
      ),
  };
}

it('shows real counts as a determinate bar and no number while the total is unknown', () => {
  const view = render(
    <TaskProgress
      status='queued'
      label='Contact import'
      continuesInBackground
    />,
  );
  const waiting = screen.getByRole('progressbar', { name: 'Contact import' });
  expect(waiting).not.toHaveAttribute('aria-valuenow');
  expect(screen.queryByText(/%/u)).toBeNull();
  expect(
    screen.getByText('It keeps running if you leave this page.'),
  ).toBeVisible();

  view.rerender(
    <TaskProgress
      status='running'
      label='Contact import'
      processed={30}
      total={120}
    />,
  );
  const bar = screen.getByRole('progressbar', { name: 'Contact import' });
  expect(bar).toHaveAttribute('aria-valuenow', '25');
  expect(bar).toHaveAttribute('aria-valuetext', 'In progress, 30 of 120, 25%');
  expect(screen.getByText('30 of 120 · 25%')).toBeVisible();

  view.rerender(
    <TaskProgress status='running' label='Contact import' processed={30} />,
  );
  expect(
    screen.getByRole('progressbar', { name: 'Contact import' }),
  ).not.toHaveAttribute('aria-valuenow');
  expect(screen.getByText('30 processed')).toBeVisible();
});

it('announces status changes once and not each percentage update', () => {
  const view = render(
    <TaskProgress status='running' label='Customer export' percent={10} />,
  );
  expect(screen.getAllByRole('status')).toHaveLength(1);
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('Customer export: In progress');
  view.rerender(
    <TaskProgress status='running' label='Customer export' percent={60} />,
  );
  expect(screen.getByRole('status')).toBe(status);
  expect(status).toHaveTextContent('Customer export: In progress');
  view.rerender(
    <TaskProgress
      status='completed'
      label='Customer export'
      percent={100}
      message='The file is ready below.'
      actions={<button type='button'>Download</button>}
    />,
  );
  expect(screen.queryByRole('progressbar')).toBeNull();
  expect(status).toHaveTextContent('Customer export: Completed');
  expect(screen.getByText('The file is ready below.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Download' })).toBeVisible();
});

it('keeps the processed count and the recovery action after a failure', () => {
  render(
    <TaskProgress
      status='failed'
      label='Contact import'
      statusLabel='Stopped'
      processed={60}
      total={120}
      message='Row 61 has no email address.'
      actions={<button type='button'>Import again</button>}
    />,
  );
  expect(screen.getByText('Stopped')).toBeVisible();
  expect(screen.getByText('60 of 120')).toBeVisible();
  expect(screen.getByText('Row 61 has no email address.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Import again' })).toBeVisible();
});

for (const locale of ['en-US', 'zh-CN'] as const) {
  it(`uses the documented ${locale} copy`, async () => {
    const resources = readmeTranslations('components')[locale];
    const runtime = await createTestI18nRuntime({
      locale,
      application: { namespace: '@nocobase/task-docs', resources },
    });
    renderBare(
      <TestI18nProvider runtime={runtime}>
        <TaskProgress
          status='running'
          label='Import'
          processed={1}
          total={4}
          continuesInBackground
        />
      </TestI18nProvider>,
    );
    expect(screen.getByText(resources['taskProgress.running']!)).toBeVisible();
    expect(
      screen.getByText(resources['taskProgress.background']!),
    ).toBeVisible();
    expect(
      screen.getByText(
        `${resources['taskProgress.count']!.replace('{{processed}}', '1').replace('{{total}}', '4')} · 25%`,
      ),
    ).toBeVisible();
  });
}
