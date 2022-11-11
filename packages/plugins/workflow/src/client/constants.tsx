import React from 'react';
import {
  CloseOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  ExclamationOutlined,
} from '@ant-design/icons';
import { NAMESPACE } from './locale';

export const EXECUTION_STATUS = {
  QUEUEING: null,
  STARTED: 0,
  SUCCEEDED: 1,
  FAILED: -1,
  CANCELED: -2
};

export const ExecutionStatusOptions = [
  { value: EXECUTION_STATUS.QUEUEING, label: `{{t("Queueing", { ns: "${NAMESPACE}" })}}`, color: 'blue' },
  { value: EXECUTION_STATUS.STARTED, label: `{{t("On going", { ns: "${NAMESPACE}" })}}`, color: 'gold' },
  { value: EXECUTION_STATUS.SUCCEEDED, label: `{{t("Succeeded", { ns: "${NAMESPACE}" })}}`, color: 'green' },
  { value: EXECUTION_STATUS.FAILED, label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`, color: 'red' },
  { value: EXECUTION_STATUS.CANCELED, label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}` },
];

export const ExecutionStatusOptionsMap = ExecutionStatusOptions.reduce((map, option) => Object.assign(map, { [option.value]: option }), {});

export const JOB_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  REJECTED: -1,
  CANCELED: -2
};

export const JobStatusOptions = [
  { value: JOB_STATUS.PENDING, label: `{{t("Pending", { ns: "${NAMESPACE}" })}}`, color: '#d4c306', icon: <ClockCircleOutlined /> },
  { value: JOB_STATUS.RESOLVED, label: `{{t("Succeeded", { ns: "${NAMESPACE}" })}}`, color: '#67c068', icon: <CheckOutlined /> },
  { value: JOB_STATUS.REJECTED, label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`, color: '#f40', icon: <ExclamationOutlined /> },
  { value: JOB_STATUS.CANCELED, label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`, color: '#f40', icon: <CloseOutlined /> }
];

export const JobStatusOptionsMap = JobStatusOptions.reduce((map, option) => Object.assign(map, { [option.value]: option }), {});
