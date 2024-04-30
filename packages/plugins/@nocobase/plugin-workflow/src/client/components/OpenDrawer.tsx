/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { useFieldSchema } from '@formily/react';

import { ActionContextProvider, SchemaComponent } from '@nocobase/client';

export default function ({ component = 'div', children, ...props }) {
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  return (
    <ActionContextProvider value={{ visible, setVisible, fieldSchema }}>
      {React.createElement(
        component,
        {
          ...props,
          onClick() {
            setVisible(true);
          },
        },
        children,
      )}
      <SchemaComponent schema={fieldSchema} onlyRenderProperties />
    </ActionContextProvider>
  );
}
