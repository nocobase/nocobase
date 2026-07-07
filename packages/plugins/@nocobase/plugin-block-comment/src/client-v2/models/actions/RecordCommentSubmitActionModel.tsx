/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionModel,
  createAssignFieldValuesStep,
  createAssignFormSubModelOptions,
  getAssignFieldValuesDefaultParams,
  resolveAssignFieldValues,
  type AssignFormModel,
} from '@nocobase/client-v2';
import { useFlowContext, type FlowRuntimeContext } from '@nocobase/flow-engine';
import { Alert, Select, Space } from 'antd';
import type { SelectProps } from 'antd';
import type { AxiosRequestConfig } from 'axios';
import type { ButtonProps } from 'antd/es/button';
import React, { useEffect, useMemo, useState } from 'react';

import { tExpr, useT } from '../../locale';

const SETTINGS_FLOW_KEY = 'submitSettings';

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
  actionTriggerableScope?: boolean | ((config: Record<string, unknown>, scope: string) => boolean);
};

type WorkflowPlugin = {
  getTriggerOptions?: (type?: string) => ActionTriggerableTrigger | undefined;
  triggers?: {
    get(type: string): ActionTriggerableTrigger | undefined;
  };
};

type PluginManagerLike = {
  get(name: string): unknown;
};

type RecordCommentSubmitContext = {
  commentCanSubmit?: boolean;
  commentSubmitting?: boolean;
  submitComment?: (params?: RecordCommentSubmitParams) => Promise<unknown>;
  exit?: () => void;
  message?: { error?: (message: string) => void };
  model: RecordCommentSubmitActionModel;
  t: (message: string) => string;
};

type RecordCommentSubmitParams = {
  assignedValues?: Record<string, unknown>;
  requestConfig?: AxiosRequestConfig;
};

function isWorkflowPlugin(plugin: unknown): plugin is WorkflowPlugin {
  if (typeof plugin !== 'object' || plugin === null) {
    return false;
  }
  const workflowPlugin = plugin as WorkflowPlugin;
  return typeof workflowPlugin.getTriggerOptions === 'function' || typeof workflowPlugin.triggers?.get === 'function';
}

function getWorkflowPlugin(pm: PluginManagerLike): WorkflowPlugin | undefined {
  const plugins = [pm.get('workflow'), pm.get('@nocobase/plugin-workflow')];
  return plugins.find(isWorkflowPlugin);
}

function getTriggerOptions(plugin: WorkflowPlugin | undefined, type?: string) {
  if (!type) {
    return undefined;
  }
  return plugin?.getTriggerOptions?.(type) ?? plugin?.triggers?.get(type);
}

function joinWorkflowCollectionName(dataSourceKey: string | undefined, collectionName: string | undefined) {
  if (!collectionName) {
    return undefined;
  }
  if (!dataSourceKey || dataSourceKey === 'main') {
    return collectionName;
  }
  return `${dataSourceKey}:${collectionName}`;
}

function getWorkflowCollectionName(collection?: WorkflowCollection | null) {
  return joinWorkflowCollectionName(collection?.dataSourceKey || collection?.dataSource?.key, collection?.name);
}

function buildTriggerWorkflows(group?: TriggerWorkflowBinding[]) {
  const workflowKeys = group?.map((row) => row.workflowKey).filter((key): key is string => Boolean(key));
  return workflowKeys?.length ? workflowKeys.join(',') : undefined;
}

function shouldBlockEmptyCommentSubmit(ctx: Pick<RecordCommentSubmitContext, 'commentCanSubmit'>) {
  return ctx.commentCanSubmit === false;
}

function getWorkflowOptionFilter(plugin: unknown, currentValue?: string) {
  const workflowPlugin = isWorkflowPlugin(plugin) ? plugin : undefined;

  return (option: WorkflowOption) => {
    if (option.key && option.key === currentValue) {
      return true;
    }
    const trigger = getTriggerOptions(workflowPlugin, option.type);
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
        if (mounted) {
          setOptions(response?.data?.data || []);
        }
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
  const plugin = getWorkflowPlugin(ctx.app.pm);
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
              'x-component': Space,
              'x-component-props': {
                align: 'center',
                style: {
                  display: 'flex',
                  width: '100%',
                  gap: 8,
                },
              },
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
                      width: 320,
                      maxWidth: '100%',
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

export class RecordCommentSubmitActionModel extends ActionModel<{
  subModels: {
    assignForm: AssignFormModel;
  };
}> {
  assignFormUid?: string;

  defaultProps: ButtonProps = {
    title: tExpr('Comment'),
    type: 'primary',
  };

  getAclActionName() {
    return 'create';
  }

  setSaveRequestConfig(requestConfig?: AxiosRequestConfig) {
    this.setStepParams('submitSettings', 'saveResource', {
      requestConfig,
    });
  }

  renderButton() {
    const disabledByContent = !this.context.commentCanSubmit;
    const submitting = Boolean(this.context.commentSubmitting);
    const previousDisabled = this.props.disabled;
    const previousLoading = this.props.loading;

    this.props.disabled = previousDisabled || disabledByContent;
    this.props.loading = previousLoading || submitting;

    const button = super.renderButton();

    this.props.disabled = previousDisabled;
    this.props.loading = previousLoading;
    return button;
  }
}

RecordCommentSubmitActionModel.define({
  label: tExpr('Comment'),
  sort: 10,
  createModelOptions: (ctx) => ({
    subModels: {
      assignForm: createAssignFormSubModelOptions(ctx),
    },
  }),
});

RecordCommentSubmitActionModel.registerFlow({
  key: SETTINGS_FLOW_KEY,
  on: 'click',
  title: tExpr('Submit action settings'),
  steps: {
    validateCommentContent: {
      hideInSettings: true,
      handler(ctx: RecordCommentSubmitContext) {
        if (shouldBlockEmptyCommentSubmit(ctx)) {
          ctx.exit?.();
        }
      },
    },
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Submit comment'),
        content: tExpr('Are you sure you want to submit this comment?'),
      },
    },
    assignFieldValues: createAssignFieldValuesStep({
      settingsFlowKey: SETTINGS_FLOW_KEY,
      title: tExpr('Assign field values'),
    }),
    saveResource: {
      async defaultParams(ctx) {
        return getAssignFieldValuesDefaultParams(ctx, SETTINGS_FLOW_KEY);
      },
      async handler(ctx: RecordCommentSubmitContext, params?: RecordCommentSubmitParams) {
        if (shouldBlockEmptyCommentSubmit(ctx)) {
          ctx.exit?.();
          return;
        }

        const assignedValues = await resolveAssignFieldValues(ctx, params?.assignedValues, 'RecordCommentSubmitAction');
        if (!assignedValues) {
          ctx.exit?.();
          return;
        }
        if (!ctx.submitComment) {
          ctx.message?.error?.(ctx.t('Failed to create comment'));
          return;
        }

        try {
          ctx.model.setProps('loading', true);
          return await ctx.submitComment({
            ...params,
            assignedValues,
          });
        } catch {
          ctx.exit?.();
          return;
        } finally {
          ctx.model.setProps('loading', false);
        }
      },
    },
    afterSuccess: {
      use: 'afterSuccess',
      defaultParams: {
        successMessage: '',
        actionAfterSuccess: 'stay',
      },
    },
  },
});

RecordCommentSubmitActionModel.registerFlow({
  key: 'recordCommentTriggerWorkflowsActionSettings',
  title: tExpr('Workflow'),
  steps: {
    setTriggerWorkflows: {
      title: tExpr('Bind workflows'),
      uiSchema: createTriggerWorkflowsSchema(
        tExpr('Support pre-action event (local mode), post-action event (local mode), and approval event here.'),
      ),
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
