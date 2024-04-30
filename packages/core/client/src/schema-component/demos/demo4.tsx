/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentProvider, useSchemaComponentContext } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';

const Test = () => {
  const { designable, setDesignable } = useSchemaComponentContext();
  return (
    <Button
      style={{ marginBottom: 24 }}
      onClick={() => {
        setDesignable(!designable);
      }}
    >
      designable: {designable ? 'true' : 'false'}
    </Button>
  );
};

export default () => {
  return (
    <SchemaComponentProvider designable={false}>
      <Test />
    </SchemaComponentProvider>
  );
};
