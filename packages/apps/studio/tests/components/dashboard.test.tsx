/**
 * The dashboard page: the headline figures over the period chosen (30 days at first) against the period before, the
 * agents' figures, what needs attention (or one "All clear"), each project, and the header's Refresh. Each panel reads
 * its own figures and fails on its own.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AgentFigures,
  DashboardAgents,
  DashboardAttention,
  DashboardDelivery,
  DashboardProjects,
  DeliveryFigures,
} from '../../shared/reports.js';

const delivery = vi.fn();
const agents = vi.fn();
const projects = vi.fn();
const attention = vi.fn();

const PERIOD = {
  days: 30,
  from: '2026-09-04',
  to: '2026-10-03',
  subjects: true,
} as const;

const deliveryFigures: DeliveryFigures = {
  completed: 4,
  cycleTimeP50Ms: 3_600_000,
  agentShare: 0.5,
  costPerIssue: { USD: 3 },
};

const agentFigures: AgentFigures = {
  runs: 10,
  successRate: 0.8,
  reworkRate: 0.25,
  runsPerIssue: 2,
  interventionRate: 0.1,
  queueWaitP50Ms: 2000,
};

const DELIVERY: DashboardDelivery = {
  ...PERIOD,
  currency: 'USD',
  current: deliveryFigures,
  previous: { ...deliveryFigures, completed: 2 },
  buckets: [],
};

const AGENTS: DashboardAgents = {
  ...PERIOD,
  current: agentFigures,
  previous: { ...agentFigures, reworkRate: 0.5 },
  daily: [],
};

let agentsAnswer: () => Promise<DashboardAgents>;

const PROJECTS: DashboardProjects = {
  ...PERIOD,
  projects: [
    {
      id: 'p1',
      name: 'Shop',
      total: 8,
      done: 6,
      completed: 3,
      cycleTimeP50Ms: 86_400_000,
      blocked: 1,
    },
  ],
};

const EMPTY = { total: 0, items: [] };

const NOW = new Date().toISOString();

let attentionData: DashboardAttention;

vi.mock('../../client/pages/dashboard/api.js', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('../../client/pages/dashboard/api.js')
  >()),
  useDashboardApi: () => ({
    delivery: (days: number) => {
      delivery(days);
      return Promise.resolve(DELIVERY);
    },
    agents: (days: number) => {
      agents(days);
      return agentsAnswer();
    },
    projects: (days: number) => {
      projects(days);
      return Promise.resolve(PROJECTS);
    },
    attention: () => {
      attention();
      return Promise.resolve(attentionData);
    },
  }),
}));

const { default: DashboardPage } =
  await import('../../client/pages/dashboard/index.js');

function renderDashboard(): void {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('the dashboard page', () => {
  beforeEach(() => {
    for (const read of [delivery, agents, projects, attention])
      read.mockClear();
    agentsAnswer = () => Promise.resolve(AGENTS);
    attentionData = {
      subjects: true,
      blocked: {
        total: 7,
        items: [
          { id: 'i1', identifier: 'PRJ-1', title: 'Stuck on SSO', since: NOW },
        ],
      },
      overdue: EMPTY,
      reviewWaits: {
        total: 1,
        items: [
          {
            id: 'pr-1',
            repo: 'acme/shop',
            number: 12,
            title: 'Add checkout',
            url: 'https://github.com/acme/shop/pull/12',
            since: NOW,
            issue: { id: 'i2', identifier: 'PRJ-2' },
          },
        ],
      },
      failedRuns: {
        total: 1,
        items: [
          {
            id: 'run-1',
            agentId: 'a1',
            agentName: 'Coder',
            failureReason: 'agent_error',
            finishedAt: NOW,
            issue: { id: 'i3', identifier: 'PRJ-3', title: 'Fix login' },
          },
        ],
      },
    };
  });

  it('shows the headline and agent figures for the last 30 days against the period before', async () => {
    renderDashboard();
    expect(
      await screen.findByText('dashboard.figures.completed.label'),
    ).toBeVisible();
    for (const read of [delivery, agents, projects])
      expect(read).toHaveBeenCalledWith(30);
    // Issues completed doubled; rework fell by 25 points, which is good news.
    expect(screen.getByText('+100%')).toBeVisible();
    expect(screen.getByText('dashboard.points')).toBeVisible();
    // Each figure explains itself behind ⓘ.
    expect(
      screen.getAllByRole('button', { name: 'dashboard.definition' }),
    ).toHaveLength(9);
    expect(screen.getByText('dashboard.agents.noRunsTitle')).toBeVisible();
  });

  it('lists only what needs attention, each opening the item', async () => {
    renderDashboard();
    expect(
      await screen.findByRole('link', { name: /PRJ-1.*Stuck on SSO/u }),
    ).toHaveAttribute('href', '/issues/PRJ-1');
    expect(
      screen.getByRole('link', { name: /acme\/shop#12/u }),
    ).toHaveAttribute('href', 'https://github.com/acme/shop/pull/12');
    expect(
      screen.getByRole('link', { name: /PRJ-3.*Fix login/u }),
    ).toHaveAttribute('href', '/issues/PRJ-3/runs/run-1');
    expect(screen.getByText('dashboard.attention.more')).toBeVisible();
    // Nothing is overdue, so that list is left out.
    expect(screen.queryByText('dashboard.attention.overdue')).toBeNull();
    expect(screen.queryByText('dashboard.attention.allClearTitle')).toBeNull();
  });

  it('says all is clear when nothing needs attention', async () => {
    attentionData = {
      subjects: true,
      blocked: EMPTY,
      overdue: EMPTY,
      reviewWaits: EMPTY,
      failedRuns: EMPTY,
    };
    renderDashboard();
    expect(
      await screen.findByText('dashboard.attention.allClearTitle'),
    ).toBeVisible();
  });

  it('shows each project with its progress, linking to it', async () => {
    renderDashboard();
    expect(await screen.findByRole('link', { name: 'Shop' })).toHaveAttribute(
      'href',
      '/projects/p1',
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '75',
    );
  });

  it('shows a failed panel on its own while the others show their figures', async () => {
    agentsAnswer = () => Promise.reject(new Error('Agents failed'));
    renderDashboard();
    expect(
      await screen.findByText('dashboard.figures.completed.label'),
    ).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Shop' })).toBeVisible();
    // The agents' panel offers its own retry.
    expect(
      await screen.findByRole('button', { name: 'common.retry' }),
    ).toBeVisible();
  });

  it('reads every block again on Refresh', async () => {
    renderDashboard();
    await screen.findByText('dashboard.figures.completed.label');
    await waitFor(() => expect(attention).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'actions.refresh' }));
    for (const read of [delivery, agents, projects, attention])
      await waitFor(() => expect(read).toHaveBeenCalledTimes(2));
  });
});
