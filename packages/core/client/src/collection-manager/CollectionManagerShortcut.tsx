import { DatabaseOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { Card } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { PluginManager } from '../plugin-manager';
import { ActionContext, SchemaComponent } from '../schema-component';
import {
  AddCollectionField,
  AddFieldAction,
  ConfigurationTable,
  EditFieldAction,
  EditCollectionField,
  OverridingFieldAction,
  OverridingCollectionField,
  ViewCollectionField,
  ViewFieldAction,
  AddCollection,
  AddCollectionAction,
  EditCollection,
  EditCollectionAction,
} from './Configuration';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'Action.Drawer',
      type: 'void',
      title: '{{t("Collections & Fields")}}',
      properties: {
        configuration: {
          'x-component': 'ConfigurationTable',
        },
      },
    },
  },
};

const schema2: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-component': 'ConfigurationTable',
    },
  },
};

export const CollectionManagerPane = () => {
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={schema2}
        components={{
          ConfigurationTable,
          AddFieldAction,
          AddCollectionField,
          AddCollection,
          AddCollectionAction,
          EditCollection,
          EditCollectionAction,
          EditFieldAction,
          EditCollectionField,
          OverridingCollectionField,
          OverridingFieldAction,
          ViewCollectionField,
          ViewFieldAction,
        }}
      />
    </Card>
  );
};

export const CollectionManagerShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<DatabaseOutlined />}
      title={t('Collections & Fields')}
      onClick={() => {
        history.push('/admin/settings/collection-manager/collections');
      }}
    />
  );
};

export const CollectionManagerShortcut2 = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<DatabaseOutlined />}
        title={t('Collections & Fields')}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent
        schema={schema}
        components={{
          ConfigurationTable,
          AddFieldAction,
          EditFieldAction,
          OverridingFieldAction,
          ViewFieldAction,
          AddCollectionAction,
          EditCollectionAction,
        }}
      />
    </ActionContext.Provider>
  );
};
