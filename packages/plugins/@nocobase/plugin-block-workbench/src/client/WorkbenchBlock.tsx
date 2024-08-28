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
  CollectionContext,
  DataSourceContext,
  DndContext,
  useDesignable,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
} from '@nocobase/client';
import { Space } from 'antd';
import React from 'react';

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
            <RecursionField name={key} schema={s} key={key} />
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
        <DataSourceContext.Provider value={undefined}>
          <CollectionContext.Provider value={undefined}>{props.children}</CollectionContext.Provider>
        </DataSourceContext.Provider>
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
