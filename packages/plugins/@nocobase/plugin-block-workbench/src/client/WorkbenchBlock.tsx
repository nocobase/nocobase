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
  useDesignable,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { Space } from 'antd';
import React from 'react';
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
  const { designable } = useDesignable();

  return (
    <div style={{ marginBottom: designable ? '1rem' : 0 }}>
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

export const WorkbenchBlock: any = withDynamicSchemaProps(
  (props) => {
    return (
      <div>
        <SchemaComponentOptions components={{ WorkbenchAction }}>{props.children}</SchemaComponentOptions>
      </div>
    );
  },
  { displayName: 'WorkbenchBlock' },
);

WorkbenchBlock.ActionBar = () => {
  return (
    <>
      <InternalIcons />
      <ConfigureActionsButton />
    </>
  );
};
