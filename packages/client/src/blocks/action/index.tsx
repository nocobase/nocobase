import React, { useContext, useState } from 'react';
import {
  Input,
  FormItem,
  FormButtonGroup,
  Submit,
  Password,
} from '@formily/antd';
import { createForm } from '@formily/core';
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
import { SchemaBlock } from '../';
import ReactDOM from 'react-dom';
import get from 'lodash/get';
import {
  DesignableSchemaContext,
  RefreshDesignableSchemaContext,
} from '../SchemaField';
import {
  MenuOutlined,
  GroupOutlined,
  PlusOutlined,
  LinkOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';

import './style.less';

export function useSchemaQuery(segments?: any[]) {
  const context = useContext(DesignableSchemaContext);
  const refresh = useContext(RefreshDesignableSchemaContext);
  const fieldSchema = useFieldSchema();
  const field = useField();

  const getSchemaByPath = (path) => {
    let s: Schema = context;
    const names = [...path];
    // names.shift();
    while (s && names.length) {
      const name = names.shift();
      s = s.properties[name];
    }
    return s;
  };

  const schema = getSchemaByPath(segments || field.address.segments);

  return {
    refresh,
    schema,
  };
}

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
  Drawer?: React.FC<any>;
  Modal?: React.FC<any>;
  Dropdown?: React.FC<any>;
  DesignableBar?: React.FC<any>;
};

function Blank({ children }) {
  return children;
}

function useDesignableBar() {
  const schema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = get(options.components, schema['x-designable-bar']);

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

export const Action: ActionType = observer((props) => {
  const { useAction = useDefaultAction, ...others } = props;
  const field = useField();
  const { schema } = useSchemaQuery();
  const { run } = useAction();
  const { DesignableBar } = useDesignableBar();
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
            <SchemaBlock schema={childSchema} onlyRenderProperties />
          </div>
        }
      >
        <Button {...others}>{field.title}</Button>
      </Popover>
    );
  }
  return (
    <DesignableBar>
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
                    <SchemaBlock schema={childSchema} onlyRenderProperties />
                  </div>
                );
              },
            });
          }
          if (childSchema['x-component'] === 'Action.Container') {
            const el = document.createElement('div');
            const target = document.querySelector(
              childSchema['x-component-props']?.['container'],
            );
            target.childNodes.forEach((child) => child.remove());
            target.appendChild(el);
            ReactDOM.render(
              <div>
                <SchemaBlock schema={childSchema} onlyRenderProperties />
              </div>,
              el,
            );
          }
        }}
      >
        {field.title}
      </Button>
    </DesignableBar>
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

Action.DesignableBar = (props) => {
  const field = useField();
  const { schema, refresh } = useSchemaQuery();
  const [visible, setVisible] = useState(false);
  return (
    <div className={'designable'}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={classNames('designable-bar', { active: visible })}
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
                  refresh();
                  setVisible(false);
                }}
              >
                点击修改按钮文案
              </Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
      {props.children}
    </div>
  );
};
