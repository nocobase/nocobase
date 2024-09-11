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
  Icon,
} from '@nocobase/client';
import { css, cx } from '@emotion/css';
import { Space, List, Avatar } from 'antd';
import React, { createContext } from 'react';
import { WorkbenchLayout } from './workbenchBlockSettings';

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
  const { layout = WorkbenchLayout.Grid } = fieldSchema.parent['x-component-props'] || {};
  return (
    <div style={{ marginBottom: designable ? '1rem' : 0 }}>
      <DndContext>
        {layout === WorkbenchLayout.Grid ? (
          <Space wrap>
            {fieldSchema.mapProperties((s, key) => (
              <RecursionField name={key} schema={s} key={key} />
            ))}
          </Space>
        ) : (
          <List itemLayout="horizontal">
            {fieldSchema.mapProperties((s, key) => {
              const icon = s['x-component-props']?.['icon'];
              const backgroundColor = s['x-component-props']?.['iconColor'];
              return (
                <List.Item
                  key={key}
                  className={css`
                    .ant-list-item-meta-avatar {
                      margin-inline-end: 0px !important;
                    }
                    .ant-list-item-meta-title {
                      overflow: hidden;
                      text-overflow: ellipsis;
                    }
                    .ant-list-item-meta-title button {
                      font-weight: 700;
                      font-size: 16px;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      width: 100%;
                      text-align: left;
                    }
                  `}
                >
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor }} icon={<Icon type={icon} />} />}
                    title={<RecursionField name={key} schema={s} key={key} />}
                  ></List.Item.Meta>
                </List.Item>
              );
            })}
          </List>
        )}
      </DndContext>
    </div>
  );
};

export const WorkbenchBlockContext = createContext({ layout: 'grid' });

export const WorkbenchBlock: any = withDynamicSchemaProps(
  (props) => {
    const fieldSchema = useFieldSchema();
    const { layout = 'grid' } = fieldSchema['x-component-props'] || {};

    return (
      <WorkbenchBlockContext.Provider value={{ layout }}>
        <DataSourceContext.Provider value={undefined}>
          <CollectionContext.Provider value={undefined}>{props.children}</CollectionContext.Provider>
        </DataSourceContext.Provider>
      </WorkbenchBlockContext.Provider>
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
