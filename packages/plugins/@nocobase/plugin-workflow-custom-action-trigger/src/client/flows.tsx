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
  ActionSceneEnum,
  CollectionActionModel,
  FormActionModel,
} from '@nocobase/client';
import { tExpr, MultiRecordResource, useFlowContext } from '@nocobase/flow-engine';
import { createTriggerWorkflowsSchema, TriggerWorkflowSelect } from '@nocobase/plugin-workflow/client';
import { ButtonProps } from 'antd';
import React, { useCallback } from 'react';
import { CONTEXT_TYPE, EVENT_TYPE, NAMESPACE } from '../common/constants';

export class FormTriggerWorkflowActionModel extends FormActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Trigger workflow', { ns: NAMESPACE }),
  };
}

FormTriggerWorkflowActionModel.define({
  label: tExpr('Trigger workflow', { ns: NAMESPACE }),
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
        filter: {
          type: EVENT_TYPE,
        },
        optionFilter({ config }) {
          return config.type === CONTEXT_TYPE.SINGLE_RECORD;
        },
      }),
      async handler(ctx, params) {
        if (!params.group?.length) {
          ctx.message.error(
            ctx.t('Button is not configured properly, please contact the administrator.', { ns: NAMESPACE }),
          );
          return;
        }

        if (!ctx.blockModel) {
          return;
        }

        try {
          ctx.model.setProps('loading', true);
          await ctx.blockModel.submitHandler(ctx, {}, async (values, filterByTk) => {
            return await ctx.blockModel.resource.runAction('trigger', {
              params: {
                ...(filterByTk != null ? { filterByTk } : {}),
                triggerWorkflows: params.group?.length ? params.group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',') : undefined,
              },
              data: values,
            });
          });
          ctx.message.success(ctx.t('Operation succeeded'));
          ctx.model.setProps('loading', false);
        } catch (error) {
          ctx.model.setProps('loading', false);
          console.error('Error triggering workflows:', error);
          ctx.exit();
        } finally {
          ctx.model.setProps('loading', false);
        }

        if (ctx.view) {
          ctx.view.close();
        }
      },
    },
  },
});

export class RecordTriggerWorkflowActionModel extends ActionModel {
  static scene = ActionSceneEnum.record;
  defaultProps: ButtonProps = {
    title: tExpr('Trigger workflow', { ns: NAMESPACE }),
  };
}

RecordTriggerWorkflowActionModel.define({
  label: tExpr('Trigger workflow', { ns: NAMESPACE }),
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
        filter: {
          type: EVENT_TYPE,
        },
        optionFilter({ config }) {
          return config.type === CONTEXT_TYPE.SINGLE_RECORD;
        },
      }),
      async handler(ctx, params) {
        const { resource, collection } = ctx.blockModel;
        if (!resource || !collection) {
          return;
        }
        if (!params.group?.length) {
          ctx.message.error(
            ctx.t('Button is not configured properly, please contact the administrator.', { ns: NAMESPACE }),
          );
          return;
        }
        try {
          await resource.runAction('trigger', {
            params: {
              triggerWorkflows: params.group?.length
                ? params.group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
                : undefined,
              filterByTk: getRecordKey(ctx.record, collection),
            },
          });
          ctx.message.success(ctx.t('Operation succeeded'));
        } catch (error) {
          console.error('Error triggering workflows:', error);
        }
      },
    },
  },
});

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
  } else {
    return record[filterByTk];
  }
}

export class CollectionTriggerWorkflowActionModel extends CollectionActionModel {
  static scene = ActionSceneEnum.collection;
  defaultProps: ButtonProps = {
    title: null,
  };
}

CollectionTriggerWorkflowActionModel.define({
  label: `{{t('Trigger workflow', { ns: '${NAMESPACE}' })}}`,
});

function CollectionActionWorkflowSelectComponent({ ...props }) {
  const { model } = useFlowContext();
  const optionFilter = useCallback(
    ({ config }) => {
      const { type } = model.stepParams.customCollectionTriggerWorkflowsActionSettings.setContextType;
      return (type && config.type === type) || !config.type;
    },
    [model.stepParams.customCollectionTriggerWorkflowsActionSettings.setContextType],
  );
  return <TriggerWorkflowSelect {...props} optionFilter={optionFilter} />;
}

CollectionTriggerWorkflowActionModel.registerFlow({
  key: 'customCollectionTriggerWorkflowsActionSettings',
  title: `{{t('Workflow', { ns: 'workflow' })}}`,
  steps: {
    setContextType: {
      hideInSettings: true,
      preset: true,
      title: `{{t('Context type', { ns: '${NAMESPACE}' })}}`,
      uiSchema: {
        type: {
          type: 'number',
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          enum: [
            { label: `{{t('None', { ns: '${NAMESPACE}' })}}`, value: CONTEXT_TYPE.GLOBAL },
            {
              label: `{{t('Multiple collection records', { ns: '${NAMESPACE}' })}}`,
              value: CONTEXT_TYPE.MULTIPLE_RECORDS,
            },
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
      uiSchema: createTriggerWorkflowsSchema({
        WorkflowSelectComponent: CollectionActionWorkflowSelectComponent,
        filter: {
          type: EVENT_TYPE,
        },
        usingContext: false,
      }),
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
        const { group } = step.triggerWorkflows ?? {};
        if (!group?.length) {
          ctx.message.error(
            ctx.t('Button is not configured properly, please contact the administrator.', { ns: NAMESPACE }),
          );
          return;
        }
        if (type === CONTEXT_TYPE.MULTIPLE_RECORDS) {
          if (!ctx.blockModel?.resource) {
            ctx.message.error(ctx.t('No resource selected for deletion'));
            return;
          }
          const resource = ctx.blockModel.resource as MultiRecordResource;
          if (resource.getSelectedRows().length === 0) {
            ctx.message.warning(ctx.t('Please select at least one record.', { ns: NAMESPACE }));
            return;
          }
          try {
            await resource.runAction('trigger', {
              params: {
                triggerWorkflows: group?.length
                  ? group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
                  : undefined,
                filterByTk: ctx.blockModel.collection.getFilterByTK(resource.getSelectedRows()),
              },
            });
            resource.setSelectedRows([]);
          } catch (error) {
            console.error('Error triggering workflows:', error);
            return;
          }
        } else if (type === CONTEXT_TYPE.GLOBAL) {
          try {
            await ctx.api.request({
              url: 'workflows:trigger',
              method: 'post',
              params: {
                triggerWorkflows: group?.length
                  ? group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
                  : undefined,
              },
            });
          } catch (error) {
            console.error('Error triggering workflows:', error);
            return;
          }
        } else {
          throw new Error('Invalid context type');
        }

        ctx.message.success(ctx.t('Operation succeeded'));
      },
    },
  },
});

export class CollectionGlobalTriggerWorkflowActionModel extends ActionModel {
  static scene = ActionSceneEnum.collection;
  defaultProps: ButtonProps = {
    title: tExpr('Trigger global workflow', { ns: NAMESPACE }),
  };
}

CollectionGlobalTriggerWorkflowActionModel.define({
  label: tExpr('Trigger global workflow', { ns: NAMESPACE }),
});

CollectionGlobalTriggerWorkflowActionModel.registerFlow({
  key: 'customCollectionGlobalTriggerWorkflowsActionSettings',
  on: 'click',
  title: `{{t('Workflow', { ns: 'workflow' })}}`,
  steps: {
    confirm: {
      use: 'confirm',
    },
    triggerWorkflows: {
      title: `{{t('Custom action event', { ns: '${NAMESPACE}' })}}`,
      uiSchema: createTriggerWorkflowsSchema({
        filter: {
          type: EVENT_TYPE,
        },
        optionFilter({ config }) {
          return config.type === CONTEXT_TYPE.GLOBAL;
        },
        usingContext: false,
      }),
      async handler(ctx, params) {
        try {
          await ctx.api.request({
            url: 'workflows:trigger',
            method: 'post',
            params: {
              triggerWorkflows: params.group?.length
                ? params.group.map((row) => [row.workflowKey, row.context].filter(Boolean).join('!')).join(',')
                : undefined,
            },
          });
          ctx.message.success(ctx.t('Workflow triggered on selected records successfully'));
        } catch (error) {
          console.error('Error triggering workflows:', error);
        }
      },
    },
  },
});
