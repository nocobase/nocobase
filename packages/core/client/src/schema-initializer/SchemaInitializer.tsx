import { ISchema, observer, useForm } from '@formily/react';
import { error, isString } from '@nocobase/utils/client';
import { Button, Dropdown, Empty, Menu, MenuProps, Spin, Switch } from 'antd';
import classNames from 'classnames';
// @ts-ignore
import { isEmpty } from 'lodash';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCollection } from '../collection-manager';
import { useCollectMenuItem, useMenuItem } from '../hooks/useMenuItem';
import { Icon } from '../icon';
import { SchemaComponent, useActionContext } from '../schema-component';
import { useCompile, useDesignable } from '../schema-component/hooks';
import { SearchCollections } from './SearchCollections';
import { useStyles } from './style';
import {
  SchemaInitializerButtonProps,
  SchemaInitializerItemComponent,
  SchemaInitializerItemOptions,
  SchemaInitializerItemProps,
} from './types';

const defaultWrap = (s: ISchema) => s;

export const SchemaInitializerItemContext = createContext(null);
export const SchemaInitializerButtonContext = createContext<{
  visible?: boolean;
  setVisible?: (v: boolean) => void;
}>({});

export const SchemaInitializer = () => null;

const CollectionSearch = ({
  onChange: _onChange,
  clearValueRef,
}: {
  onChange: (value: string) => void;
  clearValueRef?: React.MutableRefObject<() => void>;
}) => {
  const [searchValue, setSearchValue] = useState('');
  const onChange = useCallback(
    (value) => {
      setSearchValue(value);
      _onChange(value);
    },
    [_onChange],
  );

  if (clearValueRef) {
    clearValueRef.current = () => {
      setSearchValue('');
    };
  }

  return <SearchCollections value={searchValue} onChange={onChange} />;
};

const LoadingItem = ({ loadMore }) => {
  const spinRef = React.useRef(null);

  useEffect(() => {
    let root = spinRef.current;

    while (root) {
      if (root.classList?.contains('ant-dropdown-menu')) {
        break;
      }
      root = root.parentNode;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const item of entries) {
          if (item.isIntersecting) {
            return loadMore();
          }
        }
      },
      {
        root,
      },
    );

    observer.observe(spinRef.current);
    return () => {
      observer.disconnect();
    };
  }, [loadMore]);

  return (
    <div ref={spinRef}>
      <Spin size="small" style={{ width: '100%' }} />
    </div>
  );
};

// 清除所有的 searchValue
const clearSearchValue = (items: any[]) => {
  items.forEach((item) => {
    if (item._clearSearchValueRef?.current) {
      item._clearSearchValueRef.current();
    }
    if (item.children?.length) {
      clearSearchValue(item.children);
    }
  });
};

/**
 * 当存在 loadChildren 方法时，且 children 为空时，会触发懒加载
 *
 * 1. 如果存在 loadChildren 方法，则需要懒加载 children
 * 2. 一开始先注入一个 loading 组件，当 loading 显示的时候，触发 loadChildren 方法
 * 3. 每次在 loading 后显示的数目增加 minStep，直到显示完所有 children
 * 4. 重置 item.label 为一个搜索框，用于筛选列表
 * 5. 每次组件刷新的时候，会重复上面的步骤
 * @param param0
 * @returns
 */
const lazyLoadChildren = ({
  items,
  minStep = 30,
  beforeLoading,
  afterLoading,
}: {
  items: any[];
  minStep?: number;
  beforeLoading?: () => void;
  afterLoading?: ({ currentCount }) => void;
}) => {
  if (isEmpty(items)) {
    return;
  }

  const addLoading = (item: any, searchValue: string) => {
    if (isEmpty(item.children)) {
      item.children = [];
    }

    item.children.push({
      key: `${item.key}-loading`,
      label: (
        <LoadingItem
          loadMore={() => {
            beforeLoading?.();
            item._allChildren = item.loadChildren({ searchValue }) || [];
            item._count += minStep;
            item.children = item._allChildren.slice(0, item._count);
            if (item.children.length < item._allChildren.length) {
              addLoading(item, searchValue);
            }
            afterLoading?.({ currentCount: item._count });
          }}
        />
      ),
    });
  };

  for (const item of items) {
    if (!item) {
      continue;
    }

    if (item.loadChildren && isEmpty(item.children)) {
      item._count = 0;
      item._clearSearchValueRef = {};
      item.label = (
        <CollectionSearch
          clearValueRef={item._clearSearchValueRef}
          onChange={(value) => {
            item._count = minStep;
            beforeLoading?.();
            item._allChildren = item.loadChildren({ searchValue: value }) || [];

            if (isEmpty(item._allChildren)) {
              item.children = [
                {
                  key: 'empty',
                  label: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                },
              ];
            } else {
              item.children = item._allChildren.slice(0, item._count);
            }

            if (item.children.length < item._allChildren.length) {
              addLoading(item, value);
            }
            afterLoading?.({ currentCount: item._count });
          }}
        />
      );

      // 通过 loading 加载新数据
      addLoading(item, '');
    }

    lazyLoadChildren({
      items: item.children,
      minStep,
      beforeLoading,
      afterLoading,
    });
  }
};

const MenuWithLazyLoadChildren = ({ items: _items, style, clean, component: Component }) => {
  const [items, setItems] = useState(_items);
  const currentCountRef = useRef(0);

  useEffect(() => {
    setItems(_items);
  }, [_items]);

  lazyLoadChildren({
    items,
    beforeLoading: () => {
      clean();
    },
    afterLoading: ({ currentCount }) => {
      currentCountRef.current = currentCount;
      setItems([...items]);
    },
  });

  return (
    <>
      {/* 用于收集 menu item */}
      <Component limitCount={currentCountRef.current} />
      <Menu style={style} items={items} />
    </>
  );
};

SchemaInitializer.Button = observer(
  (props: SchemaInitializerButtonProps) => {
    const {
      title,
      insert,
      wrap = defaultWrap,
      items = [],
      insertPosition = 'beforeEnd',
      dropdown,
      component,
      style,
      icon,
      onSuccess,
      ...others
    } = props;
    const compile = useCompile();
    const { insertAdjacent, findComponent, designable } = useDesignable();
    const [visible, setVisible] = useState(false);
    const { Component: CollectComponent, getMenuItem, clean } = useMenuItem();
    const menuItems = useRef([]);
    const { styles } = useStyles();
    const { name } = useCollection();

    const changeMenu = (v: boolean) => {
      setVisible(v);
    };

    useEffect(() => {
      if (visible === false) {
        clearSearchValue(menuItems.current);
      }
    }, [visible]);

    if (!designable && props.designable !== true) {
      return null;
    }

    if (others['data-testid'] && name) {
      others['data-testid'] = `${others['data-testid']}-${name}`;
    }

    const buttonDom = component || (
      <Button
        type={'dashed'}
        style={{
          borderColor: 'var(--colorSettings)',
          color: 'var(--colorSettings)',
          ...style,
        }}
        {...others}
        icon={typeof icon === 'string' ? <Icon type={icon as string} /> : icon}
      >
        {compile(props.children || props.title)}
      </Button>
    );

    const insertSchema = (schema) => {
      if (insert) {
        insert(wrap(schema));
      } else {
        insertAdjacent(insertPosition, wrap(schema), { onSuccess });
      }
    };

    const renderItems = (items: any) => {
      return items
        .filter((v: any) => {
          return v && (v?.visible ? v.visible() : true);
        })
        ?.map((item: any, indexA: number) => {
          if (item.type === 'divider') {
            return { type: 'divider', key: item.key || `item-${indexA}` };
          }
          if (item.type === 'item' && item.component) {
            const Component = findComponent(item.component);
            if (!Component) {
              error(`SchemaInitializer: component "${item.component}" not found`);
              return null;
            }
            if (!item.key) {
              item.key = `${item.title}-${indexA}`;
            }
            return getMenuItem(() => {
              return (
                <SchemaInitializerItemContext.Provider
                  key={item.key}
                  value={{
                    index: indexA,
                    item,
                    info: item,
                    insert: insertSchema,
                  }}
                >
                  <Component
                    {...item}
                    item={{
                      ...item,
                      title: compile(item.title),
                    }}
                    insert={insertSchema}
                  />
                </SchemaInitializerItemContext.Provider>
              );
            });
          }
          if (item.type === 'itemGroup') {
            const label = isString(item.title) ? compile(item.title) : item.title;
            return {
              type: 'group',
              key: item.key || `item-group-${indexA}`,
              label,
              title: label,
              style: item.style,
              loadChildren: isEmpty(item.children)
                ? ({ searchValue } = { searchValue: '' }) => renderItems(item.loadChildren?.({ searchValue }) || [])
                : null,
              children: isEmpty(item.children) ? [] : renderItems(item.children),
            };
          }
          if (item.type === 'subMenu') {
            const label = compile(item.title);
            return {
              key: item.key || `item-group-${indexA}`,
              label,
              title: label,
              popupClassName: styles.nbMenuItemSubMenu,
              loadChildren: isEmpty(item.children)
                ? ({ searchValue } = { searchValue: '' }) => renderItems(item.loadChildren?.({ searchValue }) || [])
                : null,
              children: isEmpty(item.children) ? [] : renderItems(item.children),
            };
          }
        })
        .filter(Boolean);
    };

    if (visible) {
      clean();
      menuItems.current = renderItems(items);
    }

    const dropdownRender = () => (
      <MenuWithLazyLoadChildren
        style={{
          maxHeight: '50vh',
          overflowY: 'auto',
        }}
        items={menuItems.current}
        clean={clean}
        component={CollectComponent}
      />
    );

    return (
      <SchemaInitializerButtonContext.Provider value={{ visible, setVisible }}>
        {visible ? <CollectComponent /> : null}
        <Dropdown
          className={classNames('nb-schema-initializer-button')}
          openClassName={`nb-schema-initializer-button-open`}
          open={visible}
          onOpenChange={(open) => {
            changeMenu(open);
          }}
          dropdownRender={dropdownRender}
          {...dropdown}
        >
          {component || buttonDom}
        </Dropdown>
      </SchemaInitializerButtonContext.Provider>
    );
  },
  { displayName: 'SchemaInitializer.Button' },
);

SchemaInitializer.Item = function Item(props: SchemaInitializerItemProps) {
  const { styles } = useStyles();
  const { info } = useContext(SchemaInitializerItemContext);
  const compile = useCompile();
  const { items = [], children = info?.title, icon, onClick } = props;
  const { collectMenuItem } = useCollectMenuItem();

  if (process.env.NODE_ENV !== 'production' && !collectMenuItem) {
    throw new Error('SchemaInitializer.Item: collectMenuItem is undefined, please check the context');
  }

  if (items?.length > 0) {
    const renderMenuItem = (items: SchemaInitializerItemOptions[], parentKey: string) => {
      if (!items?.length) {
        return [];
      }
      return items.map((item, indexA) => {
        if (item.type === 'divider') {
          return { type: 'divider', key: `divider-${indexA}` };
        }
        if (item.type === 'itemGroup') {
          const label = isString(item.title) ? compile(item.title) : item.title;
          const key = `${parentKey}-item-group-${indexA}`;
          return {
            type: 'group',
            key,
            label,
            title: label,
            className: styles.nbMenuItemGroup,
            loadChildren: isEmpty(item.children)
              ? ({ searchValue } = { searchValue: '' }) =>
                  renderMenuItem(item.loadChildren?.({ searchValue }) || [], key)
              : null,
            children: isEmpty(item.children) ? [] : renderMenuItem(item.children, key),
          } as MenuProps['items'][0] & { loadChildren?: ({ searchValue }?: { searchValue: string }) => any[] };
        }
        if (item.type === 'subMenu') {
          const label = compile(item.title);
          const key = `${parentKey}-sub-menu-${indexA}`;
          return {
            key,
            label,
            title: label,
            loadChildren: isEmpty(item.children)
              ? ({ searchValue } = { searchValue: '' }) =>
                  renderMenuItem(item.loadChildren?.({ searchValue }) || [], key)
              : null,
            children: isEmpty(item.children) ? [] : renderMenuItem(item.children, key),
          } as MenuProps['items'][0] & { loadChildren?: ({ searchValue }?: { searchValue: string }) => any[] };
        }
        const label = compile(item.title);
        return {
          key: `${parentKey}-${item.title}-${indexA}`,
          label,
          title: label,
          onClick: (info) => {
            if (item.onClick) {
              item.onClick({ ...info, item });
            } else {
              onClick({ ...info, item });
            }
          },
        };
      });
    };

    const item = {
      key: info.key,
      label: isString(children) ? compile(children) : children,
      icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
      children: renderMenuItem(items, info.key),
    };

    collectMenuItem(item);
    return null;
  }

  const label = isString(children) ? compile(children) : children;
  const item = {
    key: info.key,
    label,
    title: label,
    icon: typeof icon === 'string' ? <Icon type={icon as string} /> : icon,
    onClick: (opts) => {
      onClick({ ...opts, item: info });
    },
  };

  collectMenuItem(item);
  return null;
};

SchemaInitializer.itemWrap = (component?: SchemaInitializerItemComponent) => {
  return component;
};

interface SchemaInitializerActionModalProps {
  title: string;
  schema: any;
  onCancel?: () => void;
  onSubmit?: (values: any) => void;
  buttonText?: any;
}
SchemaInitializer.ActionModal = function ActionModal(props: SchemaInitializerActionModalProps) {
  const { title, schema, buttonText, onCancel, onSubmit } = props;

  const useCancelAction = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useActionContext();
    return {
      async run() {
        await onCancel?.();
        ctx.setVisible(false);
        void form.reset();
      },
    };
  }, [onCancel]);

  const useSubmitAction = useCallback(() => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const ctx = useActionContext();
    return {
      async run() {
        await form.validate();
        await onSubmit?.(form.values);
        ctx.setVisible(false);
        void form.reset();
      },
    };
  }, [onSubmit]);
  const defaultSchema = useMemo(() => {
    return {
      type: 'void',
      properties: {
        action1: {
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            icon: 'PlusOutlined',
            style: {
              borderColor: 'var(--colorSettings)',
              color: 'var(--colorSettings)',
            },
            title: buttonText,
            type: 'dashed',
          },
          properties: {
            drawer1: {
              'x-decorator': 'Form',
              'x-component': 'Action.Modal',
              'x-component-props': {
                style: {
                  maxWidth: '520px',
                  width: '100%',
                },
              },
              type: 'void',
              title,
              properties: {
                ...(schema?.properties || schema),
                footer: {
                  'x-component': 'Action.Modal.Footer',
                  type: 'void',
                  properties: {
                    cancel: {
                      title: '{{t("Cancel")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction: useCancelAction,
                      },
                    },
                    submit: {
                      title: '{{t("Submit")}}',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: useSubmitAction,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }, [buttonText, schema, title, useCancelAction, useSubmitAction]);

  return <SchemaComponent schema={defaultSchema as any} />;
};

SchemaInitializer.SwitchItem = (props) => {
  return (
    <SchemaInitializer.Item onClick={props.onClick}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {props.title} <Switch style={{ marginLeft: 20 }} size={'small'} checked={props.checked} />
      </div>
    </SchemaInitializer.Item>
  );
};
