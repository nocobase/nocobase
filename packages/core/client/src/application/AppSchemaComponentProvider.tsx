/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useLocalStorageState } from 'ahooks';
import React from 'react';
import { SchemaComponentProvider } from '../schema-component/core';
import { ISchemaComponentProvider } from '../schema-component/types';

const getKeyByName = (name) => {
  if (!name) {
    return 'nocobase_designable'.toUpperCase();
  }
  return `nocobase_${name}_designable`.toUpperCase();
};

const SchemaComponentProviderWithLocalStorageState: React.FC<ISchemaComponentProvider & { appName?: string }> = (
  props,
) => {
  const [designable, setDesignable] = useLocalStorageState(getKeyByName(props.appName), {
    defaultValue: props.designable ? true : false,
  });
  return (
    <SchemaComponentProvider
      {...props}
      designable={designable}
      onDesignableChange={(value) => {
        setDesignable(value);
      }}
    />
  );
};

export const AppSchemaComponentProvider: React.FC<ISchemaComponentProvider> = (props) => {
  if (typeof props.designable === 'boolean') {
    return <SchemaComponentProvider {...props} />;
  }
  return <SchemaComponentProviderWithLocalStorageState {...props} />;
};
