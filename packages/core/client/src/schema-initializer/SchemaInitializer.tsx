import { ISchema, observer, useForm } from '@formily/react';
import { error, isString } from '@nocobase/utils/client';
import { Button, Dropdown, Menu, MenuProps, Spin, Switch } from 'antd';
import classNames from 'classnames';
// @ts-ignore
import { isEmpty } from 'lodash';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  // @ts-ignore
  useTransition,
} from 'react';
import { useCollectMenuItem, useMenuItem } from '../hooks/useMenuItem';
import { Icon } from '../icon';
import { SchemaComponent, useActionContext } from '../schema-component';
import { useCompile, useDesignable } from '../schema-component/hooks';
import { SelectCollection } from './SelectCollection';
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

  return <SelectCollection value={searchValue} onChange={onChange} />;
};

const LoadingItem = ({ loadMore }) => {
  const spinRef = React.useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });

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

const MenuWithLazyLoadChildren = ({ items: _items, style }: { items: any[]; style?: React.CSSProperties }) => {
  const [items, setItems] = useState(_items);
  const [isPending, startTransition] = useTransition();
  const clearSearchValueRef = useRef(null);
  const minStep = 20;

  useEffect(() => {
    setItems(_items);
  }, [_items]);

  const addLoadingItem = (group, allChildren) => {
    if (group.children?.length < allChildren?.length) {
      group.children.push({
        label: (
          <LoadingItem
            loadMore={() => {
              group.children = allChildren?.slice(0, (group.count += minStep)) || [];
              addLoadingItem(group, allChildren);
              setItems([...items]);
            }}
          />
        ),
      });
    }
  };

  items.forEach((group1) => {
    group1.children?.forEach((group2) => {
      group2.className = 'group2';
      group2.onMouseEnter = ({ domEvent }) => {
        if (!isGroup2(domEvent)) {
          return;
        }

        group2.children?.forEach((group3) => {
          if (group3.loadChildren) {
            group3.label = (
              <CollectionSearch
                clearValueRef={clearSearchValueRef}
                onChange={(value) => {
                  if (group3.loadChildren) {
                    startTransition(() => {
                      const result = group3.loadChildren({ searchValue: value });
                      group3.count = minStep;
                      group3.children = result?.slice(0, group3.count) || [];
                      addLoadingItem(group3, result);
                      setItems([...items]);
                    });
                  }
                }}
              />
            );
            startTransition(() => {
              const allChildren = group3.loadChildren();
              group3.count = minStep;
              group3.children = allChildren?.slice(0, group3.count) || [];
              addLoadingItem(group3, allChildren);
              setItems([...items]);
            });
          }
        });
      };
    });
  });

  const clearSearchValue = useCallback((value: string[]) => {
    if (isEmpty(value) && clearSearchValueRef.current) {
      clearSearchValueRef.current();
    }
  }, []);

  return <Menu style={style} items={items} onOpenChange={clearSearchValue} />;
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
    const { Component: CollectionComponent, getMenuItem, clean } = useMenuItem();
    const [isPending, startTransition] = useTransition();
    const menuItems = useRef([]);
    const { styles } = useStyles();

    const changeMenu = (v: boolean) => {
      // 这里是为了防止当鼠标快速滑过时，终止菜单的渲染，防止卡顿
      startTransition(() => {
        setVisible(v);
      });
    };

    if (!designable && props.designable !== true) {
      return null;
    }

    const buttonDom = component ? (
      component
    ) : (
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
            return (
              !!item.children?.length && {
                type: 'group',
                key: item.key || `item-group-${indexA}`,
                label,
                title: label,
                children: renderItems(item.children),
              }
            );
          }
          if (item.type === 'subMenu') {
            const label = compile(item.title);
            return (
              !!item.children?.length && {
                key: item.key || `item-group-${indexA}`,
                label,
                title: label,
                popupClassName: styles.nbMenuItemSubMenu,
                children: renderItems(item.children),
              }
            );
          }
        });
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
      />
    );

    return (
      <SchemaInitializerButtonContext.Provider value={{ visible, setVisible }}>
        {visible ? <CollectionComponent /> : null}
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
        form.reset();
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
        form.reset();
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

function isGroup2(domEvent: any) {
  let el = domEvent.target;
  let result = false;
  while (el) {
    if (el.classList?.contains('group2')) {
      result = true;
      break;
    }
    el = el.parentNode;
  }

  return result;
}
