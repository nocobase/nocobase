import { useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider';
import { useCollection } from '../../../collection-manager';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';
import { useDesignable } from '../../hooks';
import { useActionContext } from '../action';

export const FormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  const ctx = useFormBlockContext();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = useTranslation();
  const { visible } = useActionContext();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      {/* <SchemaSettings.Template componentName={'FormItem'} collectionName={name} /> */}
      <SchemaSettings.FormItemTemplate componentName={'FormItem'} collectionName={name} />
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

export const ReadPrettyFormDesigner = () => {
  const { name, title } = useCollection();
  const template = useSchemaTemplate();
  return (
    <GeneralSchemaDesigner template={template} title={title || name}>
      {/* <SchemaSettings.Template componentName={'ReadPrettyForm'} collectionName={name} /> */}
      <SchemaSettings.FormItemTemplate
        insertAdjacentPosition={'beforeEnd'}
        componentName={'ReadPrettyFormItem'}
        collectionName={name}
      />
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
