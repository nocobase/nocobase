import { ShareAltOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Tabs as AntdTabs, App, Button, Space, TabPaneProps, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCollection } from '../../../collection-manager';
import { Icon } from '../../../icon';
import { useRecord } from '../../../record-provider';
import { useSchemaInitializer } from '../../../schema-initializer';
import { DndContext, SortableItem } from '../../common';
import { useDesignable } from '../../hooks';
import { useDesigner } from '../../hooks/useDesigner';
import { useTabsContext } from './context';
import { TabsDesigner } from './Tabs.Designer';

const getSubAppName = () => {
  const match = window.location.pathname.match(/^\/apps\/([^/]*)\/?/);
  if (!match) {
    return '';
  }
  return match[1];
};

export const Tabs: any = observer(
  (props: TabsProps) => {
    const { message } = App.useApp();
    const fieldSchema = useFieldSchema();
    const { render } = useSchemaInitializer(fieldSchema['x-initializer']);
    const { designable } = useDesignable();
    const contextProps = useTabsContext();
    const { PaneRoot = React.Fragment as React.FC<any> } = contextProps;

    const record = useRecord();
    const params = useParams();
    const collection = useCollection();

    const items = useMemo(() => {
      const result = fieldSchema.mapProperties((schema, key: string) => {
        return {
          key,
          label: <RecursionField name={key} schema={schema} onlyRenderSelf />,
          children: (
            <PaneRoot {...(PaneRoot !== React.Fragment ? { active: key === contextProps.activeKey } : {})}>
              <RecursionField name={key} schema={schema} onlyRenderProperties />
            </PaneRoot>
          ),
        };
      });

      return result;
    }, [fieldSchema.mapProperties((s, key) => key).join()]);

    return (
      <DndContext>
        <AntdTabs
          {...contextProps}
          destroyInactiveTabPane
          tabBarExtraContent={
            <Space>
              {render()}
              {!params.popupId && (
                <Button
                  onClick={() => {
                    if (params['*']) {
                      return;
                    }
                    const app = getSubAppName();
                    const url = `${location.protocol}//${location.host}/${app ? `/apps/${app}` : ''}admin/${
                      params.name
                    }/popups/${fieldSchema.parent['x-uid']}/records/${collection.name}${
                      record.id ? `/${record.id}` : ''
                    }`;
                    navigator.clipboard.writeText(url);
                    message.success('Copied');
                  }}
                  icon={<ShareAltOutlined />}
                >
                  Share
                </Button>
              )}
            </Space>
          }
          style={props.style}
          items={items}
        />
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
