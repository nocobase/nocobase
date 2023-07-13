import { MenuOutlined } from '@ant-design/icons';
import { useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaSettings, useDesignable } from '@nocobase/client';
import { Button } from 'antd';
import React from 'react';
import { generateNTemplate, useTranslation } from '../../../../locale';
import { findGridSchema } from '../../helpers';

export const PageDesigner = (props) => {
  const { showBack } = props;
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const headerSchema = fieldSchema?.properties?.['header'];
  const tabsSchema = fieldSchema?.properties?.['tabs'];
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
      <SchemaSettings.SwitchItem
        checked={!!headerSchema}
        title={t('Enable Header')}
        onChange={async (v) => {
          if (v) {
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
          } else {
            await dn.remove(headerSchema);
          }
          dn.refresh();
        }}
      />
      <SchemaSettings.SwitchItem
        checked={!!tabsSchema}
        title={t('Enable Tabs')}
        onChange={async (v) => {
          if (v) {
            const gridSchema = findGridSchema(fieldSchema);
            if (gridSchema) {
              return dn.remove(gridSchema).then(() => {
                return dn.insertBeforeEnd({
                  type: 'void',
                  name: 'tabs',
                  'x-component': 'Tabs',
                  'x-component-props': {},
                  'x-initializer': 'TabPaneInitializers',
                  'x-initializer-props': {
                    gridInitializer: 'MBlockInitializers',
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
              });
            }
          } else {
            const gridSchema = findGridSchema(tabsSchema.properties[Object.keys(tabsSchema.properties)[0]]);
            if (gridSchema) {
              return dn.remove(tabsSchema).then(() => dn.insertBeforeEnd(gridSchema, {}));
            }
          }
        }}
      />
    </SchemaSettings>
  );
};
