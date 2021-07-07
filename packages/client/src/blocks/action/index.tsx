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
} from '@formily/react';
import { Button, Dropdown, Menu, Popover, Space, Drawer, Modal } from 'antd';
import { Link, useHistory, LinkProps } from 'react-router-dom';
import { SchemaRenderer, useDesignable } from '../';
import ReactDOM from 'react-dom';
import get from 'lodash/get';
import { MenuOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useMount } from 'ahooks';
import { uid } from '@formily/shared';

import './style.less';
import constate from 'constate';

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
  DesignableBar?: React.FC<any>;
};

function Blank() {
  return null;
}

function useDesignableBar() {
  const schema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = get(options.components, schema['x-designable-bar']);

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

const [VisibleProvider, useVisibleContext] = constate((props: any = {}) => {
  const { initialVisible = false, containerRef = null } = props;
  const [visible, setVisible] = useState(initialVisible);

  return { containerRef, visible, setVisible };
});

export { VisibleProvider, useVisibleContext };

const BaseAction = observer((props: any) => {
  const { useAction = useDefaultAction, ...others } = props;
  const field = useField();
  const { run } = useAction();
  const { DesignableBar } = useDesignableBar();
  const { setVisible } = useVisibleContext();
  const schema = useFieldSchema();
  useEffect(() => {
    field.componentProps.setVisible = setVisible;
  }, []);

  console.log('BaseAction', { field, schema }, field.title)

  const renderButton = () => (
    <Button
      {...others}
      onClick={async (e) => {
        e.stopPropagation();
        setVisible && setVisible(true);
        await run();
      }}
    >
      {field.title}
      <DesignableBar />
    </Button>
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
      <VisibleProvider initialVisible={props.initialVisible} containerRef={props.containerRef}>
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
  const { visible, setVisible } = useVisibleContext();
  return (
    <Drawer
      onClick={e => {
        e.stopPropagation();
      }}
      title={field.title}
      width={'50%'}
      {...props}
      visible={visible}
      onClose={(e) => {
        e.stopPropagation();
        setVisible(false)
      }}
    >
      {props.children}
    </Drawer>
  );
});

Action.Modal = observer((props) => {
  const field = useField();
  const { visible, setVisible } = useVisibleContext();
  return (
    <Modal
      title={field.title}
      width={'50%'}
      {...props}
      visible={visible}
      onCancel={() => setVisible(false)}
    >
      {props.children}
    </Modal>
  );
});

Action.DesignableBar = () => {
  const field = useField();
  const schema = useFieldSchema();
  const { insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  return (
    <div className={classNames('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={classNames('designable-bar-actions', { active: visible })}
      >
        <Dropdown
          trigger={['click']}
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          overlay={
            <Menu>
              <Menu.Item
                onClick={(e) => {
                  console.log({ field, schema });
                  schema.title = '按钮文案被修改了';
                  field.setTitle('按钮文案被修改了');
                  schema.properties.drawer1.title = '抽屉标题文案被修改了';
                  setVisible(false);
                }}
              >
                点击修改按钮文案
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  insertAfter({
                    name: uid(),
                    'x-component': 'Input',
                  });
                }}
              >
                insertAfter
              </Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
    </div>
  );
};
