import { FormItem } from '@formily/antd-v5';
import { ExtendCollectionsProvider, CollectionSelect, FormProvider, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

const collections = [];

const schema = {
  type: 'object',
  properties: {
    select: {
      type: 'string',
      title: 'Collection',
      'x-decorator': 'FormItem',
      'x-component': 'CollectionSelect',
    },
  },
};

export default () => {
  const { t } = useTranslation();

  return (
    <FormProvider>
      <ExtendCollectionsProvider collections={collections as any}>
        <SchemaComponent components={{ FormItem, CollectionSelect }} scope={{ t }} schema={schema} />
      </ExtendCollectionsProvider>
    </FormProvider>
  );
};
