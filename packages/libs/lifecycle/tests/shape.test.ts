// The shape checks that catch a forgotten transition, the wildcard sources,
// and what a lifecycle tells a page or a diagram about itself.
import { describe, expect, it } from 'vitest';

import {
  defineEffect,
  defineLifecycle,
  describeLifecycle,
  toMermaid,
  type LifecycleRecord,
} from '../src/index.js';

type State = 'draft' | 'review' | 'approved' | 'paid' | 'withdrawn';

interface ReportTypes {
  record: LifecycleRecord;
  state: State;
  parameters: { escalateAfterMinutes: number };
}

const pay = defineEffect<ReportTypes>({
  name: 'reports.pay',
  onSuccess: 'paid',
  run: () => null,
});

const reports = defineLifecycle<ReportTypes>({
  name: 'reports',
  initial: 'draft',
  states: [
    { name: 'draft', title: '草稿' },
    { name: 'review', title: '待审批', meta: { tone: 'warning' } },
    { name: 'approved', title: '已通过' },
    { name: 'paid', title: '已付款', final: true, meta: { tone: 'success' } },
    { name: 'withdrawn', title: '已撤回', final: true },
  ],
  parameters: { escalateAfterMinutes: 3 },
  transitions: {
    submit: { title: '提交', from: 'draft', to: 'review' },
    approve: {
      title: '通过',
      from: 'review',
      to: 'approved',
      accept: ['comment'],
      meta: { confirm: true },
    },
    escalate: { title: '超时升级', from: 'review', to: 'review' },
    paid: { title: '付款完成', from: 'approved', to: 'paid' },
    withdraw: {
      title: '撤回',
      from: { except: ['approved'] },
      to: 'withdrawn',
    },
  },
  onEnter: { approved: [pay] },
  triggers: {
    escalateStale: {
      transition: 'escalate',
      when: 'review',
      after: (p) => p.escalateAfterMinutes * 60_000,
    },
  },
});

describe('lifecycle shape', () => {
  it('refuses a state with no way out unless it is final', () => {
    expect(() =>
      defineLifecycle<ReportTypes>({
        name: 'stuck',
        initial: 'draft',
        states: ['draft', 'review'],
        transitions: { submit: { from: 'draft', to: 'review' } },
      }),
    ).toThrow(/"review" has no way out/);
  });

  it('refuses a final state that something leaves', () => {
    expect(() =>
      defineLifecycle<ReportTypes>({
        name: 'leaky',
        initial: 'draft',
        states: ['draft', { name: 'paid', final: true }],
        transitions: {
          pay: { from: 'draft', to: 'paid' },
          refund: { from: 'paid', to: 'draft' },
        },
      }),
    ).toThrow(/final state "paid" has transitions leaving it/);
  });

  it('refuses a state no initial state can reach', () => {
    expect(() =>
      defineLifecycle<ReportTypes>({
        name: 'island',
        initial: 'draft',
        states: ['draft', 'review', { name: 'paid', final: true }],
        transitions: {
          pay: { from: 'draft', to: 'paid' },
          loop: { from: 'review', to: 'review' },
        },
      }),
    ).toThrow(/"review" cannot be reached/);
  });

  it('expands a wildcard source to every state that is not final, but the excepted', () => {
    expect(reports.transitions.get('withdraw')?.from).toEqual([
      'draft',
      'review',
    ]);
    const anywhere = defineLifecycle<ReportTypes>({
      name: 'anywhere',
      initial: 'draft',
      states: ['draft', 'review', { name: 'withdrawn', final: true }],
      transitions: {
        submit: { from: 'draft', to: 'review' },
        withdraw: { from: '*', to: 'withdrawn' },
      },
    });
    expect(anywhere.transitions.get('withdraw')?.from).toEqual([
      'draft',
      'review',
    ]);
  });

  it('describes titles, final states, metadata and continuations', () => {
    const description = describeLifecycle(reports);
    expect(description.stateInfo).toContainEqual({
      name: 'paid',
      title: '已付款',
      final: true,
      meta: { tone: 'success' },
    });
    expect(description.transitions).toContainEqual(
      expect.objectContaining({
        name: 'approve',
        accept: ['comment'],
        meta: { confirm: true },
      }),
    );
    expect(description.continuations).toEqual([
      { effect: 'reports.pay', onSuccess: 'paid' },
    ]);
    expect(description.initialStates).toEqual(['draft']);
  });
});

describe('toMermaid', () => {
  it('draws the lifecycle as a state diagram', () => {
    expect(toMermaid(describeLifecycle(reports))).toBe(
      [
        'stateDiagram-v2',
        '  state "草稿" as draft',
        '  state "待审批" as review',
        '  state "已通过" as approved',
        '  state "已付款" as paid',
        '  state "已撤回" as withdrawn',
        '  [*] --> draft',
        '  draft --> review : 提交',
        '  review --> approved : 通过',
        '  review --> review : 超时升级 · ⏱ escalateStale',
        '  approved --> paid : 付款完成 · ✓ reports.pay',
        '  draft --> withdrawn : 撤回',
        '  review --> withdrawn : 撤回',
        '  paid --> [*]',
        '  withdrawn --> [*]',
        '',
      ].join('\n'),
    );
  });

  it('labels by name when asked', () => {
    expect(toMermaid(describeLifecycle(reports), { labels: 'name' })).toContain(
      '  draft --> review : submit\n',
    );
  });
});
