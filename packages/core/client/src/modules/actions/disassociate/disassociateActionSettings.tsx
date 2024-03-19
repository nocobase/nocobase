import React from 'react';
import { useSchemaToolbar } from '../../../application';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCollection } from '../../../collection-manager';
import {
  SchemaSettingsLinkageRules,
  SchemaSettingsModalItem,
  SchemaSettingsSwitchItem,
} from '../../../schema-settings';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import { useDesignable } from '../../../schema-component/hooks/useDesignable';
import { useTranslation } from 'react-i18next';
import { Field } from '@formily/core';

export const disassociateActionSettings = new SchemaSettings({
  name: 'actionSettings:disassociate',
  items: [
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
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
          collectionName: name,
        };
      },
    },
    {
      name: 'secondConFirm',
      Component: SecondConFirm,
    },
    {
      name: 'delete',
      type: 'remove',
    },
  ],
});

function ButtonEditor(props) {
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
              // description: `原字段标题：${collectionField?.uiSchema?.title}`,
            },
            icon: {
              'x-decorator': 'FormItem',
              'x-component': 'IconPicker',
              title: t('Button icon'),
              default: fieldSchema?.['x-component-props']?.icon,
              'x-component-props': {},
              'x-visible': !isLink,
              // description: `原字段标题：${collectionField?.uiSchema?.title}`,
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
              'x-visible': !isLink,
            },
          },
        } as ISchema
      }
      onSubmit={({ title, icon, type }) => {
        fieldSchema.title = title;
        field.title = title;
        field.componentProps.icon = icon;
        field.componentProps.danger = type === 'danger';
        field.componentProps.type = type || field.componentProps.type;
        fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
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

function SecondConFirm() {
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const field = useField<Field>();

  return (
    <SchemaSettingsSwitchItem
      title={t('Secondary confirmation')}
      checked={!!fieldSchema?.['x-component-props']?.confirm?.content}
      onChange={(value) => {
        if (!fieldSchema['x-component-props']) {
          fieldSchema['x-component-props'] = {};
        }
        if (value) {
          fieldSchema['x-component-props'].confirm = value
            ? {
                title: 'Perform the {{title}}',
                content: 'Are you sure you want to perform the {{title}} action?',
              }
            : {};
        } else {
          fieldSchema['x-component-props'].confirm = {};
        }
        field.componentProps.confirm = { ...fieldSchema['x-component-props']?.confirm };

        dn.emit('patch', {
          schema: {
            ['x-uid']: fieldSchema['x-uid'],
            'x-component-props': { ...fieldSchema['x-component-props'] },
          },
        });
      }}
    />
  );
}
