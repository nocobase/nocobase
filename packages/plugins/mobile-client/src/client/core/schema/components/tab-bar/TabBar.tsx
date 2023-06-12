import { TabBar } from 'antd-mobile';
import { TabBarItem } from './TabBar.Item';
import React, { useCallback, useContext } from 'react';
import { SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { DndContext, Icon, SchemaComponent, SchemaInitializer, SortableItem, useDesignable } from '@nocobase/client';
import { useTranslation } from '../../../../locale';
import { css, cx } from '@emotion/css';
import { uid } from '@formily/shared';
import { useHistory, useParams } from 'react-router-dom';
import { tabItemSchema } from './schema';

export const InternalTabBar: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  const { designable } = useDesignable();
  const { t } = useTranslation();
  const { insertBeforeEnd } = useDesignable();
  const history = useHistory();
  const params = useParams<{ name: string }>();

  const onAddTab = useCallback((values: any) => {
    return insertBeforeEnd({
      type: 'void',
      'x-component': 'MTabBar.Item',
      'x-component-props': values,
      'x-designer': 'MTabBar.Item.Designer',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'MPage',
          'x-designer': 'MPage.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'MBlockInitializers',
              'x-component-props': {
                showDivider: false,
              },
            },
          },
        },
      },
    });
  }, []);

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
            if (key === 'add-tab') {
              return;
            }
            history.push(key);
          }}
          safeArea
          className={cx(
            css`
              width: 100%;
            `,
          )}
        >
          {fieldSchema.mapProperties((schema, name) => {
            const cp = schema['x-component-props'];
            return (
              <TabBar.Item
                {...cp}
                key={`tab_${schema['x-uid']}`}
                title={
                  <>
                    {cp.title}
                    <SchemaComponent schema={schema} name={name} />
                  </>
                }
                icon={cp.icon ? <Icon type={cp.icon} /> : undefined}
              ></TabBar.Item>
            );
          })}
          {designable && (!fieldSchema.properties || Object.keys(fieldSchema.properties).length < 5) ? (
            <TabBar.Item
              className={css`
                .adm-tab-bar-item-icon {
                  height: auto;
                }
              `}
              icon={<SchemaInitializer.ActionModal title={t('Add tab')} onSubmit={onAddTab} schema={tabItemSchema} />}
              key="add-tab"
            ></TabBar.Item>
          ) : null}
        </TabBar>
      </DndContext>
    </SortableItem>
  );
};

export const MTabBar = InternalTabBar as unknown as typeof InternalTabBar & {
  Item: typeof TabBarItem;
};

MTabBar.Item = TabBarItem;
MTabBar.displayName = 'MTabBar';
