import { DatabaseOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PluginManager } from '../plugin-manager';
import { ActionContext, SchemaComponent } from '../schema-component';
import { CollectionCategroriesProvider } from './CollectionManagerProvider';
import {
  AddCategory,
  AddCategoryAction,
  AddCollection,
  AddCollectionAction,
  AddCollectionField,
  AddFieldAction,
  ConfigurationTable,
  ConfigurationTabs,
  EditCategory,
  EditCategoryAction,
  EditCollection,
  EditCollectionAction,
  EditCollectionField,
  EditFieldAction,
  OverridingCollectionField,
  OverridingFieldAction,
  ViewCollectionField,
  ViewFieldAction,
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
      // 'x-decorator': 'CollectionCategroriesProvider',
      'x-component': 'ConfigurationTable',
    },
  },
};

export const CollectionManagerPane = () => {
  return (
    // <Card bordered={false}>
    <SchemaComponent
      schema={schema2}
      components={{
        CollectionCategroriesProvider,
        ConfigurationTable,
        ConfigurationTabs,
        AddFieldAction,
        AddCollectionField,
        AddCollection,
        AddCollectionAction,
        AddCategoryAction,
        AddCategory,
        EditCollection,
        EditCollectionAction,
        EditFieldAction,
        EditCollectionField,
        OverridingCollectionField,
        OverridingFieldAction,
        ViewCollectionField,
        ViewFieldAction,
        EditCategory,
        EditCategoryAction,
      }}
    />
    // </Card>
  );
};

export const CollectionManagerShortcut = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <PluginManager.Toolbar.Item
      icon={<DatabaseOutlined />}
      title={t('Collections & Fields')}
      onClick={() => {
        navigate('/admin/settings/collection-manager/collections');
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
          ConfigurationTabs,
          AddFieldAction,
          EditFieldAction,
          OverridingFieldAction,
          ViewFieldAction,
          AddCollectionAction,
          EditCollectionAction,
          AddCategoryAction,
          EditCategoryAction,
        }}
      />
    </ActionContext.Provider>
  );
};
