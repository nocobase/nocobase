/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { i18n } from '@nocobase/client';
import { lang } from './locale';

export function rootLang(key: string, options = {}) {
  return i18n.t(key, { ...options });
}
export default {
  key: 'dateRange',
  label: lang('Date range'),
  value: 'dateRange',
  children: [
    {
      key: 'yesterday',
      value: 'yesterday',
      label: rootLang('Yesterday'),
    },
    {
      key: 'today',
      value: 'today',
      label: rootLang('Today'),
    },
    {
      key: 'tomorrow',
      value: 'tomorrow',
      label: rootLang('Tomorrow'),
    },
    {
      key: 'lastWeek',
      value: 'lastWeek',
      label: rootLang('Last week'),
    },
    {
      key: 'thisWeek',
      value: 'thisWeek',
      label: rootLang('This week'),
    },
    {
      key: 'nextWeek',
      value: 'nextWeek',
      label: rootLang('Next week'),
    },
    {
      key: 'lastMonth',
      value: 'lastMonth',
      label: rootLang('Last month'),
    },
    {
      key: 'thisMonth',
      value: 'thisMonth',
      label: rootLang('This month'),
    },
    {
      key: 'nextMonth',
      value: 'nextMonth',
      label: rootLang('Next month'),
    },
    {
      key: 'lastQuarter',
      value: 'lastQuarter',
      label: rootLang('Last quarter'),
    },
    {
      key: 'thisQuarter',
      value: 'thisQuarter',
      label: rootLang('This quarter'),
    },
    {
      key: 'nextQuarter',
      value: 'nextQuarter',
      label: rootLang('Next quarter'),
    },
    {
      key: 'lastYear',
      value: 'lastYear',
      label: rootLang('Last year'),
    },
    {
      key: 'thisYear',
      value: 'thisYear',
      label: rootLang('This year'),
    },
    {
      key: 'nextYear',
      value: 'nextYear',
      label: rootLang('Next year'),
    },
    {
      key: 'last7Days',
      value: 'last7Days',
      label: rootLang('Last 7 days'),
    },
    {
      key: 'next7Days',
      value: 'next7Days',
      label: rootLang('Next 7 days'),
    },
    {
      key: 'last30Days',
      value: 'last30Days',
      label: rootLang('Last 30 days'),
    },
    {
      key: 'next30Days',
      value: 'next30Days',
      label: rootLang('Next 30 days'),
    },
    {
      key: 'last90Days',
      value: 'last90Days',
      label: rootLang('Last 90 days'),
    },
    {
      key: 'next90Days',
      value: 'next90Days',
      label: rootLang('Next 90 days'),
    },
  ],
};
