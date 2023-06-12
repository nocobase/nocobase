import React, { useEffect, useMemo } from 'react';
import { TabBar, TabBarItemProps } from 'antd-mobile';
import { GeneralSchemaDesigner, SchemaSettings, SortableItem, useDesigner } from '@nocobase/client';
import { useTranslation } from '../../../../locale';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { useSchemaPatch } from '../../hooks';
import { css, cx } from '@emotion/css';
import { tabItemSchema } from './schema';

const InternalItem: React.FC<TabBarItemProps> = () => {
  // NOTE: nothing to do
  // return <TabBar.Item {...props}></TabBar.Item>;
  const Designer = useDesigner();
  return (
    <SortableItem
      className={cx(
        'nb-mobile-tab-bar-item',
        css`
          position: absolute !important;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        `,
      )}
    >
      <Designer />
    </SortableItem>
  );
};

export const Designer = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { onUpdateComponentProps } = useSchemaPatch();
  const field = useField();
  const tabItems = Object.keys(fieldSchema.parent.properties).length;

  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.ModalItem
        title={t('Edit info')}
        initialValues={field.componentProps}
        schema={tabItemSchema}
        onSubmit={onUpdateComponentProps}
      ></SchemaSettings.ModalItem>
      {tabItems > 1 ? (
        <SchemaSettings.Remove
          key="remove"
          removeParentsIfNoChildren
          confirm={{
            title: t('Delete tab item?'),
          }}
          breakRemoveOn={{
            'x-component': 'MTabBar',
          }}
        ></SchemaSettings.Remove>
      ) : null}
    </GeneralSchemaDesigner>
  );
};

export const TabBarItem = InternalItem as unknown as typeof InternalItem & {
  Designer: typeof Designer;
};

TabBarItem.Designer = Designer;
