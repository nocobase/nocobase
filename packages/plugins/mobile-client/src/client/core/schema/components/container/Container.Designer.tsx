import { MenuOutlined } from '@ant-design/icons';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaSettings, useDesignable } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNTemplate, useTranslation } from '../../../../locale';
import { PageSchema } from '../../common';
import { findSchema } from '../../helpers';

export const ContainerDesigner = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const tabBarSchema = fieldSchema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'MTabBar' && next),
  ) as Schema;

  const navigate = useNavigate();

  const field = useField();
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  return (
    <SchemaSettings
      title={
        <Button
          style={{
            borderColor: 'var(--colorSettings)',
            color: 'var(--colorSettings)',
            width: '100%',
          }}
          icon={<MenuOutlined />}
          type="dashed"
        >
          {t('App level Configuration')}
        </Button>
      }
      {...schemaSettingsProps}
    >
      <SchemaSettings.SwitchItem
        checked={!!tabBarSchema}
        title={t('Enable TabBar')}
        onChange={async (v) => {
          if (v) {
            const pageSchema = findSchema(fieldSchema, 'MPage');
            if (!pageSchema) return;
            await dn.remove(pageSchema);
            await dn.insertBeforeEnd({
              type: 'void',
              'x-component': 'MTabBar',
              'x-component-props': {},
              name: 'tabBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'MTabBar.Item',
                  'x-designer': 'MTabBar.Item.Designer',
                  'x-component-props': {
                    icon: 'HomeOutlined',
                    title: generateNTemplate('Untitled'),
                  },
                  properties: {
                    page: pageSchema.toJSON(),
                  },
                },
              },
            });
          } else {
            const tabBarSchemaFirstKey = Object.keys(tabBarSchema.properties || {})?.[0];
            const pageSchema = tabBarSchemaFirstKey
              ? findSchema(tabBarSchema.properties[tabBarSchemaFirstKey], 'MPage')
              : null;
            await dn.remove(tabBarSchema);
            await dn.insertBeforeEnd(pageSchema || PageSchema, {
              onSuccess() {
                navigate('../');
              },
            });
          }
        }}
      />
    </SchemaSettings>
  );
};
