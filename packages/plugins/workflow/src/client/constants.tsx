import React from 'react';
import {
  CloseOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  MinusOutlined,
  HourglassOutlined,
  ExclamationOutlined,
  PoweroffOutlined,
  StopOutlined
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
  REJECTED: -5
};

export const ExecutionStatusOptions = [
  { value: EXECUTION_STATUS.QUEUEING, label: `{{t("Queueing", { ns: "${NAMESPACE}" })}}`, color: 'blue', icon: <HourglassOutlined /> },
  { value: EXECUTION_STATUS.STARTED, label: `{{t("On going", { ns: "${NAMESPACE}" })}}`, color: 'gold' },
  { value: EXECUTION_STATUS.RESOLVED, label: `{{t("Succeeded", { ns: "${NAMESPACE}" })}}`, color: 'green' },
  { value: EXECUTION_STATUS.FAILED, label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`, color: 'red' },
  { value: EXECUTION_STATUS.ERROR, label: `{{t("Error", { ns: "${NAMESPACE}" })}}`, color: 'red' },
  { value: EXECUTION_STATUS.ABORTED, label: `{{t("Aborted", { ns: "${NAMESPACE}" })}}`, color: 'red' },
  { value: EXECUTION_STATUS.CANCELED, label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`, color: 'volcano' },
  { value: EXECUTION_STATUS.REJECTED, label: `{{t("Rejected", { ns: "${NAMESPACE}" })}}`, color: 'volcano' },
];

export const ExecutionStatusOptionsMap = ExecutionStatusOptions.reduce((map, option) => Object.assign(map, { [option.value]: option }), {});

export const JOB_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  FAILED: -1,
  ERROR: -2,
  ABORTED: -3,
  CANCELED: -4,
  REJECTED: -5
};

export const JobStatusOptions = [
  { value: JOB_STATUS.PENDING, label: `{{t("Pending", { ns: "${NAMESPACE}" })}}`, color: 'gold', icon: <ClockCircleOutlined /> },
  { value: JOB_STATUS.RESOLVED, label: `{{t("Succeeded", { ns: "${NAMESPACE}" })}}`, color: 'green', icon: <CheckOutlined /> },
  { value: JOB_STATUS.FAILED, label: `{{t("Failed", { ns: "${NAMESPACE}" })}}`, color: 'red', icon: <ExclamationOutlined /> },
  { value: JOB_STATUS.ERROR, label: `{{t("Error", { ns: "${NAMESPACE}" })}}`, color: 'red', icon: <CloseOutlined /> },
  { value: JOB_STATUS.ABORTED, label: `{{t("Aborted", { ns: "${NAMESPACE}" })}}`, color: 'red', icon: <PoweroffOutlined /> },
  { value: JOB_STATUS.CANCELED, label: `{{t("Canceled", { ns: "${NAMESPACE}" })}}`, color: 'volcano', icon: <StopOutlined /> },
  { value: JOB_STATUS.REJECTED, label: `{{t("Rejected", { ns: "${NAMESPACE}" })}}`, color: 'volcano', icon: <MinusOutlined /> },
];

export const JobStatusOptionsMap = JobStatusOptions.reduce((map, option) => Object.assign(map, { [option.value]: option }), {});
