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
  ActionModel,
  ActionSceneEnum,
  CollectionActionModel,
  FormActionModel,
  TextAreaWithContextSelector,
} from '@nocobase/client-v2';
import { MultiRecordResource, resolveExpressions, useFlowContext } from '@nocobase/flow-engine';
import { Alert, Select } from 'antd';
import type { ButtonProps } from 'antd/es/button';
import { CONTEXT_TYPE, EVENT_TYPE } from '../../../common/constants';
import { NAMESPACE, tExpr } from '../../locale';

const buildTriggerWorkflows = (group?: any[]) => {
  return group?.length
    ? group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
    : undefined;
};

function getRecordKey(record, collection) {
  if (!record || !collection) {
    return null;
  }
  const filterByTk = collection.filterTargetKey;
  if (Array.isArray(filterByTk)) {
    return filterByTk.reduce((acc, key) => {
      acc[key] = record[key];
      return acc;
    }, {});
  }
  return record[filterByTk];
}

function WorkflowSelect(props) {
  const ctx = useFlowContext();
  const [options, setOptions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const loadWorkflows = async () => {
      setLoading(true);
      try {
        const res = await ctx.api.request({
          url: 'workflows:list',
          method: 'get',
          params: {
            paginate: false,
            filter: {
              type: EVENT_TYPE,
              enabled: true,
              ...props.filter,
            },
          },
        });
        if (!mounted) {
          return;
        }
        const rows = res?.data?.data || [];
        const filtered = typeof props.optionFilter === 'function' ? rows.filter(props.optionFilter) : rows;
        setOptions(
          filtered.map((item) => ({
            label: item.title,
            value: item.key,
          })),
        );
      } catch (error) {
        console.error('Error loading workflows:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadWorkflows();
    return () => {
      mounted = false;
    };
  }, [ctx.api, props.filter, props.optionFilter]);

  return <Select {...props} loading={loading} options={options} />;
}

function createTriggerWorkflowsSchema({
  description,
  optionFilter,
  withContextData = false,
}: {
  description?: string;
  optionFilter?: (item: any) => boolean;
  withContextData?: boolean;
}) {
  return {
    description: {
      type: 'void',
      'x-component': Alert,
      'x-component-props': {
        type: 'info',
        showIcon: true,
        message: description,
      },
    },
    group: {
      type: 'array',
      'x-component': 'ArrayItems',
      'x-decorator': 'FormItem',
      items: {
        type: 'object',
        properties: {
          sort: {
            type: 'void',
            'x-decorator': 'FormItem',
            'x-component': 'ArrayItems.SortHandle',
          },
          workflowKey: {
            type: 'string',
            title: `{{t('Workflow', { ns: 'workflow' })}}`,
            'x-decorator': 'FormItem',
            'x-component': WorkflowSelect,
            'x-component-props': {
              optionFilter,
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
      properties: {
        add: {
          type: 'void',
          title: `{{t('Add workflow', { ns: 'workflow' })}}`,
          'x-component': 'ArrayItems.Addition',
        },
      },
    },
    ...(withContextData
      ? {
          contextData: {
            type: 'string',
            title: tExpr('Context data'),
            description: tExpr(
              'Input JSON as context data passed into the workflow. Frontend variables are supported.',
            ),
            'x-decorator': 'FormItem',
            'x-component': TextAreaWithContextSelector,
            'x-component-props': {
              rows: 5,
            },
          },
        }
      : {}),
  };
}

const customActionDescription = tExpr(
  'Workflow will be triggered directly once the button clicked, without data saving. Only supports to be bound with "Custom action event".',
);

function matchWorkflowContextType(config?: { type?: number | null } | null, contextType?: number | null) {
  const configType = config?.type;
  if (contextType === CONTEXT_TYPE.GLOBAL || contextType == null) {
    return configType === CONTEXT_TYPE.GLOBAL || configType == null;
  }
  return configType === contextType;
}

export class FormTriggerWorkflowActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Trigger workflow'),
  };
}

FormTriggerWorkflowActionModel.define({
  label: tExpr('Trigger workflow'),
});

FormTriggerWorkflowActionModel.registerFlow({
  key: 'customFormTriggerWorkflowsActionSettings',
  on: 'click',
  title: `{{t('Workflow', { ns: 'workflow' })}}`,
  steps: {
    confirm: {
      use: 'confirm',
    },
    triggerWorkflows: {
      title: `{{t('Bind workflows', { ns: 'workflow' })}}`,
      uiSchema: createTriggerWorkflowsSchema({
        description: customActionDescription,
        optionFilter(item) {
          return item.config?.type === CONTEXT_TYPE.SINGLE_RECORD;
        },
      }),
      async handler(ctx, params) {
        if (!params.group?.length) {
          ctx.message.error(
            ctx.t('Button is not configured properly, please contact the administrator.', { ns: NAMESPACE }),
          );
          ctx.exit();
          return;
        }

        if (!ctx.blockModel) {
          ctx.exit();
          return;
        }

        try {
          ctx.model.setProps('loading', true);
          await ctx.blockModel.submitHandler(ctx, {}, async (values, filterByTk) => {
            return await ctx.blockModel.resource.runAction('trigger', {
              params: {
                ...(filterByTk != null ? { filterByTk } : {}),
                triggerWorkflows: buildTriggerWorkflows(params.group),
              },
              data: values,
            });
          });
        } catch (error) {
          console.error('Error triggering workflows:', error);
          ctx.exit();
        } finally {
          ctx.model.setProps('loading', false);
        }
      },
    },
    afterSuccess: {
      use: 'afterSuccess',
      defaultParams: {
        successMessage: tExpr('Operation succeeded'),
      },
    },
  },
});

export class RecordTriggerWorkflowActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;
  defaultProps: ButtonProps = {
    title: tExpr('Trigger workflow'),
  };
}

RecordTriggerWorkflowActionModel.define({
  label: tExpr('Trigger workflow'),
});

RecordTriggerWorkflowActionModel.registerFlow({
  key: 'customRecordTriggerWorkflowsActionSettings',
  on: 'click',
  title: `{{t('Workflow', { ns: 'workflow' })}}`,
  steps: {
    confirm: {
      use: 'confirm',
    },
    triggerWorkflows: {
      title: `{{t('Bind workflows', { ns: 'workflow' })}}`,
      uiSchema: createTriggerWorkflowsSchema({
        description: customActionDescription,
        optionFilter(item) {
          return item.config?.type === CONTEXT_TYPE.SINGLE_RECORD;
        },
      }),
      async handler(ctx, params) {
        const { resource, collection } = ctx.blockModel;
        if (!resource || !collection) {
          ctx.exit();
          return;
        }
        if (!params.group?.length) {
          ctx.message.error(
            ctx.t('Button is not configured properly, please contact the administrator.', { ns: NAMESPACE }),
          );
          ctx.exit();
          return;
        }
        try {
          await resource.runAction('trigger', {
            params: {
              triggerWorkflows: buildTriggerWorkflows(params.group),
              filterByTk: getRecordKey(ctx.record, collection),
            },
          });
        } catch (error) {
          console.error('Error triggering workflows:', error);
          ctx.exit();
        }
      },
    },
    afterSuccess: {
      use: 'afterSuccess',
      defaultParams: {
        successMessage: tExpr('Operation succeeded'),
        actionAfterSuccess: 'previous',
      },
    },
  },
});

export class CollectionTriggerWorkflowActionModel extends CollectionActionModel {
  static scene = ActionSceneEnum.collection;
  defaultProps: ButtonProps = {
    title: null,
  };
}

CollectionTriggerWorkflowActionModel.define({
  label: tExpr('Trigger workflow'),
});

CollectionTriggerWorkflowActionModel.registerFlow({
  key: 'customCollectionTriggerWorkflowsActionSettings',
  title: `{{t('Workflow', { ns: 'workflow' })}}`,
  steps: {
    setContextType: {
      hideInSettings: true,
      preset: true,
      title: tExpr('Context type'),
      uiSchema: {
        type: {
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: tExpr('Custom context'), value: CONTEXT_TYPE.GLOBAL },
            { label: tExpr('Multiple collection records'), value: CONTEXT_TYPE.MULTIPLE_RECORDS },
          ],
          required: true,
        },
      },
      handler(ctx, params) {
        if (!ctx.model.props.title) {
          ctx.model.setProps(
            'title',
            params.type
              ? ctx.t('Trigger workflow', { ns: NAMESPACE })
              : ctx.t('Trigger global workflow', { ns: NAMESPACE }),
          );
        }
      },
    },
    triggerWorkflows: {
      title: `{{t('Bind workflows', { ns: 'workflow' })}}`,
      uiSchema: (ctx) => {
        const { type } = ctx.model.stepParams.customCollectionTriggerWorkflowsActionSettings?.setContextType ?? {};
        return createTriggerWorkflowsSchema({
          withContextData: !type,
          description: type
            ? tExpr('Only support custom action workflow with context type set to "Multiple records".')
            : tExpr('Only support custom action workflow with context type set to "Custom context".'),
          optionFilter(item) {
            return matchWorkflowContextType(item.config, type);
          },
        });
      },
    },
  },
});

CollectionTriggerWorkflowActionModel.registerFlow({
  key: 'customCollectionTriggerWorkflowsActionEventSettings',
  on: 'click',
  steps: {
    confirm: {
      use: 'confirm',
    },
    trigger: {
      async handler(ctx) {
        const step = ctx.model.stepParams.customCollectionTriggerWorkflowsActionSettings;
        const { type } = step.setContextType;
        const { group, contextData } = step.triggerWorkflows ?? {};
        if (!group?.length) {
          ctx.message.error(
            ctx.t('Button is not configured properly, please contact the administrator.', { ns: NAMESPACE }),
          );
          ctx.exit();
          return;
        }
        if (type === CONTEXT_TYPE.MULTIPLE_RECORDS) {
          if (!ctx.blockModel?.resource) {
            ctx.message.error(ctx.t('No resource selected for deletion'));
            ctx.exit();
            return;
          }
          const resource = ctx.blockModel.resource as MultiRecordResource;
          if (resource.getSelectedRows().length === 0) {
            ctx.message.warning(ctx.t('Please select at least one record.', { ns: NAMESPACE }));
            ctx.exit();
            return;
          }
          try {
            await resource.runAction('trigger', {
              params: {
                triggerWorkflows: buildTriggerWorkflows(group),
                filterByTk: ctx.blockModel.collection.getFilterByTK(resource.getSelectedRows()),
              },
            });
            resource.setSelectedRows([]);
          } catch (error) {
            console.error('Error triggering workflows:', error);
            ctx.exit();
          }
        } else if (!type) {
          let values;
          if (contextData) {
            try {
              values = await resolveExpressions(contextData, ctx);
            } catch (e) {
              // resolution error, ignore
            }
          }
          try {
            await ctx.api.request({
              url: 'workflows:trigger',
              method: 'post',
              params: {
                triggerWorkflows: buildTriggerWorkflows(group),
              },
              data: { values },
            });
          } catch (error) {
            console.error('Error triggering workflows:', error);
            ctx.exit();
          }
        } else {
          throw new Error('Invalid context type');
        }
      },
    },
    afterSuccess: {
      use: 'afterSuccess',
      defaultParams: {
        successMessage: tExpr('Operation succeeded'),
        actionAfterSuccess: 'previous',
      },
    },
  },
});

export class WorkbenchTriggerWorkflowActionModel extends ActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Trigger global workflow'),
    icon: 'ThunderboltOutlined',
  };
}

WorkbenchTriggerWorkflowActionModel.define({
  label: tExpr('Trigger global workflow'),
});

function globalTriggerWorkflowUiSchema() {
  return createTriggerWorkflowsSchema({
    withContextData: true,
    description: tExpr('Only support custom action workflow with context type set to "Custom context".'),
    optionFilter(item) {
      return matchWorkflowContextType(item.config, CONTEXT_TYPE.GLOBAL);
    },
  });
}

async function globalTriggerWorkflowHandler(ctx, params) {
  let values;
  if (params.contextData) {
    try {
      values = await resolveExpressions(params.contextData, ctx);
    } catch (e) {
      // resolution error, ignore
    }
  }
  try {
    await ctx.api.request({
      url: 'workflows:trigger',
      method: 'post',
      params: {
        triggerWorkflows: buildTriggerWorkflows(params.group),
      },
      data: { values },
    });
    ctx.message.success(ctx.t('Operation succeeded'));
  } catch (error) {
    console.error('Error triggering workflows:', error);
  }
}

WorkbenchTriggerWorkflowActionModel.registerFlow({
  key: 'workbenchTriggerWorkflowsActionSettings',
  on: 'click',
  title: `{{t('Workflow', { ns: 'workflow' })}}`,
  steps: {
    confirm: {
      use: 'confirm',
    },
    triggerWorkflows: {
      title: `{{t('Bind workflows', { ns: 'workflow' })}}`,
      uiSchema: globalTriggerWorkflowUiSchema,
      handler: globalTriggerWorkflowHandler,
    },
    afterSuccess: {
      use: 'afterSuccess',
      defaultParams: {
        successMessage: tExpr('Operation succeeded'),
        actionAfterSuccess: 'previous',
      },
    },
  },
});

export function registerTriggerWorkflowActionGroups(flowEngine: any) {
  [
    'CollectionActionGroupModel',
    'RecordActionGroupModel',
    'FormActionGroupModel',
    'ActionPanelGroupActionModel',
  ].forEach((modelName) => {
    flowEngine.getModelClass(modelName)?.registerActionModels?.({
      FormTriggerWorkflowActionModel,
      RecordTriggerWorkflowActionModel,
      CollectionTriggerWorkflowActionModel,
      WorkbenchTriggerWorkflowActionModel,
    });
  });
}
