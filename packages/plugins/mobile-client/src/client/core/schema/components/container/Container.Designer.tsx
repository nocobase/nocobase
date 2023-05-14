import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '@nocobase/client';
import React from 'react';
import { useTranslation } from '../../../../locale';
import { Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useHistory } from 'react-router-dom';
import { findSchema } from '../../helpers';

export const ContainerDesigner = () => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const tabBarSchema = fieldSchema.reduceProperties(
    (schema, next) => schema || (next['x-component'] === 'MTabBar' && next),
  ) as Schema;

  const history = useHistory();
  return (
    <GeneralSchemaDesigner draggable={false}>
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
                    title: t('Untitled'),
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
    </GeneralSchemaDesigner>
  );
};
