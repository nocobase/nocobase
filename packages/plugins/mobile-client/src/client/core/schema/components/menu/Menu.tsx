import React, { useContext } from 'react';
import { MenuItem } from './Menu.Item';
import {
  DndContext,
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  SortableItem,
  useDesignable,
  useDesigner,
} from '@nocobase/client';
import { css, cx } from '@emotion/css';
import { FormDialog, FormLayout } from '@formily/antd';
import { MenuDesigner } from './Menu.Designer';
import { SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { List } from 'antd-mobile';
import { useTranslation } from '../../../../locale';

const InternalMenu: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const { insertBeforeEnd, designable } = useDesignable();

  const { t } = useTranslation();

  const onAddMenuItem = () => {
    return FormDialog({ title: t('Add menu item') }, () => {
      return (
        <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
          <FormLayout layout={'vertical'}>
            <SchemaComponent
              schema={{
                properties: {
                  name: {
                    type: 'string',
                    title: t('Menu item name'),
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
                  template: {
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                    title: t('Page template'),
                    'x-component-props': {},
                  },
                },
              }}
            />
          </FormLayout>
        </SchemaComponentOptions>
      );
    })
      .open({})
      .then((values) => {
        return insertBeforeEnd({
          type: 'void',
          title: values.name,
          'x-component': 'MMenu.Item',
          'x-component-props': values,
          'x-designer': 'MMenu.Item.Designer',
          properties: {
            page: {
              type: 'void',
              'x-component': 'MPage',
              'x-designer': 'MPage.Designer',
              'x-component-props': {},
              properties: {
                header: {
                  type: 'void',
                  'x-component': 'MHeader',
                  'x-designer': 'MHeader.Designer',
                  'x-component-props': {
                    title: values.name,
                    showBack: true,
                  },
                },
                grid: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-component-props': {
                    showDivider: false,
                  },
                  'x-initializer': 'MBlockInitializers',
                },
              },
            },
          },
        });
      });
  };

  return (
    <SortableItem
      className={cx(
        'nb-mobile-menu',
        css`
          background: #ffffff;
          width: 100%;
          margin-bottom: var(--nb-spacing);
        `,
      )}
    >
      <Designer />
      <List>
        <DndContext>
          <SchemaComponent onlyRenderProperties schema={fieldSchema}></SchemaComponent>
        </DndContext>
      </List>
      {designable ? (
        <SchemaInitializer.Button onClick={onAddMenuItem}>{t('Add menu item')}</SchemaInitializer.Button>
      ) : null}
    </SortableItem>
  );
};

export const MMenu = InternalMenu as unknown as typeof InternalMenu & {
  Item: typeof MenuItem;
  Designer: typeof MenuDesigner;
};

MMenu.Item = MenuItem;
MMenu.Designer = MenuDesigner;
