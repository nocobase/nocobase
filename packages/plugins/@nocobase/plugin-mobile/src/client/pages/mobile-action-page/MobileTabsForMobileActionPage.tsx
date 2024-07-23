/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import {
  css,
  DndContext,
  Icon,
  SchemaComponent,
  SortableItem,
  Tabs as TabsOfPC,
  useBackButton,
  useDesigner,
  useSchemaInitializerRender,
  useTabsContext,
} from '@nocobase/client';
import { Tabs } from 'antd-mobile';
import { LeftOutline } from 'antd-mobile-icons';
import classNames from 'classnames';
import React, { useMemo, useRef } from 'react';
import { MobilePageHeader } from '../dynamic-page';
import { MobilePageContentContainer } from '../dynamic-page/content/MobilePageContentContainer';
import { useStyles } from '../dynamic-page/header/tabs';
import { useMobileTabsForMobileActionPageStyle } from './MobileTabsForMobileActionPage.style';

export const MobileTabsForMobileActionPage: any = observer(
  (props) => {
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
    const { activeKey, onChange } = useTabsContext() || {};
    const { styles } = useStyles();
    const { styles: mobileTabsForMobileActionPageStyle } = useMobileTabsForMobileActionPageStyle();
    const { goBack } = useBackButton();
    const keyToTabRef = useRef({});

    const items = useMemo(() => {
      const result = fieldSchema.mapProperties((schema, key) => {
        keyToTabRef.current[key] = <SchemaComponent name={key} schema={schema} onlyRenderProperties distributed />;
        return <Tabs.Tab title={<RecursionField name={key} schema={schema} onlyRenderSelf />} key={key}></Tabs.Tab>;
      });

      return result;
    }, [fieldSchema.mapProperties((s, key) => key).join()]);

    const tabContent = useMemo(() => {
      const list = fieldSchema.mapProperties((schema, key) => {
        schema = hideDivider(schema);
        return {
          key,
          node: <SchemaComponent name={key} schema={schema} onlyRenderProperties distributed />,
        };
      });

      if (!activeKey) {
        return list[0]?.node;
      }

      return list.find((item) => item.key === activeKey)?.node;
    }, [activeKey, fieldSchema]);

    return (
      <>
        <MobilePageHeader>
          <div className={styles.mobilePageTabs} data-testid="mobile-action-page-tabs">
            <div className={mobileTabsForMobileActionPageStyle.backButton} onClick={goBack}>
              <LeftOutline />
            </div>
            <DndContext>
              <Tabs activeKey={activeKey} onChange={onChange} className={styles.mobilePageTabsList}>
                {items}
              </Tabs>
            </DndContext>
            <div className={mobileTabsForMobileActionPageStyle.container}>{render()}</div>
          </div>
        </MobilePageHeader>
        <MobilePageContentContainer hideTabBar>{tabContent}</MobilePageContentContainer>
      </>
    );
  },
  { displayName: 'MobileTabsForMobileActionPage' },
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

MobileTabsForMobileActionPage.TabPane = observer(
  (props: any) => {
    const Designer = useDesigner();
    const field = useField();
    return (
      <SortableItem className={classNames('nb-action-link', designerCss, props.className)}>
        {props.icon && <Icon style={{ marginRight: 2 }} type={props.icon} />} {props.tab || field.title}
        <Designer />
      </SortableItem>
    );
  },
  { displayName: 'MobileTabsForMobileActionPage.TabPane' },
);

MobileTabsForMobileActionPage.Designer = TabsOfPC.Designer;

// 隐藏 Grid 组件的左右 divider，因为移动端不需要在一行中并列展示两个区块
function hideDivider(tabPaneSchema: Schema) {
  tabPaneSchema?.mapProperties((schema) => {
    if (schema['x-component'] === 'Grid') {
      schema['x-component-props'] = {
        ...schema['x-component-props'],
        showDivider: false,
      };
    }
  });

  return tabPaneSchema;
}
