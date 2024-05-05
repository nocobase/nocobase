/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ResourceActionProvider, useRecord } from '@nocobase/client';

export const ExecutionResourceProvider = ({ request, filter = {}, ...others }) => {
  const workflow = useRecord();
  const props = {
    ...others,
    request: {
      ...request,
      params: {
        ...request?.params,
        filter: {
          ...request?.params?.filter,
          key: workflow.key,
        },
      },
    },
  };

  return <ResourceActionProvider {...props} />;
};
