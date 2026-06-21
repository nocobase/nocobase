/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SchemaInitializerItemType,
  useDataBlockProps,
  useSchemaInitializer,
  ModalActionSchemaInitializerItem,
} from '@nocobase/client';

import { RadioWithTooltip } from '@nocobase/plugin-workflow/client';
import { NAMESPACE, CONTEXT_TYPE_OPTIONS, CONTEXT_TYPE } from '../common/constants';

export const submitToWorkflowActionInitializer: SchemaInitializerItemType = {
  name: 'triggerWorkflow',
  title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
  Component: 'CustomizeActionInitializer',
  schema: {
    title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
    'x-component': 'Action',
    'x-use-component-props': 'useFormWorkflowCustomActionProps',
    'x-settings': 'actionSettings:submitToWorkflow',
    'x-decorator': 'ACLActionProvider',
    'x-action-settings': {
      // assignedValues: {},
      skipValidator: false,
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Submitted successfully")}}',
      },
      refreshDataBlockRequest: true,
      triggerWorkflows: [],
    },
    'x-toolbar-props': {
      initializer: false,
      showBorder: false,
    },
    'x-action': 'customize:triggerWorkflows',
  },
  useVisible() {
    const { type } = useDataBlockProps() || ({} as any);
    return type !== 'publicForm';
  },
};

export const recordTriggerWorkflowActionInitializer: SchemaInitializerItemType = {
  name: 'triggerWorkflow',
  title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
  Component: 'CustomizeActionInitializer',
  schema: {
    title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
    'x-component': 'Action',
    'x-use-component-props': 'useRecordWorkflowCustomTriggerActionProps',
    'x-settings': 'actionSettings:submitToWorkflow',
    'x-decorator': 'ACLActionProvider',
    'x-action-settings': {
      // assignedValues: {},
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Submitted successfully")}}',
      },
      refreshDataBlockRequest: true,
      triggerWorkflows: [],
    },
    'x-toolbar-props': {
      initializer: false,
      showBorder: false,
    },
    'x-action': 'customize:triggerWorkflows',
  },
};

export const recordTriggerWorkflowActionLinkInitializer = {
  ...recordTriggerWorkflowActionInitializer,
  schema: {
    ...recordTriggerWorkflowActionInitializer.schema,
    'x-component': 'Action.Link',
  },
};

export const globalTriggerWorkflowActionInitializer = {
  name: 'triggerWorkflow',
  title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
  Component: 'CustomizeActionInitializer',
  schema: {
    title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
    'x-component': 'Action',
    'x-use-component-props': 'useGlobalTriggerWorkflowCustomActionProps',
    'x-settings': 'actionSettings:globalTriggerWorkflow',
    'x-decorator': 'ACLActionProvider',
    'x-action-settings': {
      // assignedValues: {},
      onSuccess: {
        manualClose: true,
        redirecting: false,
        successMessage: '{{t("Submitted successfully")}}',
      },
      refreshDataBlockRequest: true,
      triggerWorkflows: [],
    },
    'x-toolbar-props': {
      initializer: false,
      showBorder: false,
    },
    'x-action': 'customize:globalTriggerWorkflows',
  },
};

export function DataBlockTriggerWorkflowActionSchemaInitializerItem(props) {
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();

  return (
    <ModalActionSchemaInitializerItem
      title={t('Trigger workflow', { ns: NAMESPACE })}
      components={{
        RadioWithTooltip,
      }}
      modalSchema={{
        title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
        properties: {
          type: {
            title: `{{t('Context type', { ns: "${NAMESPACE}" })}}`,
            'x-decorator': 'FormItem',
            'x-component': 'RadioWithTooltip',
            'x-component-props': {
              options: CONTEXT_TYPE_OPTIONS.filter(({ value }) =>
                [CONTEXT_TYPE.GLOBAL, CONTEXT_TYPE.MULTIPLE_RECORDS].includes(value),
              ),
            },
            required: true,
          },
        },
      }}
      onSubmit={(values) => {
        insert({
          type: 'void',
          title: `{{t('${values.type ? 'Trigger workflow' : 'Trigger global workflow'}', { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Action',
          'x-component-props': {},
          'x-action': values.type ? 'customize:collectionTriggerWorkflows' : 'customize:globalTriggerWorkflows',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-decorator': 'ACLActionProvider',
          'x-action-settings': {
            onSuccess: {
              manualClose: false,
              redirecting: false,
              successMessage: '{{t("Operation succeeded")}}',
            },
          },
          ...(values.type
            ? {
                'x-use-component-props': 'useCollectionTriggerWorkflowCustomActionProps',
                'x-settings': 'actionSettings:collectionTriggerWorkflow',
              }
            : {
                'x-use-component-props': 'useGlobalTriggerWorkflowCustomActionProps',
                'x-settings': 'actionSettings:globalTriggerWorkflow',
              }),
        });
      }}
    />
  );
}

export function WorkbenchTriggerWorkflowActionSchemaInitializerItem(props) {
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  return (
    <ModalActionSchemaInitializerItem
      title={t('Trigger workflow', { ns: NAMESPACE })}
      modalSchema={{
        title: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
        properties: {
          title: {
            title: `{{t('Title')}}`,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
            required: true,
            default: `{{t("Trigger workflow", { ns: "${NAMESPACE}" })}}`,
          },
          icon: {
            title: `{{t('Icon')}}`,
            'x-component': 'IconPicker',
            'x-decorator': 'FormItem',
            required: true,
            default: 'thunderboltoutlined',
          },
          iconColor: {
            title: `{{t('Color')}}`,
            'x-component': 'ColorPicker',
            'x-decorator': 'FormItem',
            required: true,
            default: '#1677FF',
          },
        },
      }}
      onSubmit={(values) => {
        insert({
          type: 'void',
          title: values.title,
          'x-component': 'WorkbenchAction',
          'x-decorator': 'ACLActionProvider',
          'x-component-props': {
            icon: values.icon,
            iconColor: values.iconColor,
            targetComponent: 'GlobalTriggerWorkflowAction',
          },
          'x-action': 'customize:globalTriggerWorkflows',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-settings': 'actionSettings:globalTriggerWorkflow',
          'x-action-settings': {
            onSuccess: {
              manualClose: false,
              redirecting: false,
              successMessage: '{{t("Operation succeeded")}}',
            },
          },
        });
      }}
    />
  );
}
