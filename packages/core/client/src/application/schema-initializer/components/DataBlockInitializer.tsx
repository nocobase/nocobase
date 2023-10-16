import { TableOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import React, { useCallback, useMemo } from 'react';
import { useStyles } from './style';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerItemOptions } from '../../../schema-initializer';
import { useSchemaTemplateManager } from '../../../schema-templates';
import { useCollectionDataSourceItemsV2 } from '../../../schema-initializer/utils';
import { Icon } from '../../../icon';
import { useSchemaInitializerV2 } from '../hooks';

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
  const { styles } = useStyles();
  const defaultItems = useCollectionDataSourceItemsV2(componentType);
  const menuChildren = useMemo(() => items || defaultItems, [items, defaultItems]);
  const renderItems = useCallback(
    (items: SchemaInitializerItemOptions[], parentKey: string) => {
      if (!items?.length) {
        return [];
      }
      return items.map((item, indexA) => {
        if (item.type === 'divider') {
          return { type: 'divider', key: `divider-${indexA}` };
        }
        if (item.type === 'itemGroup') {
          const label = typeof item.title === 'string' ? compile(item.title) : item.title;
          const key = `${parentKey}-item-group-${indexA}`;
          return {
            type: 'group',
            key,
            label,
            title: label,
            className: styles.nbMenuItemGroup,
            children: item?.children.length ? renderItems(item.children, key) : [],
          };
        }
        if (item.type === 'subMenu') {
          const label = compile(item.title);
          const key = `${parentKey}-sub-menu-${indexA}`;
          return {
            key,
            label,
            title: label,
            children: item?.children.length ? renderItems(item.children, key) : [],
          };
        }
        const label = compile(item.title);
        const key = `${parentKey}-${item.title}-${indexA}`;
        return {
          key,
          label,
          title: label,
          onClick: (info) => {
            if (info.key !== key) return;
            if (item.onClick) {
              item.onClick({ ...info, item });
            } else {
              onClick({ ...info, item });
            }
          },
        };
      });
    },
    [compile, onClick, styles.nbMenuItemGroup],
  );
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
        children: renderItems(menuChildren, name),
      },
    ],
    [compile, icon, menuChildren, name, onClick, props, renderItems, title],
  );
  return <Menu items={compiledMenuItems} />;
};
