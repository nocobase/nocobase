import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  useForm,
  FormProvider,
  createSchemaField,
  observer,
  useFieldSchema,
  RecursionField,
  SchemaOptionsContext,
  Schema,
  useField,
  SchemaExpressionScopeContext,
} from '@formily/react';
import { Button, Dropdown, Menu, Popover, Space, Drawer, Modal } from 'antd';
import { Link, useHistory, LinkProps } from 'react-router-dom';
import { SchemaRenderer, useDesignable } from '..';
import ReactDOM from 'react-dom';
import get from 'lodash/get';
import { MenuOutlined, DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useMount } from 'ahooks';
import { uid } from '@formily/shared';

import './style.less';
import constate from 'constate';
import { Icon } from '../icon-picker';
import { useMemo } from 'react';
import { createForm } from '@formily/core';

export function useDefaultAction() {
  return {
    run() {},
  };
}

export function useSubmit() {
  const form = useForm();
  const run = async () => {
    await form.submit();
    console.log(form.values);
  };
  return {
    run,
  };
}

export function useLogin() {
  const form = useForm();
  const history = useHistory();
  const run = async () => {
    await form.submit();
    history.push('/admin');
    console.log(form.values);
  };
  return {
    run,
  };
}

export function useRegister() {
  const form = useForm();
  const run = async () => {
    await form.submit();
    console.log(form.values);
  };
  return {
    run,
  };
}

export interface ActionProps {
  useAction?: any;
  [key: string]: any;
}

export type ActionType = React.FC<ActionProps> & {
  Link?: React.FC<LinkProps>;
  URL?: React.FC<any>;
  Page?: React.FC<any>;
  Container?: React.FC<any>;
  Popover?: React.FC<any>;
  Drawer?: React.FC<any>;
  Modal?: React.FC<any>;
  Dropdown?: React.FC<any>;
  Group?: React.FC<any>;
  DesignableBar?: React.FC<any>;
};

function useDesignableBar() {
  const schema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = get(options.components, schema['x-designable-bar']);
  return {
    DesignableBar: DesignableBar || (() => null),
  };
}

const [VisibleProvider, useVisibleContext] = constate((props: any = {}) => {
  const { initialVisible = false, containerRef = null } = props;
  const [visible, setVisible] = useState(initialVisible);
  return { containerRef, visible, setVisible };
});

export { VisibleProvider, useVisibleContext };

const BaseAction = observer((props: any) => {
  const {
    ButtonComponent = Button,
    className,
    icon,
    useAction = useDefaultAction,
    ...others
  } = props;
  const field = useField();
  const { run } = useAction();
  const { DesignableBar } = useDesignableBar();
  const { setVisible } = useVisibleContext();
  const fieldSchema = useFieldSchema();
  const { schema } = useDesignable();

  useEffect(() => {
    field.componentProps.setVisible = setVisible;
  }, []);

  const renderButton = () => (
    <ButtonComponent
      {...others}
      icon={icon ? <Icon type={icon} /> : null}
      className={classNames(className, `name-${schema.name}`)}
      onClick={async (e) => {
        e.stopPropagation && e.stopPropagation();
        setVisible && setVisible(true);
        await run();
      }}
    >
      {schema.title}
      <DesignableBar />
    </ButtonComponent>
  );

  const popover = schema.reduceProperties((items, current) => {
    if (current['x-component'] === 'Action.Popover') {
      return current;
    }
    return null;
  }, null);

  if (popover) {
    return (
      <RecursionField
        schema={
          new Schema({
            type: 'object',
            properties: {
              [popover.name]: {
                ...popover.toJSON(),
                'x-button': renderButton(),
              },
            },
          })
        }
      />
    );
  }

  return (
    <>
      {renderButton()}
      {props.children}
    </>
  );
});

export const Action: ActionType = observer((props: any) => {
  const schema = useFieldSchema();
  if (schema.properties) {
    return (
      <VisibleProvider
        initialVisible={props.initialVisible}
        containerRef={props.containerRef}
      >
        <BaseAction {...props} />
      </VisibleProvider>
    );
  }
  return <BaseAction {...props} />;
});

Action.Link = observer((props) => {
  const schema = useFieldSchema();
  return <Link {...props}>{schema.title}</Link>;
});

Action.URL = observer((props) => {
  const { url, ...others } = props;
  const schema = useFieldSchema();
  return (
    <a target={'_blank'} href={url} {...others}>
      {schema.title}
    </a>
  );
});

Action.Container = observer((props) => {
  const { visible, setVisible } = useVisibleContext();
  return visible && <div>{props.children}</div>;
});

Action.Popover = observer((props) => {
  const { visible, setVisible } = useVisibleContext();
  const schema = useFieldSchema();
  return (
    <Popover
      placement={'bottom'}
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      {...props}
      content={props.children}
    >
      {schema['x-button']}
    </Popover>
  );
});

Action.Drawer = observer((props) => {
  const field = useField();
  // const { visible, setVisible } = useVisibleContext();
  const { useAction = () => ({ async run() {} }), ...others } = props;
  const { schema } = useDesignable();
  const { visible, setVisible } = useVisibleContext();
  const { run } = useAction();
  const form = useForm();
  console.log(`schema['x-decorator']`, schema['x-decorator']);
  if (schema['x-decorator'] === 'Form.Decorator') {
    Object.assign(others, {
      footer: (
        <Space>
          <Button
            onClick={async () => {
              await form.submit();
              await run();
              setVisible(false);
            }}
            type={'primary'}
          >
            OK
          </Button>
          <Button
            onClick={async () => {
              form.clearErrors();
              setVisible(false);
            }}
          >
            Cancel
          </Button>
        </Space>
      ),
    });
  }

  return (
    <Drawer
      onClick={(e) => {
        e.stopPropagation();
      }}
      title={field.title}
      width={'50%'}
      {...others}
      visible={visible}
      destroyOnClose
      onClose={(e) => {
        e.stopPropagation();
        form.clearErrors();
        setVisible(false);
      }}
    >
      {props.children}
    </Drawer>
  );
});

const [DesignableContextProvider, useDesignableContext] = constate(() => {
  return useDesignable();
});

import { DesignableBar } from './designableBar';

export function useDesignableValues() {
  const { schema } = useDesignableContext();
  return schema
    ? {
        title: schema.title,
      }
    : {};
}

export function useDesignableUpdate() {
  const { schema, refresh } = useDesignableContext();
  const form = useForm();
  return {
    async run() {
      schema.title = form.values.title;
      refresh();
      console.log('useDesignableUpdate', schema, form.values);
    },
  };
}

export function useDesignableSchemaRemove() {
  const { schema, refresh, remove } = useDesignableContext();
  return {
    async run() {
      remove();
    },
  };
}

Action.Modal = observer((props) => {
  const { useAction = () => ({ async run() {} }), ...others } = props;
  const { schema } = useDesignable();
  const { setVisible: setDropdownVisible } = useDropdownVisibleContext();
  const { visible, setVisible } = useVisibleContext();
  const { run } = useAction();
  const form = useForm();
  // console.log('Action.Modal', schema['x-component-props'], Object.keys(others).includes('footer'));
  if (
    !Object.keys(others).includes('footer') &&
    schema['x-decorator'] !== 'Form.Decorator'
  ) {
    Object.assign(others, { footer: null });
  }
  return (
    <Modal
      title={schema.title}
      width={'50%'}
      {...others}
      visible={visible}
      closable
      maskClosable
      destroyOnClose
      onCancel={async (e) => {
        e.stopPropagation();
        setVisible(false);
        // await form.reset();
        setDropdownVisible && setDropdownVisible(false);
      }}
      onOk={async (e) => {
        console.log('onOk', form.values);
        // await form.submit();
        await run();
        setVisible(false);
        setDropdownVisible && setDropdownVisible(false);
      }}
    >
      <div
      //onClick={(e) => e.stopPropagation()}
      >
        {props.children}
      </div>
    </Modal>
  );
});

const [DropdownVisibleProvider, useDropdownVisibleContext] = constate(
  (props: any = {}) => {
    const { initialVisible = false } = props;
    const [visible, setVisible] = useState(initialVisible);
    return { visible, setVisible };
  },
);

const ActionDropdown = observer((props: any) => {
  const { icon, ...others } = props;
  const schema = useFieldSchema();
  const { visible, setVisible } = useDropdownVisibleContext();
  return (
    <Popover
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      // {...props}
      overlayClassName={'nb-action-group'}
      // trigger={'click'}
      content={props.children}
      placement={'bottomLeft'}
    >
      <Button icon={icon ? <Icon type={icon} /> : null} {...others}>
        {schema.title}
      </Button>
    </Popover>
  );
});

Action.Dropdown = observer((props) => {
  return (
    <DropdownVisibleProvider>
      <ActionDropdown {...props} />
      <div style={{ display: 'none' }}>{props.children}</div>
    </DropdownVisibleProvider>
  );
});

Action.DesignableBar = () => {
  const field = useField();
  // const schema = useFieldSchema();
  const { schema, insertAfter, refresh } = useDesignable();
  const [visible, setVisible] = useState(false);
  return (
    <DesignableContextProvider>
      <div className={classNames('designable-bar', { active: visible })}>
        <span
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={classNames('designable-bar-actions', { active: visible })}
        >
          <SchemaRenderer schema={DesignableBar.Action} />
        </span>
      </div>
    </DesignableContextProvider>
  );
};
