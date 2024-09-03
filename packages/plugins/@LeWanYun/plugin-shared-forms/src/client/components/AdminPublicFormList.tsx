import { ExtendCollectionsProvider, SchemaComponent, usePlugin } from '@nocobase/client';
import React, { useMemo } from 'react';
import PluginPublicFormsClient from '..';
import { publicFormsCollection } from '../collections';
import { useDeleteActionProps, useEditFormProps, useSubmitActionProps } from '../hooks';
import { publicFormsSchema } from '../schemas';

export const AdminPublicFormList = () => {
  const plugin = usePlugin(PluginPublicFormsClient);
  const formTypes = useMemo(() => plugin.getFormTypeOptions(), [plugin]);
  return (
    <ExtendCollectionsProvider collections={[publicFormsCollection]}>
      <SchemaComponent
        schema={publicFormsSchema}
        scope={{ formTypes, useSubmitActionProps, useEditFormProps, useDeleteActionProps }}
      />
    </ExtendCollectionsProvider>
  );
};
