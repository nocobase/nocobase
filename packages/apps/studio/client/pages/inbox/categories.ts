/**
 * The kinds of Studio's inbox: the decisions and the notifications the block provides, and the plans the viewer decides,
 * a collection kept in the projects plugin's API (`inbox/plans.ts`). While every kind shows, the plans still open are a
 * group after the decisions, leaving out those an item already stands for (an executor suggestion's plan); the kind
 * Plans lists them instead of the items, every status in All (filtered by `?status=`), the open ones in To do. A plan
 * is selected by `?plan=`.
 */
import { createElement, useMemo } from 'react';

import type {
  InboxCategory,
  InboxCollectionCategory,
} from '@/extensions/nocobase-inbox/model';
import {
  decisionCategory,
  infoCategory,
} from '@/extensions/nocobase-inbox/registry';

import { paramsOf } from '../../inbox/contributions/projects-wording.js';
import { plansOf, readPlanFilter, usePlanPages } from '../../inbox/plans.js';
import { InboxOpenPlans, InboxPlanDetail, InboxPlans } from './inbox-plans.js';

export const plansCategory: InboxCollectionCategory = {
  type: 'collection',
  id: 'plans',
  label: (t) => t('inbox.kinds.plans'),
  param: 'plan',
  params: ['status'],
  after: 'decision',
  views: ['all', 'todo'],
  useCollection({ filter, entries, selectedId, onSelect, params, onParams }) {
    const pages = usePlanPages(
      'open',
      filter.view !== 'notifications' && filter.kind === 'all',
    );
    // An executor suggestion's item stands for its plan, which is then not listed again among the open plans.
    const itemPlans = useMemo(
      () =>
        new Set(
          entries.flatMap((entry) => {
            const planId = paramsOf(entry).planId;
            return planId ? [planId] : [];
          }),
        ),
      [entries],
    );
    const todo = filter.view === 'todo';
    return {
      count: plansOf(pages, itemPlans).length,
      loaded:
        filter.kind !== 'all' || pages.data !== undefined || pages.isError,
      group: createElement(InboxOpenPlans, {
        pages,
        exclude: itemPlans,
        selectedId,
        onSelect,
      }),
      list:
        filter.kind === 'plans'
          ? createElement(InboxPlans, {
              filter: todo ? 'open' : readPlanFilter(params.get('status')),
              selectedId,
              onFilter: todo
                ? undefined
                : (value) => {
                    const next = new URLSearchParams(params);
                    if (value === 'all') next.delete('status');
                    else next.set('status', value);
                    next.delete('plan');
                    onParams(next);
                  },
              onSelect,
            })
          : null,
    };
  },
  Detail: ({ id, onBack }) =>
    createElement(InboxPlanDetail, { planId: id, onBack }),
};

export const studioInboxCategories: readonly InboxCategory[] = [
  decisionCategory,
  infoCategory,
  plansCategory,
];
