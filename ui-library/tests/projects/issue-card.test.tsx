import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  IssueCard,
  IssueCardSkeleton,
  type IssueCardIssue,
  type IssueCardProps,
} from '../../registry/projects/issue-card';
import { readmeTranslations } from '../readme-translations';

const translations = readmeTranslations('projects');

async function runtimeFor(locale: 'en-US' | 'zh-CN') {
  return createTestI18nRuntime({
    locale,
    application: {
      namespace: '@nocobase/test-app',
      resources: translations[locale],
    },
  });
}

const enRuntime = await runtimeFor('en-US');

const ISSUE: IssueCardIssue = {
  id: '1',
  identifier: 'PM-12',
  title: 'Drag cards between columns',
  status: { name: 'In progress', color: 'blue' },
  priority: 'urgent',
  owner: { name: 'Ada Lovelace' },
  executor: { name: 'Code Agent', kind: 'agent' },
  dueDate: '2000-01-15',
  labels: [
    { id: 'l1', name: 'board', color: 'blue' },
    { id: 'l2', name: 'ui', color: 'green' },
    { id: 'l3', name: 'drag', color: 'orange' },
    { id: 'l4', name: 'a11y', color: 'purple' },
  ],
};

function renderCard(
  props: Partial<IssueCardProps>,
  runtime = enRuntime,
): ReturnType<typeof render> {
  return render(
    <TestI18nProvider runtime={runtime}>
      <IssueCard issue={ISSUE} locale='en-US' {...props} />
    </TestI18nProvider>,
  );
}

describe('IssueCard', () => {
  it('is one link named by its identifier and title', () => {
    renderCard({ href: '/issues/PM-12' });
    const link = screen.getByRole('link', {
      name: 'PM-12 Drag cards between columns',
    });
    expect(link).toHaveAttribute('href', '/issues/PM-12');
    expect(link).toHaveAttribute('draggable', 'false');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('selects on a plain click of its link and leaves modifier clicks to the browser', () => {
    const onSelect = vi.fn();
    renderCard({ href: '#PM-12', onSelect });
    const link = screen.getByRole('link');
    expect(fireEvent.click(link)).toBe(false);
    expect(onSelect).toHaveBeenCalledWith(ISSUE, expect.anything());
    onSelect.mockClear();
    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('is a button without href', () => {
    const onSelect = vi.fn();
    renderCard({ onSelect, size: 'card' });
    expect(screen.queryByRole('link')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'PM-12 Drag cards between columns' }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows neither link nor button with neither', () => {
    renderCard({});
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Drag cards between columns')).toBeInTheDocument();
  });

  it('draws the link through the link renderer', () => {
    const link = vi.fn(
      (props: { href: string; children?: unknown }): ReactElement => (
        <a {...props} data-router='yes' />
      ),
    );
    renderCard({ href: '/issues/PM-12', link });
    expect(screen.getByRole('link')).toHaveAttribute('data-router', 'yes');
  });

  it('shows the status, priority, people, due date and the first three labels', () => {
    renderCard({ size: 'card' });
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Urgent')).toHaveClass('sr-only');
    expect(screen.getByTitle('Owner: Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByTitle('Executor: Code Agent')).toBeInTheDocument();
    expect(screen.getByText('Overdue since Jan 15')).toBeInTheDocument();
    expect(screen.getByText('drag')).toBeInTheDocument();
    expect(screen.queryByText('a11y')).toBeNull();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows nothing for no priority and leaves out what it is not given', () => {
    renderCard({
      issue: {
        id: '2',
        identifier: 'PM-2',
        title: 'Bare',
        priority: 'none',
      },
    });
    expect(screen.queryByText('Urgent')).toBeNull();
    expect(screen.queryByTitle(/Owner/u)).toBeNull();
    expect(screen.queryByText(/Due/u)).toBeNull();
  });

  it('keeps trailing actions clickable without selecting the issue', () => {
    const onSelect = vi.fn();
    const onRemove = vi.fn();
    renderCard({
      href: '/issues/PM-12',
      onSelect,
      trailing: (
        <button type='button' onClick={onRemove}>
          Remove
        </button>
      ),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('translates its words and takes replacements', async () => {
    renderCard({ size: 'card' }, await runtimeFor('zh-CN'));
    expect(screen.getByText('紧急')).toBeInTheDocument();
    expect(screen.getByTitle('负责人: Ada Lovelace')).toBeInTheDocument();
    document.body.innerHTML = '';
    renderCard({ labels: { owner: 'Lead' } });
    expect(screen.getByTitle('Lead: Ada Lovelace')).toBeInTheDocument();
  });
});

describe('IssueCardSkeleton', () => {
  it('is a status named for what loads', () => {
    render(
      <TestI18nProvider runtime={enRuntime}>
        <IssueCardSkeleton size='card' />
      </TestI18nProvider>,
    );
    const status = screen.getByRole('status', { name: 'Loading issue' });
    expect(within(status).queryByRole('link')).toBeNull();
  });
});
