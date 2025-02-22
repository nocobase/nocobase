/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Action, useAPIClient, useRequest, withDynamicSchemaProps, ACLActionProvider } from '@nocobase/client';
import React from 'react';
import { useFieldSchema } from '@formily/react';
import { listByCurrentRoleUrl } from '../constants';
import { useCustomizeRequestActionProps } from '../hooks';
import { CustomRequestActionDesigner } from './CustomRequestActionDesigner';

export const CustomRequestActionACLDecorator = (props) => {
  const apiClient = useAPIClient();
  // const isRoot = apiClient.auth.role === 'root';
  // const fieldSchema = useFieldSchema();
  // const { data } = useRequest<{ data: string[] }>(
  //   {
  //     url: listByCurrentRoleUrl,
  //   },
  //   {
  //     manual: isRoot,
  //     cacheKey: listByCurrentRoleUrl,
  //   },
  // );

  // // if (!isRoot && !data?.data?.includes(fieldSchema?.['x-uid'])) {
  // //   return null;
  // // }

  return <ACLActionProvider>{props.children}</ACLActionProvider>;
};

const components = {
  'customize:table:request': Action.Link,
};

export const CustomRequestAction: React.FC<any> & {
  [key: string]: any;
} = withDynamicSchemaProps((props) => {
  const fieldSchema = useFieldSchema();
  const xAction = fieldSchema['x-action'];
  const Component = components[xAction] || Action;
  return <Component {...props} useProps={useCustomizeRequestActionProps}></Component>;
});

CustomRequestAction.Designer = CustomRequestActionDesigner;
CustomRequestAction.Decorator = CustomRequestActionACLDecorator;
