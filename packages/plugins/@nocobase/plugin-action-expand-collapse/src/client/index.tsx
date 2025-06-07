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
  ActionInitializer,
  createModalSettingsItem,
  ISchema,
  Plugin,
  SchemaInitializerItemType,
  SchemaSettings,
  useSchemaInitializer,
} from '@nocobase/client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Define namespace constant for our plugin
const NAMESPACE = 'action-expand-collapse';

const ActionName = 'ToggleFields';

// Utility function to normalize topFieldsToShow value
const normalizeTopFieldsToShow = (value: unknown): number => {
  const num = Number(value);
  return Number.isNaN(num) ? 1 : Math.max(1, num);
};

const toggleFieldsActionSettings = new SchemaSettings({
  name: `actionSettings:${ActionName}`,
  items: [
    createModalSettingsItem({
      name: 'toggleFieldsSettings',
      title: `{{t('ToggleFieldsSettings', { ns: '${NAMESPACE}' })}}`,
      parentSchemaKey: 'x-component-props',
      schema({ topFieldsToShow }) {
        topFieldsToShow = normalizeTopFieldsToShow(topFieldsToShow ?? 1);
        return {
          type: 'object',
          title: `{{t('ToggleFieldsSettings', { ns: '${NAMESPACE}' })}}`,
          properties: {
            topFieldsToShow: {
              title: `{{t('TopShowFields', { ns: '${NAMESPACE}' })}}`,
              type: 'number',
              default: topFieldsToShow,
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {
                min: 1,
                step: 1,
              },
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

const useToggleFieldsActionProps = () => {
  const fieldSchema = useFieldSchema();
  const form = useForm();
  const { t } = useTranslation(NAMESPACE);
  const collapseComponent = (
    <>
      {t('CollapseFields')} <UpOutlined />
    </>
  );
  const expandComponent = (
    <>
      {t('ExpandFields')} <DownOutlined />
    </>
  );
  const [actionComponent, setActionComponent] = useState(collapseComponent);
  return {
    type: 'link',
    title: actionComponent,
    onClick() {
      let count = -1;
      let targetVisible = false;
      const topFieldsToShow = normalizeTopFieldsToShow(fieldSchema['x-component-props']?.topFieldsToShow ?? 1);
      form.query('*').forEach((field) => {
        if (field.componentType === 'CollectionField') {
          count++;
          if (count < topFieldsToShow) {
            field.setDisplay('visible');
            return;
          }
          if (count === topFieldsToShow) {
            targetVisible = field.display === 'hidden';
            setActionComponent(!targetVisible ? expandComponent : collapseComponent);
          }
          field.setDisplay(targetVisible ? 'visible' : 'hidden');
        }
      });
    },
  };
};

const createToggleFieldsActionSchema = (): ISchema => ({
  type: 'void',
  'x-action': 'expandCollapse',
  'x-toolbar': 'ActionSchemaToolbar',
  'x-component': 'Action',
  'x-settings': toggleFieldsActionSettings.name,
  'x-use-component-props': 'useToggleFieldsActionProps',
});

export const ExpandCollapseActionInitializer = (props) => {
  const schema = createToggleFieldsActionSchema();
  return <ActionInitializer {...props} schema={schema} />;
};

const createToggleFieldsActionInitializerItem = (): SchemaInitializerItemType => ({
  name: ActionName,
  title: `{{t("${ActionName}", { ns: "action-expand-collapse" })}}`,
  Component: ExpandCollapseActionInitializer,
  schema: {
    'x-action-settings': {},
  },
});

export class PluginToggleFormFields extends Plugin {
  async load() {
    this.app.addScopes({ useToggleFieldsActionProps });
    this.app.schemaSettingsManager.add(toggleFieldsActionSettings);
    this.app.schemaInitializerManager.addItem(
      'filterForm:configureActions',
      'toggleFields',
      createToggleFieldsActionInitializerItem(),
    );
  }
}

export default PluginToggleFormFields;
