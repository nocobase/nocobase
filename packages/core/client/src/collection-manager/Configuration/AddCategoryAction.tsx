import { PlusOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { cloneDeep } from 'lodash';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { ActionContext, SchemaComponent, useActionContext } from '../../schema-component';
import { useCancelAction } from '../action-hooks';
import { CollectionCategroriesContext } from '../context';
import * as components from './components';
import { collectionCategorySchema } from './schemas/collections';

const useCreateCategry = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useContext(CollectionCategroriesContext);
  const api = useAPIClient();
  return {
    async run() {
      await form.submit();
      const values = cloneDeep(form.values);
      await api.resource('collectionCategories').create({
        values: {
          ...values,
        },
      });
      ctx.setVisible(false);
      await form.reset();
      await refresh();
    },
  };
};

export const AddCategory = (props) => {
  return <AddCategoryAction {...props} />;
};

export const AddCategoryAction = (props) => {
  const { scope, getContainer, children } = props;
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <div  onClick={() => setVisible(true)} title={t('Add category')}>
        {children || <PlusOutlined />}
      </div>
      <SchemaComponent
        schema={collectionCategorySchema}
        components={{ ...components }}
        scope={{
          getContainer,
          useCancelAction,
          createOnly: true,
          useCreateCategry,
          ...scope,
        }}
      />
    </ActionContext.Provider>
  );
};
