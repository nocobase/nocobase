import { TabBar } from 'antd-mobile';
import { TabBarItem } from './TabBar.Item';
import React, { useContext } from 'react';
import { SchemaOptionsContext, useFieldSchema } from '@formily/react';
import {
  DndContext,
  Icon,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  SortableItem,
  useDesignable,
} from '@nocobase/client';
import { FormDialog, FormLayout } from '@formily/antd';
import { useTranslation } from '../../../../locale';
import { css, cx } from '@emotion/css';
import { PlusOutlined } from '@ant-design/icons';
import { uid } from '@formily/shared';
import { useHistory, useParams } from 'react-router-dom';

const designerCss = css`
  position: relative;
  &:hover {
    .general-schema-designer {
      display: block;
    }
  }
  .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    border: 0;
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

export const InternalTabBar: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  const { designable } = useDesignable();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { insertBeforeEnd, dn } = useDesignable();
  const history = useHistory();
  const params = useParams<{ name: string }>();

  const onAddTab = () => {
    FormDialog({ title: t('Add tab') }, () => {
      return (
        <SchemaComponentOptions scope={options.scope} components={options.components}>
          <FormLayout layout={'vertical'}>
            <SchemaComponent
              schema={{
                properties: {
                  title: {
                    type: 'string',
                    title: t('Tab title'),
                    required: true,
                    'x-component': 'Input',
                    'x-decorator': 'FormItem',
                  },
                  icon: {
                    required: true,
                    'x-decorator': 'FormItem',
                    'x-component': 'IconPicker',
                    title: t('Icon'),
                    'x-component-props': {},
                  },
                },
              }}
            />
          </FormLayout>
        </SchemaComponentOptions>
      );
    })
      .open({})
      .then(async (values) => {
        await insertBeforeEnd({
          type: 'void',
          'x-component': 'MTabBar.Item',
          'x-component-props': values,
          'x-designer': 'MTabBar.Item.Designer',
          properties: {
            [uid()]: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'MBlockInitializers',
              properties: {},
            },
          },
        });
        dn.refresh();
      });
  };
  return (
    <SortableItem
      className={cx(
        'nb-mobile-tab-bar',
        css`
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        `,
      )}
    >
      <DndContext>
        <TabBar
          activeKey={params.name}
          onChange={(key) => {
            history.push(key);
          }}
          safeArea
          className={cx(
            css`
              width: 100%;
            `,
          )}
        >
          {fieldSchema.mapProperties((schema) => {
            const cp = schema['x-component-props'];
            return (
              <TabBar.Item
                {...cp}
                key={`tab_${schema['x-uid']}`}
                className={cx(designerCss)}
                title={
                  <>
                    {cp.title}
                    <SchemaComponent
                      schema={{
                        properties: {
                          [schema['name']]: schema,
                        },
                      }}
                    />
                  </>
                }
                icon={cp.icon ? <Icon type={cp.icon} /> : undefined}
              ></TabBar.Item>
            );
          })}
        </TabBar>
        {designable ? <SchemaInitializer.Button onClick={onAddTab} icon={<PlusOutlined />} /> : null}
      </DndContext>
    </SortableItem>
  );
};

export const MTabBar = InternalTabBar as unknown as typeof InternalTabBar & {
  Item: typeof TabBarItem;
};

MTabBar.Item = TabBarItem;
MTabBar.displayName = 'MTabBar';
