/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const NAMESPACE = '@nocobase/plugin-async-task-manager';

export const TASK_STATUS = {
  PENDING: null,
  RUNNING: 0,
  SUCCEEDED: 1,
  FAILED: -1,
  CANCELED: -2,
} as const;

export const TASK_STATUS_OPTIONS = {
  [TASK_STATUS.PENDING]: {
    value: TASK_STATUS.PENDING,
    label: `{{t('Waiting', { ns: '${NAMESPACE}' })}}`,
    color: 'default',
    icon: 'ClockCircleOutlined',
  },
  [TASK_STATUS.RUNNING]: {
    value: TASK_STATUS.RUNNING,
    label: `{{t('Processing', { ns: '${NAMESPACE}' })}}`,
    color: 'processing',
    icon: 'LoadingOutlined',
  },
  [TASK_STATUS.SUCCEEDED]: {
    value: TASK_STATUS.SUCCEEDED,
    label: `{{t('Completed', { ns: '${NAMESPACE}' })}}`,
    color: 'success',
    icon: 'CheckCircleOutlined',
  },
  [TASK_STATUS.FAILED]: {
    value: TASK_STATUS.FAILED,
    label: `{{t('Failed', { ns: '${NAMESPACE}' })}}`,
    color: 'error',
    icon: 'CloseCircleOutlined',
  },
  [TASK_STATUS.CANCELED]: {
    value: TASK_STATUS.CANCELED,
    label: `{{t('Canceled', { ns: '${NAMESPACE}' })}}`,
    color: 'warning',
    icon: 'StopOutlined',
  },
} as const;

export const TASK_RESULT_TYPE = {
  NONE: 'none',
  FILE: 'file',
  DATA: 'data',
} as const;
