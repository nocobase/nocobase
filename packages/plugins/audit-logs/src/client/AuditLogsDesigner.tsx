import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  SchemaSettings,
  useCollection,
  useDesignable,
  useResourceActionContext
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const AuditLogsDesigner = () => {
  const { name, title } = useCollection();
  const field = useField();
  const fieldSchema = useFieldSchema();
  // const dataSource = useCollectionFilterOptions(name);
  const ctx = useResourceActionContext();
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const defaultFilter = fieldSchema?.['x-decorator-props']?.request?.params?.filter || {};

  return (
    <GeneralSchemaDesigner title={t('Audit logs')}>
      <SchemaSettings.Divider />
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </GeneralSchemaDesigner>
  );
};
