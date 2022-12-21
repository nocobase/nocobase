import { Schema, useFieldSchema } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { createDesignable, SchemaComponentContext, useDesignable } from '../../schema-component';
import { ActionInitializer } from './ActionInitializer';

export const AssociationFieldsFilterActionInitializer = (props) => {
  const { refresh } = useContext(SchemaComponentContext);
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh, current: fieldSchema });
  dn.loadAPIClientEvents();

  const handleInsert = (s: Schema) => {
    dn.insertBeforeBegin(s);
  };

  const schema = {
    type: 'void',
    'x-action': 'associateFilter',
    // 'x-designer': 'AssociationFieldsFilter.Designer',
    'x-initializer': 'AssociationFieldsFilterInitializer',
    'x-component': 'AssociationFieldsFilter',
    properties: {},
  };

  const newProps = {
    ...props,
    insert: handleInsert,
    wrap: (s) => s,
  };

  return <ActionInitializer {...newProps} schema={schema} />;
};
