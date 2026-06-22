/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FormSubmitActionModel, UpdateRecordActionModel } from '@nocobase/client-v2';
import { useFlowContext } from '@nocobase/flow-engine';
import type { FlowRuntimeContext } from '@nocobase/flow-engine';
import { css } from '@emotion/css';
import { Alert, Select, Space } from 'antd';
import type { SelectProps } from 'antd';
import { tExpr, useT } from '../locale';

type WorkflowCollection = {
  name?: string;
  dataSourceKey?: string;
  dataSource?: {
    key?: string;
    name?: string;
  };
};

type WorkflowOption = {
  title?: string;
  key?: string;
  type?: string;
  config?: Record<string, unknown> | null;
};

type TriggerWorkflowBinding = {
  workflowKey?: string;
};

type ActionTriggerableTrigger = {
  title?: string;
  actionTriggerableScope?: boolean | ((config: Record<string, unknown>, scope: string) => boolean);
};

type WorkflowPlugin = {
  getTriggerOptions(type?: string): ActionTriggerableTrigger | undefined;
};

function joinWorkflowCollectionName(dataSourceKey: string | undefined, collectionName: string | undefined) {
  if (!collectionName) {
    return undefined;
  }
  if (!dataSourceKey || dataSourceKey === 'main') {
    return collectionName;
  }
  return `${dataSourceKey}:${collectionName}`;
}

export function getWorkflowCollectionName(collection?: WorkflowCollection | null) {
  return joinWorkflowCollectionName(collection?.dataSourceKey || collection?.dataSource?.key, collection?.name);
}

export function buildTriggerWorkflows(group?: TriggerWorkflowBinding[]) {
  const workflowKeys = group?.map((row) => row.workflowKey).filter((key): key is string => Boolean(key));
  return workflowKeys?.length ? workflowKeys.join(',') : undefined;
}

function useWorkflowOptions(filter?: Record<string, unknown>) {
  const ctx = useFlowContext();
  const [options, setOptions] = useState<WorkflowOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadWorkflows() {
      setLoading(true);
      try {
        const response = await ctx.api.request({
          url: 'workflows:list',
          method: 'get',
          params: {
            paginate: false,
            filter: {
              enabled: true,
              ...filter,
            },
          },
        });
        if (!mounted) {
          return;
        }
        setOptions(response?.data?.data || []);
      } catch (error) {
        console.error('Error loading workflows:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadWorkflows();

    return () => {
      mounted = false;
    };
  }, [ctx.api, filter]);

  return { options, loading };
}

export function getWorkflowOptionFilter(plugin: WorkflowPlugin | undefined, currentValue?: string) {
  return (option: WorkflowOption) => {
    if (option.key && option.key === currentValue) {
      return true;
    }
    const trigger = option.type ? plugin?.getTriggerOptions(option.type) : undefined;
    if (!trigger) {
      return false;
    }
    if (trigger.actionTriggerableScope === true) {
      return true;
    }
    if (typeof trigger.actionTriggerableScope === 'function') {
      return trigger.actionTriggerableScope(option.config || {}, 'form');
    }
    return false;
  };
}

function WorkflowSelect({
  value,
  onChange,
  filter,
  ...props
}: Omit<SelectProps<string>, 'options'> & {
  value?: string;
  onChange?: (value?: string) => void;
  filter?: Record<string, unknown>;
}) {
  const ctx = useFlowContext();
  const t = useT();
  const plugin = ctx.app.pm.get<WorkflowPlugin>('workflow');
  const { options, loading } = useWorkflowOptions(filter);
  const optionFilter = useMemo(() => getWorkflowOptionFilter(plugin, value), [plugin, value]);
  const selectOptions = useMemo<SelectProps['options']>(
    () =>
      options
        .filter((option): option is WorkflowOption & { key: string } => Boolean(option.key) && optionFilter(option))
        .map((option) => {
          const title = option.title ? t(option.title) : option.key;
          return {
            label: title,
            value: option.key,
            searchText: title,
          };
        }),
    [optionFilter, options, t],
  );

  return (
    <Select
      allowClear
      showSearch
      loading={loading}
      placeholder={t('Select workflow')}
      {...props}
      filterOption={(input, option) =>
        String((option as { searchText?: string })?.searchText || '')
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      value={value}
      options={selectOptions}
      onChange={onChange}
    />
  );
}

function getWorkflowCollectionFilter(ctx: FlowRuntimeContext) {
  const collection = ctx.blockModel?.collection || ctx.model?.context?.blockModel?.collection;
  const workflowCollection = getWorkflowCollectionName(collection);
  return workflowCollection ? { 'config.collection': workflowCollection } : undefined;
}

function createTriggerWorkflowsSchema(description: string) {
  return (ctx: FlowRuntimeContext) => {
    const filter = getWorkflowCollectionFilter(ctx);

    return {
      description: {
        type: 'void',
        'x-component': Alert,
        'x-component-props': {
          type: 'info',
          showIcon: true,
          message: description,
          style: {
            marginBottom: '1em',
          },
        },
      },
      group: {
        type: 'array',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            space: {
              type: 'void',
              'x-component-props': {
                align: 'center',
                style: {
                  display: 'flex',
                  width: '100%',
                },
                className: css`
                  & > .ant-space-item:first-child,
                  & > .ant-space-item:last-child {
                    flex: 0 0 auto;
                  }
                  & > .ant-space-item:nth-child(2) {
                    flex: 1;
                    min-width: 0;
                  }
                  & > .ant-space-item:nth-child(2) .ant-select {
                    width: 100%;
                  }
                `,
              },
              'x-component': Space,
              properties: {
                sort: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.SortHandle',
                },
                workflowKey: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': WorkflowSelect,
                  'x-component-props': {
                    filter,
                    placeholder: tExpr('Select workflow'),
                    style: {
                      width: '100%',
                    },
                  },
                  required: true,
                },
                remove: {
                  type: 'void',
                  'x-decorator': 'FormItem',
                  'x-component': 'ArrayItems.Remove',
                },
              },
            },
          },
        },
        properties: {
          add: {
            type: 'void',
            title: tExpr('Add workflow'),
            'x-component': 'ArrayItems.Addition',
          },
        },
      },
    };
  };
}

const operationEventDescription = tExpr(
  'Support pre-action event (local mode), post-action event (local mode), and approval event here.',
);

FormSubmitActionModel.registerFlow({
  key: 'formTriggerWorkflowsActionSettings',
  title: tExpr('Workflow'),
  steps: {
    setTriggerWorkflows: {
      title: tExpr('Bind workflows'),
      uiSchema: createTriggerWorkflowsSchema(operationEventDescription),
      handler(ctx, params: { group?: TriggerWorkflowBinding[] }) {
        ctx.model.setSaveRequestConfig({
          params: {
            triggerWorkflows: buildTriggerWorkflows(params.group),
          },
        });
      },
    },
  },
});

UpdateRecordActionModel.registerFlow({
  key: 'recordTriggerWorkflowsActionSettings',
  title: tExpr('Workflow'),
  steps: {
    setTriggerWorkflows: {
      title: tExpr('Bind workflows'),
      uiSchema: createTriggerWorkflowsSchema(operationEventDescription),
      handler(ctx, params: { group?: TriggerWorkflowBinding[] }) {
        ctx.model.setSaveRequestConfig({
          params: {
            triggerWorkflows: buildTriggerWorkflows(params.group),
          },
        });
      },
    },
  },
});
