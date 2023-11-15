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
import { NAMESPACE } from './locale';

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
    description: `{{t("Triggered but still waiting in queue to execute.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.STARTED,
    label: `{{t("On going", { ns: "${NAMESPACE}" })}}`,
    color: 'gold',
    icon: <LoadingOutlined />,
    description: `{{t("Started and executing, maybe waiting for an async callback (manual, delay etc.).", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.RESOLVED,
    label: `{{t("Resolved", { ns: "${NAMESPACE}" })}}`,
    color: 'green',
    icon: <CheckOutlined />,
    description: `{{t("Successfully finished.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.FAILED,
    label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <ExclamationOutlined />,
    description: `{{t("Failed to satisfy node configurations.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.ERROR,
    label: `{{t("Error", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <CloseOutlined />,
    description: `{{t("Some node meets error.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.ABORTED,
    label: `{{t("Aborted", { ns: "${NAMESPACE}" })}}`,
    color: 'red',
    icon: <MinusOutlined rotate={90} />,
    description: `{{t("Running of some node was aborted by program flow.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.CANCELED,
    label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <MinusOutlined rotate={45} />,
    description: `{{t("Manually canceled whole execution when waiting.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.REJECTED,
    label: `{{t("Rejected", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <MinusOutlined />,
    description: `{{t("Rejected from a manual node.", { ns: "${NAMESPACE}" })}}`,
  },
  {
    value: EXECUTION_STATUS.RETRY_NEEDED,
    label: `{{t("Retry needed", { ns: "${NAMESPACE}" })}}`,
    color: 'volcano',
    icon: <RedoOutlined />,
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
