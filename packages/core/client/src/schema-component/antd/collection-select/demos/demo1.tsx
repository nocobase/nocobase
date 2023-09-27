import { FormItem } from '@formily/antd-v5';
import { CollectionManagerProvider, CollectionSelect, FormProvider, SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { collections } from '../../../../testUtils';

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
      <CollectionManagerProvider collections={collections}>
        <SchemaComponent components={{ FormItem, CollectionSelect }} scope={{ t }} schema={schema} />
      </CollectionManagerProvider>
    </FormProvider>
  );
};
