import { PlusOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { Button } from 'antd';
import { cloneDeep } from 'lodash';
import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { RecordProvider, useRecord } from '../../record-provider';
import { ActionContext, SchemaComponent, useActionContext } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import * as components from './components';
import { collectionCategorySchema } from './schemas/collections';
import { CollectionCategroriesContext } from '../context';

const useCreateCategry = () => {
  const form = useForm();
  const ctx = useActionContext();
  const CategroriesCtx = useContext(CollectionCategroriesContext);
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
      await CategroriesCtx.refresh();
    },
  };
};

export const AddCategory = (props) => {
  const record = useRecord();
  return <AddCategoryAction item={record} {...props} />;
};

export const AddCategoryAction = (props) => {
  const { scope, getContainer, item: record, children } = props;
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
