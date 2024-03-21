import { MenuOutlined } from '@ant-design/icons';
import { useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaSettingsDropdown, SchemaSettingsSwitchItem, useDesignable } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { generateNTemplate, useTranslation } from '../../../../locale';
import { findSchema } from '../../helpers';
import { useSchemaPatch } from '../../hooks';

export const ContainerDesigner = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { onUpdateComponentProps } = useSchemaPatch();

  const field = useField();
  const { dn } = useDesignable();
  const navigate = useNavigate();

  const tabBarSchema = findSchema(fieldSchema, 'MTabBar');
  const tabBarEnabled = tabBarSchema && field.componentProps.tabBarEnabled !== false;

  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  return (
    <SchemaSettingsDropdown
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
      <SchemaSettingsSwitchItem
        checked={tabBarEnabled}
        title={t('Enable TabBar')}
        onChange={async (v) => {
          if (v) {
            if (!tabBarSchema) {
              const pageSchema = findSchema(fieldSchema, 'MPage');
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
            }
          }

          await onUpdateComponentProps({
            tabBarEnabled: v,
          });

          if (v === false) {
            navigate('../');
          }
        }}
      />
    </SchemaSettingsDropdown>
  );
};
