/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, useFieldSchema } from '@formily/react';
import {
  CollectionContext,
  DataSourceContext,
  DndContext,
  Icon,
  NocoBaseRecursionField,
  useBlockHeight,
  useDesignable,
  useSchemaInitializerRender,
  withDynamicSchemaProps,
  useBlockHeightProps,
  useOpenModeContext,
} from '@nocobase/client';
import { Avatar, List, Space, theme } from 'antd';
import React, { createContext, useEffect, useState, useRef, useMemo, useLayoutEffect } from 'react';
import { WorkbenchLayout } from './workbenchBlockSettings';

const ConfigureActionsButton = observer(
  () => {
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer']);
    return render();
  },
  { displayName: 'WorkbenchConfigureActionsButton' },
);

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

const ResponsiveSpace = () => {
  const fieldSchema = useFieldSchema();
  const isMobileMedia = isMobile();
  const { isMobile: underMobileCtx } = useOpenModeContext() || {};

  const { itemsPerRow = 4 } = fieldSchema.parent['x-decorator-props'] || {};

  const containerRef = useRef(null); // 引用容器
  const [containerWidth, setContainerWidth] = useState(0); // 容器宽度
  const gap = 8;
  // 使用 ResizeObserver 动态获取容器宽度
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth); // 更新宽度
      }
    };
    // 初始化 ResizeObserver
    const resizeObserver = new ResizeObserver(handleResize);

    // 监听容器宽度变化
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      handleResize(); // 初始化时获取一次宽度
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width); // 更新宽度
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.unobserve(containerRef.current);
    };
  }, []);

  // 计算每个元素的宽度
  const itemWidth = useMemo(() => {
    const totalGapWidth = gap * itemsPerRow;
    const availableWidth = containerWidth - totalGapWidth;
    return availableWidth / itemsPerRow;
  }, [itemsPerRow, gap, containerWidth]);

  // 计算 Avatar 的宽度
  const avatarSize = useMemo(() => {
    return isMobileMedia || underMobileCtx ? Math.floor(itemWidth * 0.8) : 54; // Avatar 大小为 item 宽度的 60%
  }, [itemWidth, itemsPerRow, containerWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Space
        wrap
        style={{ width: '100%', display: 'flex' }}
        size={gap}
        align="start"
        className={css`
          .ant-space-item {
            width: ${itemWidth}px;
            display: flex;
            .ant-nb-action {
              padding: 4px 0px;
            }
            .nb-action-panel-container {
              width: ${itemWidth}px !important;
            }
            .ant-avatar-circle {
              width: ${avatarSize}px !important;
              height: ${avatarSize}px !important;
              line-height: ${avatarSize}px !important;
            }
          }
        `}
      >
        {fieldSchema.mapProperties((s, key) => (
          <div
            key={key}
            style={{
              flexBasis: `${itemWidth}px`,
              flexShrink: 0,
              flexGrow: 0,
              display: 'flex',
            }}
          >
            <NocoBaseRecursionField name={key} schema={s} />
          </div>
        ))}
      </Space>
    </div>
  );
};

const InternalIcons = () => {
  const fieldSchema = useFieldSchema();
  const { layout = WorkbenchLayout.Grid } = fieldSchema.parent['x-component-props'] || {};
  return (
    <div className="nb-action-panel-warp">
      <DndContext>
        {layout === WorkbenchLayout.Grid ? (
          <ResponsiveSpace />
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
                      margin: 0 0 0 0;
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
                    title={<NocoBaseRecursionField name={key} schema={s} key={key} />}
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
    const { heightProps } = useBlockHeightProps() || {};
    const { titleHeight } = heightProps || {};
    const internalHeight = 2 * token.paddingLG + token.controlHeight + token.marginLG + titleHeight;
    return (
      <div className="nb-action-penal-container">
        <div
          className={css`
            .nb-action-panel-warp {
              height: ${targetHeight
                ? targetHeight -
                  (designable ? internalHeight : 2 * token.paddingLG + token.marginLG + titleHeight) +
                  'px'
                : '100%'};
              overflow-y: auto;
              margin-left: -24px;
              margin-right: -24px;
              padding-left: 24px;
              padding-right: 24px;
              margin-top: 0.5rem;
              margin-bottom: 0.5rem;
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
