import { DeleteOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { css, SchemaComponent, useActionContext, useRequest } from '@nocobase/client';
import React, { useEffect } from 'react';
import { useCreateActionAndRefreshCM } from './action-hooks';
import { GraphDrawPage } from './GraphDrawPage';

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
    <div
      className={css`
        height: calc(100vh - 160px);
        overflow: auto;
        margin: calc(var(--nb-spacing) * -1);
        position: relative;
      `}
      id="graph_container"
    >
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
