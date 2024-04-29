import { Action, useAPIClient, useRequest } from '@nocobase/client';
import React from 'react';
import { useFieldSchema } from '@formily/react';
import { listByCurrentRoleUrl } from '../constants';
import { useCustomizeRequestActionProps } from '../hooks';
import { CustomRequestActionDesigner } from './CustomRequestActionDesigner';

export const CustomRequestActionACLDecorator = (props) => {
  const apiClient = useAPIClient();
  const isRoot = apiClient.auth.role === 'root';
  const fieldSchema = useFieldSchema();
  const { data } = useRequest<{ data: string[] }>(
    {
      url: listByCurrentRoleUrl,
    },
    {
      manual: isRoot,
      cacheKey: listByCurrentRoleUrl,
    },
  );

  if (!isRoot && !data?.data?.includes(fieldSchema?.['x-uid'])) {
    return null;
  }

  return props.children;
};

const components = {
  'customize:table:request': Action.Link,
};

export const CustomRequestAction = (props) => {
  const fieldSchema = useFieldSchema();
  const xAction = fieldSchema['x-action'];
  const Component = components[xAction] || Action;
  return <Component {...props} useProps={useCustomizeRequestActionProps}></Component>;
};

CustomRequestAction.Designer = CustomRequestActionDesigner;
CustomRequestAction.Decorator = CustomRequestActionACLDecorator;
