/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';

import { useCompile, Variable } from '@nocobase/client';
import type { DefaultOptionType } from 'antd/lib/cascader';

import { useWorkflowVariableOptions } from '../variable';
import { NAMESPACE } from '../locale';

const dateRangeSystemVariables = {
  key: 'dateRange',
  label: `{{t('Date range', { ns: '${NAMESPACE}' })}}`,
  value: 'dateRange',
  children: [
    {
      key: 'yesterday',
      value: 'yesterday',
      label: '{{t("Yesterday")}}',
    },
    {
      key: 'today',
      value: 'today',
      label: '{{t("Today")}}',
    },
    {
      key: 'tomorrow',
      value: 'tomorrow',
      label: '{{t("Tomorrow")}}',
    },
    {
      key: 'lastWeek',
      value: 'lastWeek',
      label: '{{t("Last week")}}',
    },
    {
      key: 'thisWeek',
      value: 'thisWeek',
      label: '{{t("This week")}}',
    },
    {
      key: 'nextWeek',
      value: 'nextWeek',
      label: '{{t("Next week")}}',
    },
    {
      key: 'lastMonth',
      value: 'lastMonth',
      label: '{{t("Last month")}}',
    },
    {
      key: 'thisMonth',
      value: 'thisMonth',
      label: '{{t("This month")}}',
    },
    {
      key: 'nextMonth',
      value: 'nextMonth',
      label: '{{t("Next month")}}',
    },
    {
      key: 'lastQuarter',
      value: 'lastQuarter',
      label: '{{t("Last quarter")}}',
    },
    {
      key: 'thisQuarter',
      value: 'thisQuarter',
      label: '{{t("This quarter")}}',
    },
    {
      key: 'nextQuarter',
      value: 'nextQuarter',
      label: '{{t("Next quarter")}}',
    },
    {
      key: 'lastYear',
      value: 'lastYear',
      label: '{{t("Last year")}}',
    },
    {
      key: 'thisYear',
      value: 'thisYear',
      label: '{{t("This year")}}',
    },
    {
      key: 'nextYear',
      value: 'nextYear',
      label: '{{t("Next year")}}',
    },
    {
      key: 'last7Days',
      value: 'last7Days',
      label: '{{t("Last 7 days")}}',
    },
    {
      key: 'next7Days',
      value: 'next7Days',
      label: '{{t("Next 7 days")}}',
    },
    {
      key: 'last30Days',
      value: 'last30Days',
      label: '{{t("Last 30 days")}}',
    },
    {
      key: 'next30Days',
      value: 'next30Days',
      label: '{{t("Next 30 days")}}',
    },
    {
      key: 'last90Days',
      value: 'last90Days',
      label: '{{t("Last 90 days")}}',
    },
    {
      key: 'next90Days',
      value: 'next90Days',
      label: '{{t("Next 90 days")}}',
    },
  ],
};

export function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  const compile = useCompile();
  const scope: Partial<DefaultOptionType>[] | (() => Partial<DefaultOptionType>[]) = useWorkflowVariableOptions();
  const index = scope.findIndex((v) => v.key === '$system');

  scope[index].children.push(compile(dateRangeSystemVariables));
  return (
    <Variable.Input value={value} onChange={onChange} scope={scope}>
      {renderSchemaComponent()}
    </Variable.Input>
  );
}
