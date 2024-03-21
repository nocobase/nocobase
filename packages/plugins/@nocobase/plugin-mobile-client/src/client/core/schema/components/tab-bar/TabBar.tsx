import { useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import {
  css,
  cx,
  DndContext,
  Icon,
  SchemaComponent,
  SchemaInitializerActionModal,
  SortableItem,
  useCompile,
  useDesignable,
} from '@nocobase/client';
import { TabBar } from 'antd-mobile';
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../../../locale';
import { PageSchema } from '../../common';
import { tabItemSchema } from './schema';
import { TabBarItem } from './TabBar.Item';

export const InternalTabBar: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  const { designable } = useDesignable();
  const { t } = useTranslation();
  const { insertBeforeEnd } = useDesignable();
  const navigate = useNavigate();
  const params = useParams<{ name: string }>();
  const compile = useCompile();

  const onAddTab = useCallback((values: any) => {
    return insertBeforeEnd({
      type: 'void',
      'x-component': 'MTabBar.Item',
      'x-component-props': values,
      'x-designer': 'MTabBar.Item.Designer',
      properties: {
        [uid()]: PageSchema,
      },
      'x-server-hooks': [
        {
          type: 'onSelfSave',
          method: 'extractTextToLocale',
        },
      ],
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
            navigate(`/mobile/${key}`);
          }}
          safeArea
          className={cx(css`
            width: 100%;
          `)}
        >
          {fieldSchema.mapProperties((schema, name) => {
            const cp = schema['x-component-props'];
            return (
              <TabBar.Item
                {...cp}
                key={`tab_${schema['x-uid']}`}
                title={
                  <>
                    {t(compile(cp.title))}
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
              icon={<SchemaInitializerActionModal title={t('Add tab')} onSubmit={onAddTab} schema={tabItemSchema} />}
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
