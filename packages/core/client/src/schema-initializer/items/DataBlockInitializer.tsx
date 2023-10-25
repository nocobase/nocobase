import Icon, { TableOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { useSchemaInitializerV2, useSchemaInitializerMenuItems } from '../../application';
import { useCompile } from '../../schema-component';
import { useSchemaTemplateManager } from '../../schema-templates';
import { useCollectionDataSourceItemsV2 } from '../utils';

export const DataBlockInitializer = (props) => {
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
  const childItems = useSchemaInitializerMenuItems(menuChildren, name, onClick);
  const [showChildren, setShowChildren] = useState(false);
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
        onMouseEnter() {
          setShowChildren(true);
        },
        onMouseLeave() {
          setShowChildren(false);
        },
        children: showChildren ? childItems : [],
      },
    ],
    [compile, icon, childItems, showChildren, name, onClick, props, title],
  );
  return <Menu items={compiledMenuItems} />;
};
