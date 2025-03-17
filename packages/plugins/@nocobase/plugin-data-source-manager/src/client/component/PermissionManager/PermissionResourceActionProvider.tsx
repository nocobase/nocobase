/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useContext } from 'react';
import { ResourceActionProvider, useRecord } from '@nocobase/client';
import { CurrentDataSourceKey } from './PermisionProvider';

export const PermissionResourceActionProvider = (props) => {
  const { dataSourceKey } = useContext(CurrentDataSourceKey);
  const record = useRecord();
  console.log(props, record.key, dataSourceKey);

  // 创建一个新的请求对象，并添加 dataSourceKey
  const modifiedRequest = {
    ...props.request,
    params: {
      ...props.request.params,
      filter: {
        ...props.request.params.filter,
        dataSourceKey, // 添加 dataSourceKey 到 filter
      },
    },
  };

  return (
    <ResourceActionProvider {...props} request={modifiedRequest}>
      {props.children}
    </ResourceActionProvider>
  );
};
