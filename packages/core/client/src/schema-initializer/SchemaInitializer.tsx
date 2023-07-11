import { css } from '@emotion/css';
import { ISchema, observer, useForm } from '@formily/react';
import { error, isString } from '@nocobase/utils/client';
import { Button, Dropdown, MenuProps, Switch } from 'antd';
import classNames from 'classnames';
// @ts-ignore
import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition } from 'react';
import { useCollectMenuItem, useMenuItem } from '../hooks/useMenuItem';
import { Icon } from '../icon';
import { SchemaComponent, useActionContext } from '../schema-component';
import { useCompile, useDesignable } from '../schema-component/hooks';
import { useStyles } from './style';
import {
  SchemaInitializerButtonProps,
  SchemaInitializerItemComponent,
  SchemaInitializerItemOptions,
  SchemaInitializerItemProps,
} from './types';

const overlayClassName = css`
  .ant-dropdown-menu-item-group-list {
    max-height: 40vh;
    overflow: auto;
  }
`;

const defaultWrap = (s: ISchema) => s;

export const SchemaInitializerItemContext = createContext(null);
export const SchemaInitializerButtonContext = createContext<{
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  searchValue?: string;
  setSearchValue?: (v: string) => void;
}>({});

export const SchemaInitializer = () => null;

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
    const [searchValue, setSearchValue] = useState('');
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
          borderColor: '#f18b62',
          color: '#f18b62',
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
            const label = compile(item.title);
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
                popupClassName: styles.nbMenuItemGroup,
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

    return (
      <SchemaInitializerButtonContext.Provider value={{ visible, setVisible, searchValue, setSearchValue }}>
        {visible ? <CollectionComponent /> : null}
        <Dropdown
          className={classNames('nb-schema-initializer-button')}
          openClassName={`nb-schema-initializer-button-open`}
          overlayClassName={classNames('nb-schema-initializer-button-overlay', overlayClassName)}
          open={visible}
          onOpenChange={(open) => {
            // 如果不清空输入框的值，那么下次打开的时候会出现上次输入的值
            setSearchValue('');
            changeMenu(open);
          }}
          menu={{
            style: {
              maxHeight: '60vh',
              overflowY: 'auto',
            },
            items: menuItems.current,
          }}
          {...dropdown}
        >
          {component ? component : buttonDom}
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

  if (!collectMenuItem) {
    error('SchemaInitializer.Item: collectMenuItem is undefined, please check the context');
    return null;
  }

  if (items?.length > 0) {
    const renderMenuItem = (items: SchemaInitializerItemOptions[]) => {
      if (!items?.length) {
        return null;
      }
      return items.map((item, indexA) => {
        if (item.type === 'divider') {
          return { type: 'divider', key: `divider-${indexA}` };
        }
        if (item.type === 'itemGroup') {
          const label = compile(item.title);
          return {
            type: 'group',
            key: item.key || `item-group-${indexA}`,
            label,
            title: label,
            className: styles.nbMenuItemGroup,
            children: renderMenuItem(item.children),
          } as MenuProps['items'][0];
        }
        if (item.type === 'subMenu') {
          const label = compile(item.title);
          return {
            key: item.key || `sub-menu-${indexA}`,
            label,
            title: label,
            children: renderMenuItem(item.children),
          };
        }
        const label = compile(item.title);
        return {
          key: item.key || `${info.key}-${item.title}-${indexA}`,
          label,
          title: label,
          onClick: (info) => {
            item?.clearKeywords?.();
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
      children: renderMenuItem(items),
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
      info?.clearKeywords?.();
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
              borderColor: 'rgb(241, 139, 98)',
              color: 'rgb(241, 139, 98)',
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
