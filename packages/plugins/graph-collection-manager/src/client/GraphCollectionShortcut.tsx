import { PartitionOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { useActionContext, useRequest, PluginManager, SchemaComponent } from '@nocobase/client';
import { DeleteOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { GraphDrawPage } from './GraphDrawPage';
import { useCreateActionAndRefreshCM } from './action-hooks';

const useCollectionValues = (options) => {
  const { visible } = useActionContext();
  const result = useRequest(
    () =>
      Promise.resolve({
        data: {
          name: `t_${uid()}`,
          createdBy: true,
          updatedBy: true,
          sortable: true,
          logging: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
            {
              interface: 'createdAt',
              type: 'date',
              field: 'createdAt',
              name: 'createdAt',
              uiSchema: {
                type: 'datetime',
                title: '{{t("Created at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              interface: 'createdBy',
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'createdById',
              name: 'createdBy',
              uiSchema: {
                type: 'object',
                title: '{{t("Created by")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
            },
            {
              type: 'date',
              field: 'updatedAt',
              name: 'updatedAt',
              interface: 'updatedAt',
              uiSchema: {
                type: 'string',
                title: '{{t("Last updated at")}}',
                'x-component': 'DatePicker',
                'x-component-props': {},
                'x-read-pretty': true,
              },
            },
            {
              type: 'belongsTo',
              target: 'users',
              foreignKey: 'updatedById',
              name: 'updatedBy',
              interface: 'updatedBy',
              uiSchema: {
                type: 'object',
                title: '{{t("Last updated by")}}',
                'x-component': 'RecordPicker',
                'x-component-props': {
                  fieldNames: {
                    value: 'id',
                    label: 'nickname',
                  },
                },
                'x-read-pretty': true,
              },
            },
          ],
        },
      }),
    {
      ...options,
      manual: true,
    },
  );

  useEffect(() => {
    if (visible) {
      result.run();
    }
  }, [visible]);

  return result;
};

export const GraphCollectionPane = () => {
  return (
    <div id="graph_container">
      <SchemaComponent
        schema={{
          type: 'void',
          'x-component': 'div',
          properties: {
            editor: {
              type: 'void',
              'x-component': 'GraphDrawPage',
            },
          },
        }}
        components={{
          GraphDrawPage,
          DeleteOutlined,
        }}
        scope={{ useCollectionValues, useCreateActionAndRefreshCM }}
      />
    </div>
  );
};

export const GraphCollectionShortcut = () => {
  const { t } = useTranslation();
  const history = useHistory();
  return (
    <PluginManager.Toolbar.Item
      icon={<PartitionOutlined />}
      title={t('graph collection')}
      onClick={() => {
        history.push('/admin/settings/graph/collections');
      }}
    />
  );
};
