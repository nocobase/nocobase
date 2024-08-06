/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { cloneDeep } from 'lodash';
import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAPIClient,
  ActionContextProvider,
  SchemaComponent,
  useActionContext,
  useCancelAction,
  CollectionCategoriesContext,
  CollectionCategory,
  CollectionTemplateTag,
} from '@nocobase/client';
import { collectionCategorySchema } from './schemas/collections';

const useCreateCategry = () => {
  const form = useForm();
  const ctx = useActionContext();
  const { refresh } = useContext(CollectionCategoriesContext);
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
    <ActionContextProvider value={{ visible, setVisible }}>
      <div onClick={() => setVisible(true)} title={t('Add category')}>
        {children || <PlusOutlined />}
      </div>
      <SchemaComponent
        schema={collectionCategorySchema}
        components={{ CollectionCategory, CollectionTemplateTag }}
        scope={{
          getContainer,
          useCancelAction,
          createOnly: true,
          useCreateCategry,
          ...scope,
        }}
      />
    </ActionContextProvider>
  );
};
