import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlanCard } from '../../registry/projects/plan-card/plan-card';
import { planIssues } from '../../registry/projects/plan-card/plan-issues';
import enUS from '../../registry/projects/plan-card/locales/en-US';
import { resetPlanDemo } from '../../website/demo/projects/projects-plan-kit';

vi.mock(
  '@nocobase/app-plugin-projects/client/kit',
  () => import('../../website/demo/projects/projects-plan-kit'),
);

vi.mock('@nocobase/app-client', () => ({
  useToaster: () => ({ show: vi.fn(), close: vi.fn() }),
}));

const runtime = await createTestI18nRuntime({
  application: {
    namespace: '@nocobase/test-app',
    resources: enUS as unknown as Record<string, string>,
  },
});

beforeEach(() => resetPlanDemo());

describe("the plan card's issues", () => {
  it('links each issue the plan is about under its title, where the caller says', () => {
    render(
      <MemoryRouter>
        <TestI18nProvider runtime={runtime}>
          <PlanCard
            planId='plan-pending'
            issueHref={(issue) => `/over/${issue.identifier}`}
          />
        </TestI18nProvider>
      </MemoryRouter>,
    );
    const issues = within(screen.getByRole('list', { name: 'Issues' }));
    expect(issues.getAllByRole('link')).toHaveLength(1);
    expect(
      issues.getByRole('link', { name: 'PM-34 Mentions' }),
    ).toHaveAttribute('href', '/over/PM-34');
  });
});

describe('planIssues', () => {
  const plan = {
    source: { kind: 'statusRule', issueId: 'i-1' },
    rows: [
      {
        position: 1,
        op: 'dependency',
        params: { issue: 'PM-2', dependsOn: 'i-3' },
        check: null,
        result: null,
      },
      {
        position: 0,
        op: 'issue.update',
        params: { issue: 'i-2', set: { parentIssueId: 'i-1' } },
        check: {
          target: {
            type: 'issue',
            id: 'i-2',
            identifier: 'PM-2',
            title: 'Two',
          },
        },
        result: null,
      },
      {
        position: 2,
        op: 'issue.create',
        params: { title: 'New', parentIssueId: { ref: 'x' } },
        check: null,
        result: {
          created: {
            type: 'issue',
            id: 'i-4',
            identifier: 'PM-4',
            title: 'Four',
          },
          target: null,
        },
      },
    ],
  } as unknown as Plan;

  it('lists the source issue, then the rows’ in order, each once, a key matched to its id', () => {
    expect(planIssues(plan).map((issue) => issue.id)).toEqual([
      'i-1',
      'i-2',
      'i-3',
      'i-4',
    ]);
    expect(planIssues(plan)[1]).toEqual({
      id: 'i-2',
      identifier: 'PM-2',
      title: 'Two',
    });
  });

  it('puts the issue it was opened from first', () => {
    expect(planIssues(plan, 'PM-2').map((issue) => issue.id)).toEqual([
      'i-2',
      'i-1',
      'i-3',
      'i-4',
    ]);
  });
});
