/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import React from 'react';
import { SchemaToolbar } from '../../schema-settings/GeneralSchemaDesigner';

export const ActionSchemaToolbar = (props) => {
  const fieldSchema = useFieldSchema();
  console.log(props);
  return (
    <SchemaToolbar
      initializer={false}
      showBorder={false}
      showBackground
      {...props}
      {...fieldSchema['x-toolbar-props']}
    />
  );
};
