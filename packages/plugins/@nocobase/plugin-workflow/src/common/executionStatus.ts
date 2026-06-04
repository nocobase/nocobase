/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EXECUTION_REASON, NAMESPACE } from './constants';

/**
 * Framework-neutral execution-status metadata shared between the legacy
 * `src/client/` (v1) and the new `src/client-v2/` lanes. The `label` /
 * `description` strings are i18n templates compiled via `useT()` in v2 and
 * `Schema.compile`/`useCompile` in v1. Colors are antd `Tag` preset color
 * names (not raw hex), so they stay token-driven.
 *
 * The legacy `src/client/constants.tsx` keeps its own richer copy (with React
 * icon nodes) because it is consumed by ~100 v1 files; this module only carries
 * the plain data the v2 lane needs and never imports `@nocobase/client`.
 */
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
} as const;

export type ExecutionStatusOption = {
  value: number | null;
  label: string;
  color: string;
  description?: string;
};

export const EXECUTION_STATUS_OPTIONS: ExecutionStatusOption[] = [
  {
    value: EXECUTION_STATUS.QUEUEING,
    label: `{{t("Queueing", { ns: "${NAMESPACE}" })}}`,
    color: 'blue',
    description: `{{t("Triggered but still waiting in queue to execute.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.STARTED,
    label: `{{t("On going", { ns: "${NAMESPACE}" })}}`,
    color: 'gold',
    description: `{{t("Started and executing, maybe waiting for an async callback (manual, delay etc.).", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.RESOLVED,
    label: `{{t("Resolved", { ns: "${NAMESPACE}" })}}`,
    color: 'green',
    description: `{{t("Successfully finished.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.FAILED,
    label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    description: `{{t("Failed to satisfy node configurations.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.ERROR,
    label: `{{t("Error", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    description: `{{t("Some node meets error.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.ABORTED,
    label: `{{t("Aborted", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    description: `{{t("Running of some node was aborted by program flow.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.CANCELED,
    label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    description: `{{t("Manually canceled whole execution when waiting.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.REJECTED,
    label: `{{t("Rejected", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    description: `{{t("Rejected from a manual node.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.RETRY_NEEDED,
    label: `{{t("Retry needed", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    description: `{{t("General failed but should do another try.", { ns: "${NAMESPACE}" })}}`,
  },
];

export const EXECUTION_STATUS_OPTIONS_MAP: Record<string, ExecutionStatusOption> = EXECUTION_STATUS_OPTIONS.reduce(
  (map, option) => Object.assign(map, { [option.value as number]: option }),
  {},
);

export type ExecutionReasonOption = {
  value: string;
  label: string;
};

export const EXECUTION_REASON_OPTIONS: ExecutionReasonOption[] = [
  {
    value: EXECUTION_REASON.TIMEOUT,
    label: `{{t("Timed out", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_REASON.MANUAL_CANCEL,
    label: `{{t("Canceled manually", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_REASON.PARENT_ABORTED,
    label: `{{t("Aborted with parent execution", { ns: "${NAMESPACE}" })}}`,
  },
];

export const EXECUTION_REASON_OPTIONS_MAP: Record<string, ExecutionReasonOption> = EXECUTION_REASON_OPTIONS.reduce(
  (map, option) => Object.assign(map, { [option.value]: option }),
  {},
);
