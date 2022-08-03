import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { TabPaneProps, Tabs as AntdTabs, TabsProps } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { Icon } from '../../../icon';
import { useSchemaInitializer } from '../../../schema-initializer';
import { DndContext, SortableItem } from '../../common';
import { useDesigner } from '../../hooks/useDesigner';
import { TabsDesigner } from './Tabs.Designer';

export const Tabs: any = observer((props: TabsProps) => {
  const fieldSchema = useFieldSchema();
  const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
  return (
    <DndContext>
      <AntdTabs
        tabBarExtraContent={{
          right: render(),
        }}
      >
        {fieldSchema.mapProperties((schema, key) => {
          return (
            <AntdTabs.TabPane tab={<RecursionField name={key} schema={schema} onlyRenderSelf />} key={key}>
              <RecursionField name={key} schema={schema} onlyRenderProperties />
            </AntdTabs.TabPane>
          );
        })}
      </AntdTabs>
    </DndContext>
  );
});

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
    background: rgba(241, 139, 98, 0.06);
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
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

Tabs.TabPane = observer((props: TabPaneProps & { icon?: any }) => {
  const Designer = useDesigner();
  const field = useField();
  return (
    <SortableItem className={classNames('nb-action-link', designerCss, props.className)}>
      {props.icon && <Icon style={{ marginRight: 2 }} type={props.icon} />} {props.tab || field.title}
      <Designer />
    </SortableItem>
  );
});

Tabs.Designer = TabsDesigner;
