/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import React, { FC } from 'react';

import { useSchemaInitializerItem } from '../../../application';
import { InitializerWithSwitch } from '../../../schema-initializer/items/InitializerWithSwitch';

interface TableCollectionFieldInitializerProps {
  /**
   * 被创建的字段的 schema
   */
  schema?: ISchema;
}

export const TableCollectionFieldInitializer: FC<TableCollectionFieldInitializerProps> = (props) => {
  const schema: ISchema = {};
  const itemConfig = useSchemaInitializerItem();
  return (
    <InitializerWithSwitch
      {...itemConfig}
      schema={props.schema || schema}
      item={itemConfig}
      type={'x-collection-field'}
    />
  );
};
