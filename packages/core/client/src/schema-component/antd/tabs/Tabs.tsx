/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Tabs as AntdTabs, TabPaneProps, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useSchemaInitializerRender } from '../../../application';
import { Icon } from '../../../icon';
import { DndContext, SortableItem } from '../../common';
import { SchemaComponent } from '../../core';
import { useDesigner } from '../../hooks/useDesigner';
import { TabsContextProvider, useTabsContext } from './context';
import { TabsDesigner } from './Tabs.Designer';

export const Tabs: any = observer(
  (props: TabsProps) => {
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
    const contextProps = useTabsContext();
    const { PaneRoot = React.Fragment as React.FC<any> } = contextProps;

    const items = useMemo(() => {
      const result = fieldSchema.mapProperties((schema, key: string) => {
        return {
          key,
          label: <RecursionField name={key} schema={schema} onlyRenderSelf />,
          children: (
            <PaneRoot key={key} {...(PaneRoot !== React.Fragment ? { active: key === contextProps.activeKey } : {})}>
              <SchemaComponent name={key} schema={schema} onlyRenderProperties distributed />
            </PaneRoot>
          ),
        };
      });

      return result;
    }, [fieldSchema.mapProperties((s, key) => key).join()]);

    const activeKey = useMemo(() => {
      if (!contextProps.activeKey) {
        return;
      }

      if (items.every((item) => item.key !== contextProps.activeKey)) {
        return;
      }

      return contextProps.activeKey;
    }, [contextProps.activeKey, items]);

    const onChange = useCallback(
      (key: string) => {
        if (items.some((item) => item.key === key)) {
          contextProps.onChange?.(key);
        }
      },
      [contextProps.onChange, items],
    );

    return (
      <DndContext>
        <TabsContextProvider {...contextProps} onChange={onChange}>
          <AntdTabs
            {...contextProps}
            activeKey={activeKey}
            onChange={onChange}
            destroyInactiveTabPane
            tabBarExtraContent={{
              right: render(),
              left: contextProps?.tabBarExtraContent,
            }}
            style={props.style}
            items={items}
          />
        </TabsContextProvider>
      </DndContext>
    );
  },
  { displayName: 'Tabs' },
);

const designerCss = css`
  position: relative;
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-action-link {
    > .general-schema-designer {
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: var(--colorBgSettingsHover);
    border: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
      }
    }
  }
`;

Tabs.TabPane = observer(
  (props: TabPaneProps & { icon?: any }) => {
    const Designer = useDesigner();
    const field = useField();
    return (
      <SortableItem className={classNames('nb-action-link', designerCss, props.className)}>
        {props.icon && <Icon style={{ marginRight: 2 }} type={props.icon} />} {props.tab || field.title}
        <Designer />
      </SortableItem>
    );
  },
  { displayName: 'Tabs.TabPane' },
);

Tabs.Designer = TabsDesigner;
