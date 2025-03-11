/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useField, useFieldSchema } from '@formily/react';
import { isValid, uid } from '@formily/shared';
import { ModalProps } from 'antd';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile, useDesignable } from '../..';
import { isInitializersSame, useApp } from '../../../application';
import { SchemaSettingOptions, SchemaSettings } from '../../../application/schema-settings';
import { useSchemaToolbar } from '../../../application/schema-toolbar';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../../collection-manager';
import { FlagProvider } from '../../../flag-provider';
import { SaveMode } from '../../../modules/actions/submit/createSubmitActionSettings';
import { useOpenModeContext } from '../../../modules/popup/OpenModeProvider';
import { SchemaSettingOpenModeSchemaItems } from '../../../schema-items';
import { GeneralSchemaDesigner } from '../../../schema-settings/GeneralSchemaDesigner';
import {
  SchemaSettingsActionModalItem,
  SchemaSettingsDivider,
  SchemaSettingsEnableChildCollections,
  SchemaSettingsLinkageRules,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SchemaSettingsSwitchItem,
} from '../../../schema-settings/SchemaSettings';
import { DefaultValueProvider } from '../../../schema-settings/hooks/useIsAllowToSetDefaultValue';
import { useLinkageAction } from './hooks';
import { requestSettingsSchema } from './utils';

const MenuGroup = (props) => {
  return props.children;
};

export function ButtonEditor(props) {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const isLink = props?.isLink || fieldSchema['x-component'] === 'Action.Link';

  return (
    <SchemaSettingsModalItem
      title={t('Edit button')}
      schema={
        {
          type: 'object',
          title: t('Edit button'),
          properties: {
            title: {
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              title: t('Button title'),
              default: fieldSchema.title,
              'x-component-props': {},
            },
            icon: {
              'x-decorator': 'FormItem',
              'x-component': 'IconPicker',
              title: t('Button icon'),
              default: fieldSchema?.['x-component-props']?.icon,
              'x-component-props': {},
              'x-visible': !isLink,
            },
            iconColor: {
              title: t('Color'),
              required: true,
              default: fieldSchema?.['x-component-props']?.iconColor || '#1677FF',
              'x-hidden': !props.hasIconColor,
              'x-component': 'ColorPicker',
              'x-decorator': 'FormItem',
            },
            type: {
              'x-decorator': 'FormItem',
              'x-component': 'Radio.Group',
              title: t('Button background color'),
              default: fieldSchema?.['x-component-props']?.danger
                ? 'danger'
                : fieldSchema?.['x-component-props']?.type === 'primary'
                  ? 'primary'
                  : 'default',
              enum: [
                { value: 'default', label: '{{t("Default")}}' },
                { value: 'primary', label: '{{t("Highlight")}}' },
                { value: 'danger', label: '{{t("Danger red")}}' },
              ],
              'x-visible': !props.hasIconColor && !isLink,
            },
          },
        } as ISchema
      }
      onSubmit={({ title, icon, type, iconColor }) => {
        if (field.address.toString() === fieldSchema.name) {
          field.title = title;
          field.componentProps.iconColor = iconColor;
          field.componentProps.icon = icon;
          field.componentProps.danger = type === 'danger';
          field.componentProps.type = type || field.componentProps.type;
        } else {
          field.form.query(new RegExp(`.${fieldSchema.name}$`)).forEach((fieldItem) => {
            fieldItem.title = title;
            fieldItem.componentProps.iconColor = iconColor;
            fieldItem.componentProps.icon = icon;
            fieldItem.componentProps.danger = type === 'danger';
            fieldItem.componentProps.type = type || fieldItem.componentProps.type;
          });
        }

        fieldSchema.title = title;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].iconColor = iconColor;
        fieldSchema['x-component-props'].icon = icon;
        fieldSchema['x-component-props'].danger = type === 'danger';
        fieldSchema['x-component-props'].type = type || field.componentProps.type;

        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            title,
            'x-component-props': {
              ...fieldSchema['x-component-props'],
            },
          },
        });
        dn.refresh();
      }}
    />
  );
}

const findFormBlock = (schema) => {
  const formSchema = schema.reduceProperties((_, s) => {
    if (s['x-decorator'] === 'FormBlockProvider') {
      return s;
    } else {
      return findFormBlock(s);
    }
  }, null);
  return formSchema;
};

const getAllkeys = (data, result) => {
  for (let i = 0; i < data?.length; i++) {
    const { children, ...rest } = data[i];
    result.push(rest.key);
    if (children) {
      getAllkeys(children, result);
    }
  }
  return result;
};

export function AssignedFieldValues() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const initialSchema = {
    type: 'void',
    'x-uid': uid(),
    'x-component': 'Grid',
    'x-initializer': 'assignFieldValuesForm:configureFields',
  };
  const tips = {
    'customize:update': t(
      'After clicking the custom button, the following fields of the current record will be saved according to the following form.',
    ),
    'customize:save': t(
      'After clicking the custom button, the following fields of the current record will be saved according to the following form.',
    ),
  };
  const actionType = fieldSchema['x-action'] ?? '';
  const onSubmit = useCallback(
    (assignedValues) => {
      fieldSchema['x-action-settings']['assignedValues'] = assignedValues;
      dn.emit('patch', {
        schema: {
          ['x-uid']: fieldSchema['x-uid'],
          'x-action-settings': fieldSchema['x-action-settings'],
        },
      });
    },
    [dn, fieldSchema],
  );
  return (
    <FlagProvider isInAssignFieldValues={true}>
      <DefaultValueProvider isAllowToSetDefaultValue={() => false}>
        <SchemaSettingsActionModalItem
          title={t('Assign field values')}
          // maskClosable={false}
          initialSchema={initialSchema}
          initialValues={fieldSchema?.['x-action-settings']?.assignedValues}
          modalTip={tips[actionType]}
          uid={fieldSchema?.['x-action-settings']?.schemaUid}
          onSubmit={onSubmit}
        />
      </DefaultValueProvider>
    </FlagProvider>
  );
}

export function RequestSettings() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettingsActionModalItem
      title={t('Request settings')}
      schema={requestSettingsSchema}
      initialValues={fieldSchema?.['x-action-settings']?.requestSettings}
      onSubmit={(requestSettings) => {
        fieldSchema['x-action-settings']['requestSettings'] = requestSettings;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-action-settings': fieldSchema['x-action-settings'],
          },
        });
        dn.refresh();
      }}
    />
  );
}

export function SkipValidation() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();

  return (
    <SchemaSettingsSwitchItem
      title={t('Skip required validation')}
      checked={!!fieldSchema?.['x-action-settings']?.skipValidator}
      onChange={(value) => {
        fieldSchema['x-action-settings'].skipValidator = value;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-action-settings': {
              ...fieldSchema['x-action-settings'],
            },
          },
        });
      }}
    />
  );
}

export function AfterSuccess() {
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { onSuccess } = fieldSchema?.['x-action-settings'] || {};
  return (
    <SchemaSettingsModalItem
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
              'x-component': 'Input.TextArea',
              'x-component-props': {},
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
              'x-component': 'Input',
              'x-component-props': {},
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
export function RemoveButton(
  props: {
    onConfirmOk?: ModalProps['onOk'];
    disabled?: boolean;
  } = {},
) {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const isDeletable = fieldSchema?.parent['x-component'] === 'CollectionField';
  return (
    !isDeletable && (
      <>
        <SchemaSettingsDivider />
        <SchemaSettingsRemove
          removeParentsIfNoChildren
          breakRemoveOn={(s) => {
            return s['x-component'] === 'Space' || s['x-component'].endsWith('ActionBar');
          }}
          disabled={props.disabled}
          confirm={{
            title: t('Delete action'),
            onOk: props.onConfirmOk,
          }}
        />
      </>
    )
  );
}

export const actionSettingsItems: SchemaSettingOptions['items'] = [
  {
    name: 'Customize',
    Component: MenuGroup,
    children: [
      {
        name: 'editButton',
        Component: ButtonEditor,
        useComponentProps() {
          const { buttonEditorProps } = useSchemaToolbar();
          return buttonEditorProps;
        },
      },
      {
        name: 'linkageRules',
        Component: (props) => {
          return <SchemaSettingsLinkageRules {...props} />;
        },
        useVisible() {
          const isAction = useLinkageAction();
          const { linkageAction } = useSchemaToolbar();
          return linkageAction || isAction;
        },
        useComponentProps() {
          const { name } = useCollection_deprecated();
          const { linkageRulesProps } = useSchemaToolbar();
          return {
            ...linkageRulesProps,
            collectionName: name,
          };
        },
      },
      {
        name: 'openMode',
        Component: SchemaSettingOpenModeSchemaItems,
        useComponentProps() {
          const { hideOpenMode } = useOpenModeContext();
          const fieldSchema = useFieldSchema();
          const isPopupAction = [
            'create',
            'update',
            'view',
            'customize:popup',
            'duplicate',
            'customize:create',
          ].includes(fieldSchema['x-action'] || '');

          return {
            openMode: isPopupAction && !hideOpenMode,
            openSize: isPopupAction && !hideOpenMode,
          };
        },
      },
      {
        name: 'secondConFirm',
        Component: SecondConFirm,
        useVisible() {
          const fieldSchema = useFieldSchema();
          const isPopupAction = [
            'create',
            'update',
            'view',
            'customize:popup',
            'duplicate',
            'customize:create',
          ].includes(fieldSchema['x-action'] || '');
          return !isPopupAction && !fieldSchema?.['x-action-settings']?.disableSecondConFirm;
        },
      },
      {
        name: 'assignFieldValues',
        Component: AssignedFieldValues,
        useVisible() {
          const fieldSchema = useFieldSchema();
          return isValid(fieldSchema?.['x-action-settings']?.assignedValues);
        },
      },
      {
        name: 'requestSettings',
        Component: RequestSettings,
        useVisible() {
          const fieldSchema = useFieldSchema();
          return isValid(fieldSchema?.['x-action-settings']?.requestSettings);
        },
      },
      {
        name: 'skipValidator',
        Component: SkipValidation,
        useVisible() {
          const fieldSchema = useFieldSchema();
          return isValid(fieldSchema?.['x-action-settings']?.skipValidator);
        },
      },
      {
        name: 'afterSuccess',
        Component: AfterSuccess,
        useVisible() {
          const fieldSchema = useFieldSchema();
          return isValid(fieldSchema?.['x-action-settings']?.onSuccess);
        },
      },
      {
        name: 'saveMode',
        Component: SaveMode,
        useVisible() {
          const fieldSchema = useFieldSchema();
          return (
            fieldSchema['x-action'] === 'submit' &&
            isInitializersSame(fieldSchema.parent?.['x-initializer'], 'createForm:configureActions')
          );
        },
      },
      {
        name: 'enableChildCollections',
        Component: SchemaSettingsEnableChildCollections,
        useVisible() {
          const fieldSchema = useFieldSchema();
          const { name } = useCollection_deprecated();
          const { getChildrenCollections } = useCollectionManager_deprecated();
          const isChildCollectionAction =
            getChildrenCollections(name).length > 0 && fieldSchema['x-action'] === 'create';
          return isChildCollectionAction;
        },
        useComponentProps() {
          const { name } = useCollection_deprecated();
          return {
            collectionName: name,
          };
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
          const fieldSchema = useFieldSchema();
          return isValid(fieldSchema?.['x-action-settings']?.triggerWorkflows);
        },
      },
      {
        type: 'switch',
        name: 'clearDefaultValue',
        useComponentProps() {
          const { t } = useTranslation();
          const fieldSchema = useFieldSchema();
          const { dn } = useDesignable();

          return {
            title: t('Clear default value'),
            checked: fieldSchema?.['x-component-props']?.clearDefaultValue,
            onChange: (value) => {
              dn.deepMerge({
                ['x-uid']: fieldSchema['x-uid'],
                'x-component-props': {
                  clearDefaultValue: value,
                },
              });
            },
          };
        },
        useVisible() {
          const fieldSchema = useFieldSchema();
          const isResetButton = fieldSchema['x-use-component-props'] === 'useResetBlockActionProps';
          return isResetButton;
        },
      },
      {
        name: 'remove',
        sort: 100,
        Component: RemoveButton as any,
        useComponentProps() {
          const { removeButtonProps } = useSchemaToolbar();
          return removeButtonProps;
        },
        useVisible() {
          const fieldSchema = useFieldSchema();
          return fieldSchema?.['x-action-settings']?.removable !== false;
        },
      },
    ],
  },
];
export function SecondConFirm() {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const field = useField();
  const compile = useCompile();

  return (
    <SchemaSettingsModalItem
      title={t('Secondary confirmation')}
      initialValues={{
        title:
          compile(fieldSchema?.['x-component-props']?.confirm?.title) ||
          t('Perform the {{title}}', { title: compile(fieldSchema.title) }),
        content:
          compile(fieldSchema?.['x-component-props']?.confirm?.content) ||
          t('Are you sure you want to perform the {{title}} action?', { title: compile(fieldSchema.title) }),
      }}
      schema={
        {
          type: 'object',
          title: t('Secondary confirmation'),
          properties: {
            enable: {
              'x-decorator': 'FormItem',
              'x-component': 'Checkbox',
              'x-content': t('Enable secondary confirmation'),
              default:
                fieldSchema?.['x-component-props']?.confirm?.enable !== false &&
                !!fieldSchema?.['x-component-props']?.confirm?.content,
              'x-component-props': {},
            },
            title: {
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              title: t('Title'),

              'x-reactions': {
                dependencies: ['enable'],
                fulfill: {
                  state: {
                    required: '{{$deps[0]}}',
                  },
                },
              },
            },
            content: {
              'x-decorator': 'FormItem',
              'x-component': 'Input.TextArea',
              title: t('Content'),
              'x-reactions': {
                dependencies: ['enable'],
                fulfill: {
                  state: {
                    required: '{{$deps[0]}}',
                  },
                },
              },
            },
          },
        } as ISchema
      }
      onSubmit={({ enable, title, content }) => {
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].confirm = {};
        fieldSchema['x-component-props'].confirm.enable = enable;
        fieldSchema['x-component-props'].confirm.title = title;
        fieldSchema['x-component-props'].confirm.content = content;
        field.componentProps.confirm = { ...fieldSchema['x-component-props']?.confirm };
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema['x-component-props'],
            },
          },
        });
        dn.refresh();
      }}
    />
  );
}

/**
 * @deprecated
 */
export const actionSettings = new SchemaSettings({
  name: 'ActionSettings',
  items: actionSettingsItems,
});

export const ActionDesigner = (props) => {
  const {
    modalTip,
    linkageAction,
    removeButtonProps,
    buttonEditorProps,
    linkageRulesProps,
    schemaSettings = 'ActionSettings',
    enableDrag = true,
    ...restProps
  } = props;
  const app = useApp();
  const fieldSchema = useFieldSchema();
  const isDraggable = fieldSchema?.parent['x-component'] !== 'CollectionField' && enableDrag;
  const settingsName = `ActionSettings:${fieldSchema['x-action']}`;
  const defaultActionSettings = schemaSettings || 'ActionSettings';
  const hasAction = app.schemaSettingsManager.has(settingsName);

  return (
    <GeneralSchemaDesigner
      schemaSettings={hasAction ? settingsName : defaultActionSettings}
      contextValue={{ modalTip, linkageAction, removeButtonProps, buttonEditorProps, linkageRulesProps }}
      {...restProps}
      disableInitializer
      draggable={isDraggable}
    ></GeneralSchemaDesigner>
  );
};

export function RefreshDataBlockRequest(props) {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { refreshDataBlockRequest } = fieldSchema?.['x-component-props'] || {};
  return (
    <SchemaSettingsSwitchItem
      title={t('Refresh data on action')}
      //兼容历史数据
      checked={refreshDataBlockRequest !== false}
      onChange={(value) => {
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
        fieldSchema['x-component-props'].refreshDataBlockRequest = value;
        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': {
              ...fieldSchema['x-component-props'],
            },
          },
        });
      }}
    />
  );
}
ActionDesigner.ButtonEditor = ButtonEditor;
ActionDesigner.RemoveButton = RemoveButton;
