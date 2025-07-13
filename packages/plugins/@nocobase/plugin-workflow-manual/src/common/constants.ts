/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const NAMESPACE = 'workflow-manual';

export const TASK_TYPE_MANUAL = 'manual';

export const TASK_STATUS = {
  PENDING: 0,
  RESOLVED: 1,
  REJECTED: -5,
};

export const TaskStatusOptions = [
  {
    value: TASK_STATUS.PENDING,
    label: `{{t("Pending", { ns: "workflow" })}}`,
    color: 'gold',
  },
  {
    value: TASK_STATUS.RESOLVED,
    label: `{{t("Resolved", { ns: "workflow" })}}`,
    color: 'green',
  },
  {
    value: TASK_STATUS.REJECTED,
    label: `{{t("Rejected", { ns: "workflow" })}}`,
    color: 'red',
  },
];

export const TaskStatusOptionsMap = TaskStatusOptions.reduce(
  (map, item) => Object.assign(map, { [item.value]: item }),
  {},
);
