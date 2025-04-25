/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ButtonEditor,
  RefreshDataBlockRequest,
  RemoveButton,
  SchemaSettings,
  SchemaSettingsLinkageRules,
  SecondConFirm,
  useCollection,
  useSchemaToolbar,
  SchemaSettingAccessControl,
  useDesignable,
  useGlobalVariable,
  usePlugin,
  SchemaSettingsModalItem,
  useAfterSuccessOptions,
  BlocksSelector,
} from '@nocobase/client';
import React from 'react';
import { ISchema, useFieldSchema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { CustomRequestSettingsItem } from './components/CustomRequestActionDesigner';

const useVariableOptions = () => {
  const scopes = useAfterSuccessOptions();
  const { t } = useTranslation();
  return [
    {
      value: '$nResponse',
      label: t('Response', { ns: 'client' }),
      children: null,
    },
    ...scopes.filter((v: any) => ['currentUser', 'currentTime', '$nRole'].includes(v.value)),
  ].filter(Boolean);
};

const useLinkVariableOptions = () => {
  const scopes = useAfterSuccessOptions();
  const environmentVariables = useGlobalVariable('$env');
  return [...scopes.filter((v: any) => v.value !== '$record'), environmentVariables].filter(Boolean);
};
const useLinkVariableProps = () => {
  const scope = useLinkVariableOptions();
  return {
    scope,
    useTypedConstant: true,
  };
};
export function AfterSuccess() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { onSuccess } = fieldSchema?.['x-action-settings'] || {};
  const templatePlugin: any = usePlugin('@nocobase/plugin-block-template');
  const isInBlockTemplateConfigPage = templatePlugin?.isInBlockTemplateConfigPage?.();
  return (
    <SchemaSettingsModalItem
      dialogRootClassName="dialog-after-successful-submission"
      width={700}
      title={t('After successful submission')}
      initialValues={
        onSuccess
          ? {
              actionAfterSuccess: onSuccess?.redirecting ? 'redirect' : 'previous',
              ...onSuccess,
            }
          : {
              manualClose: false,
              redirecting: false,
              successMessage: '{{t("Saved successfully")}}',
              actionAfterSuccess: 'previous',
            }
      }
      schema={
        {
          type: 'object',
          title: t('After successful submission'),
          properties: {
            successMessage: {
              title: t('Popup message'),
              'x-decorator': 'FormItem',
              'x-component': 'Variable.RawTextArea',
              'x-component-props': {
                scope: useVariableOptions,
                style: { minWidth: '220px' },
              },
            },
            manualClose: {
              title: t('Message popup close method'),
              enum: [
                { label: t('Automatic close'), value: false },
                { label: t('Manually close'), value: true },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              'x-component-props': {},
            },
            redirecting: {
              title: t('Then'),
              'x-hidden': true,
              enum: [
                { label: t('Stay on current page'), value: false },
                { label: t('Redirect to'), value: true },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              'x-component-props': {},
              'x-reactions': {
                target: 'redirectTo',
                fulfill: {
                  state: {
                    visible: '{{!!$self.value}}',
                  },
                },
              },
            },
            actionAfterSuccess: {
              title: t('Action after successful submission'),
              enum: [
                { label: t('Stay on the current popup or page'), value: 'stay' },
                { label: t('Return to the previous popup or page'), value: 'previous' },
                { label: t('Redirect to'), value: 'redirect' },
              ],
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              'x-component-props': {},
              'x-reactions': {
                target: 'redirectTo',
                fulfill: {
                  state: {
                    visible: "{{$self.value==='redirect'}}",
                  },
                },
              },
            },
            redirectTo: {
              title: t('Link'),
              'x-decorator': 'FormItem',
              'x-component': 'Variable.TextArea',
              'x-use-component-props': useLinkVariableProps,
            },
            blocksToRefresh: {
              type: 'array',
              title: t('Refresh data blocks'),
              'x-decorator': 'FormItem',
              'x-use-decorator-props': () => {
                return {
                  tooltip: t('After successful submission, the selected data blocks will be automatically refreshed.'),
                };
              },
              'x-component': BlocksSelector,
              'x-hidden': isInBlockTemplateConfigPage, // 模板配置页面暂不支持该配置
            },
          },
        } as ISchema
      }
      onSubmit={(onSuccess) => {
        fieldSchema['x-action-settings']['onSuccess'] = onSuccess;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-action-settings': fieldSchema['x-action-settings'],
          },
        });
      }}
    />
  );
}

export const customizeCustomRequestActionSettings = new SchemaSettings({
  name: 'actionSettings:customRequest',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const fieldSchema = useFieldSchema();
        return {
          isLink: fieldSchema['x-action'] === 'customize:table:request',
        };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'afterSuccessfulSubmission',
      Component: AfterSuccess,
    },
    {
      name: 'request settings',
      Component: CustomRequestSettingsItem,
    },
    {
      ...SchemaSettingAccessControl,
      useVisible() {
        return true;
      },
    },
    {
      name: 'refreshDataBlockRequest',
      Component: RefreshDataBlockRequest,
      useComponentProps() {
        return {
          isPopupAction: false,
        };
      },
      useVisible() {
        const collection = useCollection();
        return !!collection;
      },
    },
    {
      name: 'delete',
      sort: 100,
      Component: RemoveButton as any,
      useComponentProps() {
        const { removeButtonProps } = useSchemaToolbar();
        return removeButtonProps;
      },
    },
  ],
});
