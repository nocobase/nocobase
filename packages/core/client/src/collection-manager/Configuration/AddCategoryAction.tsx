import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { ISchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { Button } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext, useCompile } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import { useCollectionManager } from '../hooks';
import { useResourceActionContext, useResourceContext } from '../ResourceActionProvider';
import * as components from './components';
import { collectionCategorySchema } from './schemas/collections';
import { CollectionCategroriesContext } from '../context';

const useDefaultCollectionFields = (values) => {
  let defaults = values.fields ? [...values.fields] : [];
  const { autoGenId = true, createdAt = true, createdBy = true, updatedAt = true, updatedBy = true } = values;
  if (autoGenId) {
    const pk = values.fields.find((f) => f.primaryKey);
    if (!pk) {
      defaults.push({
        name: 'id',
        type: 'bigInt',
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
        interface: 'id',
      });
    }
  }
  if (createdAt) {
    defaults.push({
      name: 'createdAt',
      interface: 'createdAt',
      type: 'date',
      field: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      },
    });
  }
  if (createdBy) {
    defaults.push({
      name: 'createdBy',
      interface: 'createdBy',
      type: 'belongsTo',
      target: 'users',
      foreignKey: 'createdById',
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
    });
  }
  if (updatedAt) {
    defaults.push({
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
    });
  }
  if (updatedBy) {
    defaults.push({
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
    });
  }
  // 其他
  return defaults;
};

const useCreateCategry = () => {
  const form = useForm();
  const { refreshCM } = useCollectionManager();
  const ctx = useActionContext();
  const { refresh } = useResourceActionContext();
  const CategroriesCtx = useContext(CollectionCategroriesContext);
  console.log(CategroriesCtx)
  const api = useAPIClient();

  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      await api.resource('collection_categories').create({
        values: {
          ...values,
        },
      });
      ctx.setVisible(false);
      await form.reset();
      // refresh();
      await CategroriesCtx.refresh();
    },
  };
};

export const AddCategory = (props) => {
  const record = useRecord();
  return <AddCategoryAction item={record} {...props} />;
};

export const AddCategoryAction = (props) => {
  const { scope, getContainer, item: record, children, trigger, align } = props;
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <RecordProvider record={record}>
      <ActionContext.Provider value={{ visible, setVisible }}>
        {children || (
          <Button icon={<PlusOutlined />} type={'primary'} onClick={() => setVisible(true)}>
            {t('Create category')}
          </Button>
        )}
        <SchemaComponent
          schema={collectionCategorySchema}
          components={{ ...components }}
          scope={{
            getContainer,
            useCancelAction,
            createOnly: true,
            useCreateCategry,
            record,
            showReverseFieldConfig: true,
            ...scope,
          }}
        />
      </ActionContext.Provider>
    </RecordProvider>
  );
};
