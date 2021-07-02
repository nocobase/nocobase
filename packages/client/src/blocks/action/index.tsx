import React, { createContext, useContext, useState } from 'react';
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
import { Button, Dropdown, Menu, Popover, Space } from 'antd';
import { Link, useHistory, LinkProps } from 'react-router-dom';
import Drawer from '../../components/Drawer';
import { SchemaRenderer, useDesignable } from '../';
import ReactDOM from 'react-dom';
import get from 'lodash/get';
import { MenuOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { useMount } from 'ahooks';
import { uid } from '@formily/shared';

import './style.less';

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

export const ActionContext = createContext({ containerRef: null });

export const Action: ActionType = observer((props) => {
  const { useAction = useDefaultAction, ...others } = props;
  const { containerRef } = useContext(ActionContext);
  const field = useField();
  const schema = useFieldSchema();
  const { run } = useAction();
  const { DesignableBar } = useDesignableBar();

  const renderContainer = () => {
    let childSchema = null;
    if (schema.properties) {
      const key = Object.keys(schema.properties).shift();
      const current = schema.properties[key];
      childSchema = current;
    }
    if (childSchema && childSchema['x-component'] === 'Action.Container') {
      containerRef &&
        ReactDOM.render(
          <div>
            <SchemaRenderer schema={childSchema} onlyRenderProperties />
          </div>,
          containerRef.current,
        );
    }
  };

  useMount(() => {
    renderContainer();
  });

  let childSchema = null;

  if (schema.properties) {
    const key = Object.keys(schema.properties).shift();
    const current = schema.properties[key];
    childSchema = current;
  }
  console.log({ schema });
  if (childSchema && childSchema['x-component'] === 'Action.Popover') {
    return (
      <Popover
        trigger={['click']}
        title={childSchema.title}
        {...childSchema['x-component-props']}
        content={
          <div>
            <SchemaRenderer schema={childSchema} onlyRenderProperties />
          </div>
        }
      >
        <Button {...others}>{field.title}</Button>
      </Popover>
    );
  }

  return (
    <Button
      {...others}
      onClick={async () => {
        if (!childSchema) {
          return await run();
        }
        if (childSchema['x-component'] === 'Action.Drawer') {
          Drawer.open({
            title: childSchema.title,
            ...(childSchema['x-component-props'] || {}),
            content: () => {
              return (
                <div>
                  <SchemaRenderer schema={childSchema} onlyRenderProperties />
                </div>
              );
            },
          });
        }
        if (childSchema['x-component'] === 'Action.Container') {
          renderContainer();
        }
      }}
    >
      {field.title}
      <DesignableBar />
    </Button>
  );
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

Action.Container = ({ children }) => {
  return children;
};

Action.Popover = ({ children }) => {
  return children;
};

Action.Drawer = ({ children }) => {
  return children;
};

Action.Modal = ({ children }) => {
  return children;
};

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
