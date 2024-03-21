import { useFieldSchema } from '@formily/react';
import {
  cx,
  DndContext,
  SchemaComponent,
  SchemaInitializerActionModal,
  SortableItem,
  useDesignable,
  useDesigner,
} from '@nocobase/client';
import { List } from 'antd-mobile';
import React from 'react';
import { useTranslation } from '../../../../locale';
import { PageSchema } from '../../common';
import { MenuDesigner } from './Menu.Designer';
import { MenuItem } from './Menu.Item';
import { menuItemSchema } from './schema';
import useStyles from './style';

const InternalMenu: React.FC = (props) => {
  const { styles } = useStyles();
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const { insertBeforeEnd, designable } = useDesignable();

  const { t } = useTranslation();

  const onAddMenuItem = (values: any) => {
    const properties = {
      page: PageSchema,
    };

    return insertBeforeEnd({
      type: 'void',
      title: values.name,
      'x-component': 'MMenu.Item',
      'x-component-props': values,
      'x-designer': 'MMenu.Item.Designer',
      properties,
    });
  };

  return (
    <SortableItem className={cx('nb-mobile-menu', styles.mobileMenu)}>
      <List>
        {designable && (
          <List.Item>
            <Designer />
          </List.Item>
        )}
        <DndContext>
          <SchemaComponent onlyRenderProperties schema={fieldSchema}></SchemaComponent>
        </DndContext>
        {designable ? (
          <List.Item>
            <SchemaInitializerActionModal
              buttonText={t('Add menu item')}
              title={t('Add menu item')}
              schema={menuItemSchema}
              onSubmit={onAddMenuItem}
            />
          </List.Item>
        ) : null}
      </List>
    </SortableItem>
  );
};

export const MMenu = InternalMenu as unknown as typeof InternalMenu & {
  Item: typeof MenuItem;
  Designer: typeof MenuDesigner;
};

MMenu.Item = MenuItem;
MMenu.Designer = MenuDesigner;
