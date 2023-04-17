import React, { useEffect, useMemo } from 'react';
import { TabBar, TabBarItemProps } from 'antd-mobile';
import { GeneralSchemaDesigner, SchemaSettings, useDesigner } from '@nocobase/client';
import { useTranslation } from '../../../../locale';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { useSchemaPatch } from '../../hooks';

const InternalItem: React.FC<TabBarItemProps> = (props) => {
  // NOTE: nothing to do
  // return <TabBar.Item {...props}></TabBar.Item>;
  const Designer = useDesigner();
  return (
    <>
      <Designer />
    </>
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
        title={t('Edit tab info')}
        initialValues={field.componentProps}
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
              'x-decorator': 'FormItem',
              'x-component': 'IconPicker',
              title: t('Icon'),
              'x-component-props': {},
            },
          },
        }}
        onSubmit={onUpdateComponentProps}
      ></SchemaSettings.ModalItem>
      {tabItems > 1 ? (
        <SchemaSettings.Remove
          key="remove"
          removeParentsIfNoChildren
          confirm={{
            title: t('Delete tab item'),
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
