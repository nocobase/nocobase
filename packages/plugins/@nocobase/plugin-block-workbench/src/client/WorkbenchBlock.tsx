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
  useBlockHeight,
} from '@nocobase/client';
import { css } from '@emotion/css';
import { Space, List, Avatar, theme } from 'antd';
import React, { createContext, useState, useEffect } from 'react';
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
  const [gap, setGap] = useState(8); // 初始 gap 值

  useEffect(() => {
    const calculateGap = () => {
      const container = document.getElementsByClassName('mobile-page-content')[0] as any;
      if (container) {
        const containerWidth = container.offsetWidth - 48;
        const itemWidth = 100; // 每个 item 的宽度
        const itemsPerRow = Math.floor(containerWidth / itemWidth); // 每行能容纳的 item 数
        // 计算实际需要的 gap 值
        const totalItemWidth = itemsPerRow * itemWidth;
        const totalAvailableWidth = containerWidth;
        const totalGapsWidth = totalAvailableWidth - totalItemWidth;

        if (totalGapsWidth > 0) {
          setGap(totalGapsWidth / (itemsPerRow - 1));
        } else {
          setGap(0); // 如果没有足够的空间，则设置 gap 为 0
        }
      }
    };

    window.addEventListener('resize', calculateGap);
    calculateGap(); // 初始化时计算 gap

    return () => {
      window.removeEventListener('resize', calculateGap);
    };
  }, [Object.keys(fieldSchema?.properties || {}).length]);

  return (
    <div style={{ marginBottom: designable ? '1rem' : 0 }} className="nb-action-panel-warp">
      <DndContext>
        {layout === WorkbenchLayout.Grid ? (
          <Space wrap size={gap}>
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
                      font-size: 14px;
                    }
                    .ant-list-item-meta-title button {
                      font-size: 14px;
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
    const targetHeight = useBlockHeight();
    const { token } = theme.useToken();
    const { designable } = useDesignable();

    return (
      <div className="nb-action-penal-container">
        <div
          className={css`
            .nb-action-panel-warp {
              height: ${targetHeight ? targetHeight - (designable ? 4 : 2) * token.marginLG + 'px' : '100%'};
              overflow-y: auto;
              margin-left: -24px;
              margin-right: -24px;
              padding-left: 24px;
              padding-right: 24px;
            }
          `}
        >
          <WorkbenchBlockContext.Provider value={{ layout }}>
            <DataSourceContext.Provider value={undefined}>
              <CollectionContext.Provider value={undefined}>{props.children}</CollectionContext.Provider>
            </DataSourceContext.Provider>
          </WorkbenchBlockContext.Provider>
        </div>
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
