/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RecursionField, observer, useFieldSchema } from '@formily/react';
import {
  DndContext,
  SchemaComponentOptions,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { Space } from 'antd';
import React, { FC } from 'react';
import { WorkbenchAction } from './WorkbenchAction';

const ConfigureActionsButton = observer(
  () => {
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
    return render();
  },
  { displayName: 'WorkbenchConfigureActionsButton' },
);

const InternalIcons = () => {
  const fieldSchema = useFieldSchema();

  return (
    <div style={{ marginBottom: '1rem' }}>
      <DndContext>
        <Space wrap>
          {fieldSchema.mapProperties((s, key) => (
            <RecursionField name={key} schema={s} />
          ))}
        </Space>
      </DndContext>
    </div>
  );
};

export const WorkbenchBlock: FC<{ height?: number }> = withDynamicSchemaProps(
  (props) => {
    return (
      <div>
        <SchemaComponentOptions components={{ WorkbenchAction }}>
          <InternalIcons />
          <ConfigureActionsButton />
        </SchemaComponentOptions>
      </div>
    );
  },
  { displayName: 'WorkbenchBlock' },
);
