import { PlanWordingContext } from '@nocobase/app-plugin-projects/client/kit';
import type { Plan } from '@nocobase/app-plugin-projects/shared/plans';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import en from '../../client/locales/en-US.js';
import zh from '../../client/locales/zh-CN.js';

const identities = vi.hoisted(() => ({
  name: '项目经理',
  loading: false,
  failed: false,
}));
vi.mock('@nocobase/app-plugin-agents/client/runs', () => ({
  useAgentIdentities: () => ({
    ...identities,
    nameOf: (id: string) =>
      !identities.failed &&
      !identities.loading &&
      id === 'studio-project-manager'
        ? identities.name
        : null,
  }),
}));
const { StudioPlanWording } =
  await import('../../client/agents/plan-wording.js');
afterEach(cleanup);

function Probe({ plan }: { readonly plan: Plan }) {
  const word = useContext(PlanWordingContext);
  return <p>{word?.(plan)?.title}</p>;
}
const planOf = (known: boolean): Plan =>
  ({
    source: {
      kind: 'statusRule',
      data: {
        rule: 'suggestExecutor',
        agentName: 'Project manager',
        agentNameKey: 'studioAgents.projectManager.name',
        agentNameNs: 'studio',
        identifier: 'PM-1',
      },
    },
    rows: known
      ? [
          {
            op: 'issue.update',
            params: {
              issue: 'old',
              set: {
                executor: { type: 'agent', id: 'studio-project-manager' },
              },
            },
          },
        ]
      : [],
  }) as unknown as Plan;

describe('old recommended executor identity labels', () => {
  it.each(['en-US', 'zh-CN'] as const)(
    'uses the current database name in %s and updates after two renames',
    async (locale) => {
      identities.loading = false;
      identities.failed = false;
      const runtime = await createTestI18nRuntime({
        application: {
          namespace: 'studio',
          resources: locale === 'en-US' ? en : zh,
        },
        locale,
      });
      const element = () => (
        <TestI18nProvider runtime={runtime} namespace='studio'>
          <StudioPlanWording>
            <Probe plan={planOf(true)} />
          </StudioPlanWording>
        </TestI18nProvider>
      );
      identities.name = '项目经理';
      const view = render(element());
      for (const name of ['项目经理', 'Team lead', '负责人']) {
        identities.name = name;
        view.rerender(element());
        expect(
          screen.getByText((text) => text.includes(name)),
        ).toBeInTheDocument();
        expect(
          screen.queryByText((text) => text.includes('Project manager')),
        ).toBeNull();
      }
    },
  );

  it('does not guess a legacy identity from its English name or expose one after permission refusal', async () => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'studio', resources: en },
      locale: 'en-US',
    });
    identities.loading = false;
    identities.failed = true;
    const element = (known: boolean) => (
      <TestI18nProvider runtime={runtime} namespace='studio'>
        <StudioPlanWording>
          <Probe plan={planOf(known)} />
        </StudioPlanWording>
      </TestI18nProvider>
    );
    const view = render(element(false));
    expect(screen.getByText('Let An agent work on PM-1')).toBeInTheDocument();
    view.rerender(element(true));
    expect(screen.getByText('Let An agent work on PM-1')).toBeInTheDocument();
    identities.failed = false;
    identities.loading = true;
    view.rerender(element(true));
    expect(screen.getByText('Let … work on PM-1')).toBeInTheDocument();
  });
});
