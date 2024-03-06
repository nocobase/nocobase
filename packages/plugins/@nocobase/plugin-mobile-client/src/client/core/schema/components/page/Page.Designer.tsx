import { MenuOutlined } from '@ant-design/icons';
import { useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaSettingsDropdown, SchemaSettingsSwitchItem, useDesignable } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';
import { generateNTemplate, useTranslation } from '../../../../locale';
import { findGridSchema } from '../../helpers';
import { useSchemaPatch } from '../../hooks';

export const PageDesigner = (props) => {
  const { showBack } = props;
  const { t } = useTranslation();
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { onUpdateComponentProps } = useSchemaPatch();
  const headerSchema = fieldSchema?.properties?.['header'];
  const isHeaderEnabled = !!headerSchema && field.componentProps?.headerEnabled !== false;
  const tabsSchema = fieldSchema?.properties?.['tabs'];
  const isTabsEnabled = !!tabsSchema && field.componentProps?.tabsEnabled !== false;
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
          {t('Page configuration')}
        </Button>
      }
      {...schemaSettingsProps}
    >
      <SchemaSettingsSwitchItem
        checked={isHeaderEnabled}
        title={t('Enable Header')}
        onChange={async (v) => {
          if (!headerSchema) {
            await dn.insertAfterBegin({
              type: 'void',
              name: 'header',
              'x-component': 'MHeader',
              'x-designer': 'MHeader.Designer',
              'x-component-props': {
                title: fieldSchema.parent['x-component-props']?.name,
                showBack,
              },
            });
          }
          await onUpdateComponentProps({
            headerEnabled: v,
          });
        }}
      />
      <SchemaSettingsSwitchItem
        checked={isTabsEnabled}
        title={t('Enable Tabs')}
        onChange={async (v) => {
          if (!tabsSchema) {
            const gridSchema = findGridSchema(fieldSchema);
            await dn.remove(gridSchema);
            return dn.insertBeforeEnd({
              type: 'void',
              name: 'tabs',
              'x-component': 'Tabs',
              'x-component-props': {},
              'x-initializer': 'TabPaneInitializers',
              'x-initializer-props': {
                gridInitializer: 'mobilePage:addBlock',
              },
              properties: {
                tab1: {
                  type: 'void',
                  title: generateNTemplate('Untitled'),
                  'x-component': 'Tabs.TabPane',
                  'x-designer': 'Tabs.Designer',
                  'x-component-props': {},
                  properties: {
                    grid: {
                      ...gridSchema,
                      'x-uid': uid(),
                    },
                  },
                },
              },
            });
          }

          await onUpdateComponentProps({
            tabsEnabled: v,
          });
        }}
      />
    </SchemaSettingsDropdown>
  );
};
