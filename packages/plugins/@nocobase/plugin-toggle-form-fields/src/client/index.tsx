/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { useFieldSchema, useForm } from '@formily/react';
import {
  createModalSettingsItem,
  ISchema,
  Plugin,
  SchemaInitializerItemType,
  SchemaSettings,
  useSchemaInitializer,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

// Define namespace constant for our plugin
const NAMESPACE = 'plugin-toggle-form-fields';

const ActionName = 'ToggleFields';

const toggleFieldsActionSettings = new SchemaSettings({
  name: `actionSettings:${ActionName}`,
  items: [
    createModalSettingsItem({
      name: 'settings',
      title: `{{t('Settings', { ns: '${NAMESPACE}' })}}`,
      parentSchemaKey: 'x-component-props',
      schema({ topFieldsToShow }) {
        try {
          topFieldsToShow = parseInt(topFieldsToShow);
        } catch (e) {
          this.app.log.error(e);
        }
        topFieldsToShow = Number.isNaN(topFieldsToShow) ? '1' : topFieldsToShow;
        return {
          type: 'object',
          title: `{{t('Settings', { ns: '${NAMESPACE}' })}}`,
          properties: {
            topFieldsToShow: {
              title: `{{t('TopShowFields', { ns: '${NAMESPACE}' })}}`,
              type: 'string',
              default: topFieldsToShow ?? '1',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
            },
          },
        };
      },
    }),
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});

const createToggleFieldsActionInitializerItem = (): SchemaInitializerItemType => ({
  type: 'item',
  name: ActionName,
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const { t } = useTranslation(NAMESPACE);
    return {
      title: t(ActionName),
      onClick: () => {
        insert(createToggleFieldsActionSchema());
      },
    };
  },
});

const createToggleFieldsActionSchema = (): ISchema => {
  return {
    type: 'void',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-component': 'Action',
    'x-settings': toggleFieldsActionSettings.name,
    'x-use-component-props': 'useToggleFieldsActionProps',
  };
};

function useToggleFieldsActionProps() {
  const fieldSchema = useFieldSchema();
  const form = useForm();
  const { t } = useTranslation(NAMESPACE);
  const [icon, setIcon] = React.useState(<UpOutlined />);
  const [title, setTitle] = React.useState(t('CollapseFields'));
  return {
    icon: icon,
    type: 'link',
    title: title,
    onClick() {
      let count = -1;
      let targetVisible = false;
      let topFieldsToShow = 0;
      try {
        topFieldsToShow = parseInt(fieldSchema['x-component-props']?.topFieldsToShow ?? '1');
      } catch (e) {
        this.app.log.error(e);
      }
      topFieldsToShow = Number.isNaN(topFieldsToShow) ? 1 : topFieldsToShow;
      form.query('*').forEach((field) => {
        if (field.componentType === 'CollectionField') {
          count++;
          if (count < topFieldsToShow) {
            field.setDisplay('visible');
            return;
          }
          if (count === topFieldsToShow) {
            targetVisible = field.display === 'hidden';
            setIcon(!targetVisible ? <DownOutlined /> : <UpOutlined />);
            setTitle(!targetVisible ? t('ExpandFields') : t('CollapseFields'));
          }
          field.setDisplay(targetVisible ? 'visible' : 'hidden');
        }
      });
    },
  };
}

export class PluginToggleFormFields extends Plugin {
  async load() {
    // Load translations
    try {
      const resources = await import('../locale');
      this.app.i18n.addResources('en-US', 'plugin-toggle-form-fields', resources.default['en-US']);
      this.app.i18n.addResources('zh-CN', 'plugin-toggle-form-fields', resources.default['zh-CN']);
      console.log('Toggle form fields translations loaded successfully:', Object.keys(resources.default));

      // Debug: Verify translations are accessible
      const enText = this.app.i18n.t('ToggleFields', { ns: 'plugin-toggle-form-fields' });
      const zhText = this.app.i18n.t('ToggleFields', { ns: 'plugin-toggle-form-fields', lng: 'zh-CN' });
      console.log('Translation test - EN:', enText, 'ZH:', zhText);
    } catch (err) {
      console.error('Failed to load translations for toggle-form-fields:', err);
    }

    this.app.addScopes({ useToggleFieldsActionProps });
    this.app.schemaSettingsManager.add(toggleFieldsActionSettings);
    const toggleFieldsActionInitializerItem = createToggleFieldsActionInitializerItem();
    this.app.schemaInitializerManager.addItem(
      'createForm:configureActions',
      'toggle_fields',
      toggleFieldsActionInitializerItem,
    );
    this.app.schemaInitializerManager.addItem(
      'filterForm:configureActions',
      'toggle_fields',
      toggleFieldsActionInitializerItem,
    );
  }
}

export default PluginToggleFormFields;
