import { SchemaSettings, useDesignable } from '@nocobase/client';
import React from 'react';
import { generateNTemplate, useTranslation } from '../../../../locale';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useHistory } from 'react-router-dom';
import { findSchema } from '../../helpers';
import { Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

export const ContainerDesigner = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const tabBarSchema = fieldSchema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'MTabBar' && next),
  ) as Schema;

  const history = useHistory();

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
            borderColor: 'rgb(241, 139, 98)',
            color: 'rgb(241, 139, 98)',
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
            const pageSchema = findSchema(tabBarSchema.properties[Object.keys(tabBarSchema.properties)[0]], 'MPage');
            if (!pageSchema) return;
            await dn.remove(tabBarSchema);
            await dn.insertBeforeEnd(pageSchema, {
              onSuccess() {
                history.push('../');
              },
            });
          }
        }}
      />
    </SchemaSettings>
  );
};
