import { useFieldSchema } from '@formily/react';
import React, { createContext } from 'react';
import { useRequest } from '../../../api-client';
import { AssociationFilter } from './AssociationFilter';

export const useAssociationFieldService = (props) => {
  const collectionField = AssociationFilter.useAssociationField();

  const fieldSchema = useFieldSchema();

  const valueKey = collectionField?.targetKey || 'id';
  const labelKey = fieldSchema['x-component-props']?.fieldNames?.label || valueKey;

  const service = useRequest(
    {
      resource: collectionField.target,
      action: 'list',
      params: {
        fields: [labelKey, valueKey],
        pageSize: 200,
        page: 1,
        ...props.params,
      },
    },
    {
      refreshDeps: [labelKey, valueKey],
      debounceWait: 300,
    },
  );

  return service;
};

export type AssociationItemContextValue = {
  service: ReturnType<typeof useRequest>;
};

export const AssociationItemContext = createContext<AssociationItemContextValue>({ service: undefined! });

export const AssociationItemDecorator: React.FC = (props) => {
  const service = useAssociationFieldService(props);

  return <AssociationItemContext.Provider value={{ service }}>{props.children}</AssociationItemContext.Provider>;
};
