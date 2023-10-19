import { TableOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useCompile } from '../../../schema-component';
import { useSchemaTemplateManager } from '../../../schema-templates';
import { useCollectionDataSourceItemsV2 } from '../../../schema-initializer/utils';
import { Icon } from '../../../icon';
import { useSchemaInitializerV2 } from '../hooks';
import { useMenuItems } from '../hooks';

export const DataBlockInitializerV2 = (props) => {
  const {
    templateWrap,
    onCreateBlockSchema,
    componentType,
    createBlockSchema,
    isCusomeizeCreate,
    icon = TableOutlined,
    name,
    title,
    items,
  } = props;
  const { insert } = useSchemaInitializerV2();
  const compile = useCompile();
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const onClick = useCallback(
    async ({ item }) => {
      if (item.template) {
        const s = await getTemplateSchemaByMode(item);
        templateWrap ? insert(templateWrap(s, { item })) : insert(s);
      } else {
        if (onCreateBlockSchema) {
          onCreateBlockSchema({ item });
        } else if (createBlockSchema) {
          insert(createBlockSchema({ collection: item.name, isCusomeizeCreate }));
        }
      }
    },
    [createBlockSchema, getTemplateSchemaByMode, insert, isCusomeizeCreate, onCreateBlockSchema, templateWrap],
  );
  const defaultItems = useCollectionDataSourceItemsV2(componentType);
  const menuChildren = useMemo(() => items || defaultItems, [items, defaultItems]);
  const menuItems = useMenuItems(name, onClick, menuChildren);
  const compiledMenuItems = useMemo(
    () => [
      {
        key: name,
        label: compile(title),
        icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
        onClick: (info) => {
          if (info.key !== name) return;
          onClick({ ...info, item: props });
        },
        children: menuItems,
      },
    ],
    [compile, icon, menuItems, name, onClick, props, title],
  );
  return <Menu items={compiledMenuItems} />;
};
