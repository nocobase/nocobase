import React, { useContext } from 'react';
import { useFieldSchema } from '@formily/react';
import { SchemaInitializer } from '../../../schema-initializer/SchemaInitializer';
import { createDesignable, SchemaComponentContext } from '../..';
import { useAPIClient } from '../../../api-client';
import { useTranslation } from 'react-i18next';

export const AssociationFilterDesignerDelete = (props) => {
  const { refresh } = useContext(SchemaComponentContext);
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh, current: fieldSchema });
  dn.loadAPIClientEvents();

  const handleClick = () => {
    dn.remove(fieldSchema);
  };

  return (
    <SchemaInitializer.Item onClick={handleClick}>
      <div>{props.title}</div>
    </SchemaInitializer.Item>
  );
};
