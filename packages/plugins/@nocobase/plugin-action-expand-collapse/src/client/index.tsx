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
import { isVoidField } from '@formily/core';
import {
  Action,
  createModalSettingsItem,
  InitializerWithSwitch,
  Plugin,
  SchemaInitializerItemType,
  SchemaSettings,
  useDesignable,
  useSchemaInitializerItem,
} from '@nocobase/client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Switch } from 'antd';

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
      schema({ topFieldsToShow, defaultCollapse = true }) {
        topFieldsToShow = normalizeTopFieldsToShow(topFieldsToShow ?? 1);
        return {
          type: 'object',
          title: `{{t('ToggleFieldsSettings', { ns: '${NAMESPACE}' })}}`,
          properties: {
            defaultCollapse: {
              title: `{{t('DefaultCollapse', { ns: '${NAMESPACE}' })}}`,
              type: 'boolean',
              default: defaultCollapse,
              'x-decorator': 'FormItem',
              'x-component': Switch,
            },
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

const useToggleFieldsAction = () => {
  const { t } = useTranslation(NAMESPACE);
  const form = useForm();
  const fieldSchema = useFieldSchema();
  const componentProps = fieldSchema['x-component-props'];
  const [targetVisible, setTargetVisible] = useState(false);
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
  const topFieldsToShow = normalizeTopFieldsToShow(componentProps?.topFieldsToShow ?? 1);
  const defaultCollapse = componentProps?.defaultCollapse ?? true;

  const actionOnClick = () => {
    let count = -1;
    form.query('*').forEach((field) => {
      if (!isVoidField(field)) {
        count++;
        const state = field.getState();
        if (count < topFieldsToShow) {
          //only show not hide fields
          //none is hide by linkageRules
          if (state.display !== 'none') field.setDisplay('visible');
          return;
        }
        if (state.display !== 'none') field.setDisplay(targetVisible ? 'visible' : 'hidden');
      }
    });
    setActionComponent(!targetVisible ? expandComponent : collapseComponent);
    setTargetVisible(!targetVisible);
  };

  if (!form?.['_expandAndCollapse_initialized'] && defaultCollapse) {
    form['_expandAndCollapse_initialized'] = true;
    actionOnClick();
  }

  return {
    isExpanded: !targetVisible,
    actionComponent,
    actionOnClick,
  };
};

const ActionComponent = (props) => {
  const { isExpanded, actionComponent, actionOnClick } = useToggleFieldsAction();
  const { designable } = useDesignable?.() || {};
  const { t } = useTranslation(NAMESPACE);
  if (designable) {
    // In the designer mode, use standard Actions while retaining the editing capability.
    return <Action {...props} type={'link'} title={actionComponent} onClick={actionOnClick}></Action>;
  } else {
    // In non-designer mode, use buttons. Avoid the situation where the title of the Action becomes [object Object] after using custom components for the Action's title.
    return (
      <Button type={'link'} onClick={actionOnClick} title={isExpanded ? t('CollapseFields') : t('ExpandFields')}>
        {actionComponent}
      </Button>
    );
  }
};

export const ExpandCollapseActionInitializer = (props) => {
  const itemConfig = useSchemaInitializerItem();
  return (
    <InitializerWithSwitch
      {...itemConfig}
      {...props}
      item={itemConfig}
      schema={{
        type: 'void',
        'x-action': 'expandCollapse',
        'x-toolbar': 'ActionSchemaToolbar',
        'x-component': 'ActionComponent',
        'x-settings': toggleFieldsActionSettings.name,
      }}
      type={'x-action'}
    />
  );
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
    this.app.addComponents({ ActionComponent });
    this.app.schemaSettingsManager.add(toggleFieldsActionSettings);
    this.app.schemaInitializerManager.addItem(
      'filterForm:configureActions',
      'toggleFields',
      createToggleFieldsActionInitializerItem(),
    );
  }
}

export default PluginToggleFormFields;
