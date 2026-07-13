/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionOptions } from '@nocobase/flow-engine';
import { Collapse, Empty } from 'antd';
import { TableProps } from 'antd';
import { CSSMotionProps } from 'rc-motion';
import React from 'react';
import {
  ACTIVE_RUN_STATUSES as ACTIVE_RUN_STATUS_VALUES,
  CLAIMABLE_RUN_STATUS,
  HEARTBEAT_RUN_STATUSES,
  IMPORTING_RUN_STATUS,
  LEASE_OWNING_RUN_STATUSES,
  STALLED_RUN_STATUS,
  TERMINAL_CONTROL_RUN_STATUSES as TERMINAL_CONTROL_RUN_STATUS_VALUES,
} from '../../../shared/runState';
import { BuildRunOptions, parseBuildRunnerValue } from '../../pages/AgentGatewayTaskParameterFormItems';
import { getObjectRecord } from '../../pages/AgentGatewayPageUtils';
import {
  RunActionPermissionKey,
  RunListData,
  RunListMeta,
  RunRecord,
  RunTaskTemplateFilterOption,
  RunTaskTemplateSummary,
} from '../../pages/runs/types';

export function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export const RUN_STATUS_OPTIONS = [
  'queued',
  'claimed',
  'syncing_skills',
  'running',
  IMPORTING_RUN_STATUS,
  'finalizing',
  'canceling',
  'stalled',
  'succeeded',
  'failed',
  'canceled',
  'timeout',
  'abandoned',
];

export const CANCELABLE_STATUSES = new Set<string>([
  CLAIMABLE_RUN_STATUS,
  IMPORTING_RUN_STATUS,
  ...HEARTBEAT_RUN_STATUSES,
  STALLED_RUN_STATUS,
]);

export const TERMINAL_CONTROL_RUN_STATUSES = new Set<string>(TERMINAL_CONTROL_RUN_STATUS_VALUES);

export const LIVE_RUN_STATUSES = new Set<string>([
  CLAIMABLE_RUN_STATUS,
  IMPORTING_RUN_STATUS,
  ...LEASE_OWNING_RUN_STATUSES,
]);

export const DANGLING_TOOL_LIVE_RUN_STATUSES = new Set<string>([
  CLAIMABLE_RUN_STATUS,
  IMPORTING_RUN_STATUS,
  ...ACTIVE_RUN_STATUS_VALUES,
]);

export const DEFAULT_RUNS_PAGE_SIZE = 20;

export const DETAIL_PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];

export const TASK_RUN_DRAWER_WIDTH = 1040;

export const SKILL_DETAIL_DRAWER_WIDTH = 720;

export const RUNS_FILTER_FIELD_NAMES = ['taskTemplateId', 'status', 'nodeId', 'agentProfileId', 'createdAt'];

export const RUN_SORT_FALLBACK = '-createdAt';

export function getRunsFilterCollectionOptions(
  taskTemplateOptions: Array<{ label: string; value: string }>,
): CollectionOptions {
  return {
    name: 'agentGatewayRunsFilter',
    title: '{{t("Runs")}}',
    filterTargetKey: 'id',
    fields: [
      {
        type: 'string',
        name: 'taskTemplateId',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Task template")}}',
          'x-component': 'Select',
          enum: taskTemplateOptions,
        },
      },
      {
        type: 'string',
        name: 'status',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Status")}}',
          'x-component': 'Select',
          enum: RUN_STATUS_OPTIONS.map((status) => ({
            label: status,
            value: status,
          })),
        },
      },
      {
        type: 'string',
        name: 'nodeId',
        interface: 'input',
        uiSchema: {
          type: 'string',
          title: '{{t("Node ID")}}',
          'x-component': 'Input',
        },
      },
      {
        type: 'string',
        name: 'agentProfileId',
        interface: 'input',
        uiSchema: {
          type: 'string',
          title: '{{t("Profile ID")}}',
          'x-component': 'Input',
        },
      },
      {
        type: 'date',
        name: 'createdAt',
        interface: 'createdAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Created at")}}',
          'x-component': 'DatePicker',
        },
      },
    ],
  };
}

export function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

export function getSkillVersionIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];
}

export const NO_COLLAPSE_MOTION: CSSMotionProps = {
  motionName: '',
  motionAppear: false,
  motionEnter: false,
  motionLeave: false,
};

export const FastCollapse = Collapse as React.ComponentType<
  React.ComponentProps<typeof Collapse> & { openMotion?: CSSMotionProps }
>;

export function isCancelableRun(run: RunRecord) {
  return CANCELABLE_STATUSES.has(run.status);
}

export function getNumberMetaValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function getRunTaskTemplateMetaOptions(value: unknown): RunTaskTemplateFilterOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const record = getObjectRecord(item);
      return {
        id: getStringValue(record.id),
        templateKey: getStringValue(record.templateKey),
        displayName: getStringValue(record.displayName),
      };
    })
    .filter((template) => Boolean(template.id));
}

export function getRunListMeta(value: unknown): RunListMeta {
  const record = getObjectRecord(value);
  return {
    count: getNumberMetaValue(record.count),
    page: getNumberMetaValue(record.page),
    pageSize: getNumberMetaValue(record.pageSize),
    totalPage: getNumberMetaValue(record.totalPage),
    taskTemplates: getRunTaskTemplateMetaOptions(record.taskTemplates),
  };
}

export function getRunTaskTemplateFilterOptions(runListData: RunListData) {
  const optionsById = new Map<string, { label: string; value: string }>();
  const addTemplate = (template: RunTaskTemplateFilterOption | RunTaskTemplateSummary | null | undefined) => {
    if (!template?.id) {
      return;
    }
    optionsById.set(template.id, {
      value: template.id,
      label: template.displayName || template.templateKey || template.id,
    });
  };

  for (const template of runListData.meta.taskTemplates || []) {
    addTemplate(template);
  }
  for (const run of runListData.runs) {
    addTemplate(run.taskTemplateJson);
  }

  return [...optionsById.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export function getRunSortParam(sorter: Parameters<NonNullable<TableProps<RunRecord>['onChange']>>[2]) {
  const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
  if (!activeSorter?.order) {
    return undefined;
  }
  const columnKey = typeof activeSorter.columnKey === 'string' ? activeSorter.columnKey : '';
  const field = typeof activeSorter.field === 'string' ? activeSorter.field : '';
  const sortField = columnKey || field;
  if (!sortField) {
    return undefined;
  }
  return activeSorter.order === 'descend' ? `-${sortField}` : sortField;
}

export function getRunColumnSortOrder(runSort: string | undefined, columnKey: string) {
  if (runSort === columnKey) {
    return 'ascend' as const;
  }
  if (runSort === `-${columnKey}`) {
    return 'descend' as const;
  }
  return null;
}

export function EmptyInline({ description }: { description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
}

export function getBuildTaskTemplateSelectOptions(options: BuildRunOptions | undefined) {
  return (options?.taskTemplates || []).map((template) => ({
    value: template.id,
    label: template.displayName || template.templateKey,
  }));
}

export function findBuildTaskTemplate(options: BuildRunOptions | undefined, templateId?: string) {
  if (!templateId) {
    return null;
  }
  return (
    (options?.taskTemplates || []).find(
      (template) => template.id === templateId || template.templateKey === templateId,
    ) || null
  );
}

export function findBuildRunnerNodeByValue(options: BuildRunOptions | undefined, value?: string) {
  const { nodeId, agentProfileId } = parseBuildRunnerValue(value);
  if (!nodeId || !agentProfileId) {
    return null;
  }
  for (const node of options?.nodes || []) {
    if (node.id !== nodeId) {
      continue;
    }
    const profile = (node.profiles || []).find((item) => item.id === agentProfileId);
    if (profile) {
      return {
        node,
        profile,
      };
    }
  }
  return null;
}

export function shouldUseDefaultBuildRunner(
  options: BuildRunOptions | undefined,
  currentValue: string | undefined,
  defaultValue: string | undefined,
) {
  if (!defaultValue || currentValue === defaultValue) {
    return false;
  }
  if (!currentValue) {
    return true;
  }
  const currentRunner = findBuildRunnerNodeByValue(options, currentValue);
  const defaultRunner = findBuildRunnerNodeByValue(options, defaultValue);
  if (!currentRunner) {
    return true;
  }
  return currentRunner.node.online === false && defaultRunner?.node.online === true;
}

export function isRunActionAllowed(
  permissions: RunRecord['agentGatewayActionPermissionsJson'] | undefined,
  action: RunActionPermissionKey,
) {
  return permissions?.[action] === true;
}

export function isFormValidationError(value: unknown) {
  return Array.isArray(getObjectRecord(value).errorFields);
}
