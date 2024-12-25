/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  CloseOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  MinusOutlined,
  ExclamationOutlined,
  HourglassOutlined,
  LoadingOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { i18n } from '@nocobase/client';
import { NAMESPACE, lang } from './locale';

export const EXECUTION_STATUS = {
  QUEUEING: null,
  STARTED: 0,
  RESOLVED: 1,
  FAILED: -1,
  ERROR: -2,
  ABORTED: -3,
  CANCELED: -4,
  REJECTED: -5,
  RETRY_NEEDED: -6,
};

export const ExecutionStatusOptions = [
  {
    value: EXECUTION_STATUS.QUEUEING,
    label: `{{t("Queueing", { ns: "${NAMESPACE}" })}}`,
    color: 'blue',
    icon: <HourglassOutlined />,
    statusType: 'info',
    description: `{{t("Triggered but still waiting in queue to execute.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.STARTED,
    label: `{{t("On going", { ns: "${NAMESPACE}" })}}`,
    color: 'gold',
    icon: <LoadingOutlined />,
    statusType: 'warning',
    description: `{{t("Started and executing, maybe waiting for an async callback (manual, delay etc.).", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.RESOLVED,
    label: `{{t("Resolved", { ns: "${NAMESPACE}" })}}`,
    color: 'green',
    icon: <CheckOutlined />,
    statusType: 'success',
    description: `{{t("Successfully finished.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.FAILED,
    label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <ExclamationOutlined />,
    statusType: 'error',
    description: `{{t("Failed to satisfy node configurations.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.ERROR,
    label: `{{t("Error", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <CloseOutlined />,
    statusType: 'error',
    description: `{{t("Some node meets error.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.ABORTED,
    label: `{{t("Aborted", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <MinusOutlined rotate={90} />,
    statusType: 'error',
    description: `{{t("Running of some node was aborted by program flow.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.CANCELED,
    label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <MinusOutlined rotate={45} />,
    statusType: 'error',
    description: `{{t("Manually canceled whole execution when waiting.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.REJECTED,
    label: `{{t("Rejected", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <MinusOutlined />,
    statusType: 'error',
    description: `{{t("Rejected from a manual node.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.RETRY_NEEDED,
    label: `{{t("Retry needed", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <RedoOutlined />,
    statusType: 'error',
    description: `{{t("General failed but should do another try.", { ns: "${NAMESPACE}" })}}`,
  },
];

export const ExecutionStatusOptionsMap = ExecutionStatusOptions.reduce(
  (map, option) => Object.assign(map, { [option.value as number]: option }),
  {},
);

export const JOB_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  FAILED: -1,
  ERROR: -2,
  ABORTED: -3,
  CANCELED: -4,
  REJECTED: -5,
  RETRY_NEEDED: -6,
};

export const JobStatusOptions = [
  {
    value: JOB_STATUS.PENDING,
    label: `{{t("Pending", { ns: "${NAMESPACE}" })}}`,
    color: 'gold',
    icon: <ClockCircleOutlined />,
  },
  {
    value: JOB_STATUS.RESOLVED,
    label: `{{t("Resolved", { ns: "${NAMESPACE}" })}}`,
    color: 'green',
    icon: <CheckOutlined />,
  },
  {
    value: JOB_STATUS.FAILED,
    label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <ExclamationOutlined />,
  },
  { value: JOB_STATUS.ERROR, label: `{{t("Error", { ns: "${NAMESPACE}" })}}`, color: 'red', icon: <CloseOutlined /> },
  {
    value: JOB_STATUS.ABORTED,
    label: `{{t("Aborted", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <MinusOutlined rotate={90} />,
  },
  {
    value: JOB_STATUS.CANCELED,
    label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <MinusOutlined rotate={45} />,
  },
  {
    value: JOB_STATUS.REJECTED,
    label: `{{t("Rejected", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <MinusOutlined />,
  },
  {
    value: JOB_STATUS.RETRY_NEEDED,
    label: `{{t("Retry needed", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <RedoOutlined />,
  },
];

export const JobStatusOptionsMap = JobStatusOptions.reduce(
  (map, option) => Object.assign(map, { [option.value]: option }),
  {},
);
export function rootLang(key: string, options = {}) {
  return i18n.t(key, { ...options });
}
export const dateRangeSystemVariables = {
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
