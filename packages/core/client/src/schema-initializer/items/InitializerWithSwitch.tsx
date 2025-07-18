/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { merge } from '@formily/shared';
import React from 'react';

import { useUpdate } from 'ahooks';
import { SchemaInitializerSwitch, useSchemaInitializer } from '../../application';
import { useCurrentSchema } from '../utils';

export const InitializerWithSwitch = (props) => {
  const { type, schema, item, remove: passInRemove, disabled: propsDisabled } = props;
  const {
    exists,
    remove,
    schema: currentSchema,
  } = useCurrentSchema(
    schema?.[type] || item?.schema?.[type],
    type,
    item.find,
    passInRemove ?? item.remove,
    schema?.name || item?.schema?.name,
  );
  const { insert } = useSchemaInitializer();
  const update = useUpdate();
  const isInTemplate = !!currentSchema?.['x-template-uid'];
  const disabled = propsDisabled || isInTemplate;
  return (
    <SchemaInitializerSwitch
      checked={exists}
      disabled={disabled}
      title={item.title}
      onClick={() => {
        if (disabled) {
          return;
        }
        if (exists) {
          remove();
          return update();
        }
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
        update();
      }}
    />
  );
};
