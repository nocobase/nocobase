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
import { useDesignable, VisibleContext, useDefaultAction } from '..';
import './style.less';
import { uid } from '@formily/shared';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import { FormLayout } from '@formily/antd';
import IconPicker from '../../components/icon-picker';

export const Action: any = observer((props: any) => {
  const { useAction = useDefaultAction, icon, ...others } = props;
  const { run } = useAction();
  const { schema, DesignableBar } = useDesignable();
  const [visible, setVisible] = useState(false);
  const child = Object.values(schema.properties || {}).shift();
  const isDropdownOrPopover =
    child &&
    ['Action.Dropdown', 'Action.Popover'].includes(child['x-component']);
  console.log({ DesignableBar, schema });
  return (
    <VisibleContext.Provider value={[visible, setVisible]}>
      {!isDropdownOrPopover && (
        <Button
          {...others}
          icon={<IconPicker type={icon} />}
          onClick={async () => {
            setVisible(true);
            await run();
          }}
        >
          {schema.title}
          <DesignableBar />
        </Button>
      )}
      <RecursionField schema={schema} onlyRenderProperties />
    </VisibleContext.Provider>
  );
});

Action.Link = observer((props: any) => {
  const { schema } = useDesignable();
  return <Link {...props}>{schema.title}</Link>;
});

Action.URL = observer((props: any) => {
  const { schema } = useDesignable();
  return (
    <a target={'_blank'} {...props}>
      {schema.title}
    </a>
  );
});

Action.Modal = observer((props: any) => {
  const {
    useOkAction = useDefaultAction,
    useCancelAction = useDefaultAction,
    ...others
  } = props;
  const { schema } = useDesignable();
  const [visible, setVisible] = useContext(VisibleContext);
  const form = useForm();
  const { run: runOk } = useOkAction();
  const { run: runCancel } = useCancelAction();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  return (
    <Modal
      title={schema.title}
      destroyOnClose
      maskClosable
      footer={
        isFormDecorator
          ? [
              <Button
                onClick={async () => {
                  if (isFormDecorator) {
                    form.clearErrors();
                  }
                  runCancel && (await runCancel());
                  setVisible(false);
                }}
              >
                Cancel
              </Button>,
              <Button
                type={'primary'}
                onClick={async () => {
                  if (isFormDecorator) {
                    await form.submit();
                  }
                  runOk && (await runOk());
                  setVisible(false);
                }}
              >
                OK
              </Button>,
            ]
          : null
      }
      {...others}
      onCancel={async () => {
        if (isFormDecorator) {
          form.clearErrors();
        }
        runCancel && (await runCancel());
        setVisible(false);
      }}
      visible={visible}
    >
      <FormLayout layout={'vertical'}>{props.children}</FormLayout>
    </Modal>
  );
});

Action.Drawer = observer((props: any) => {
  const {
    useOkAction = useDefaultAction,
    useCancelAction = useDefaultAction,
    ...others
  } = props;
  const { schema } = useDesignable();
  const [visible, setVisible] = useContext(VisibleContext);
  const form = useForm();
  const { run: runOk } = useOkAction();
  const { run: runCancel } = useCancelAction();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  return (
    <Drawer
      width={'50%'}
      title={schema.title}
      maskClosable
      destroyOnClose
      footer={
        isFormDecorator && (
          <Space style={{ float: 'right' }}>
            <Button
              onClick={async (e) => {
                form.clearErrors();
                props.onClose && (await props.onClose(e));
                runCancel && (await runCancel());
                setVisible(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async (e) => {
                await form.submit();
                props.onOk && (await props.onOk(e));
                runOk && (await runOk());
                setVisible(false);
              }}
              type={'primary'}
            >
              OK
            </Button>
          </Space>
        )
      }
      {...others}
      visible={visible}
      onClose={async (e) => {
        props.onClose && (await props.onClose(e));
        runCancel && (await runCancel());
        setVisible(false);
      }}
    >
      <FormLayout layout={'vertical'}>{props.children}</FormLayout>
    </Drawer>
  );
});

Action.Dropdown = observer((props: any) => {
  const { buttonProps = {}, ...others } = props;
  const { schema } = useDesignable();
  const componentProps = schema.parent['x-component-props'] || {};
  return (
    <Dropdown
      trigger={['click']}
      {...others}
      overlay={
        <Menu>
          <RecursionField schema={schema} onlyRenderProperties />
        </Menu>
      }
    >
      <Button {...buttonProps} {...componentProps}>{schema.title || schema.parent.title}</Button>
    </Dropdown>
  );
});

Action.Popover = observer((props) => {
  const fieldSchema = useFieldSchema();
  const { schema } = useDesignable();
  const form = useForm();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  const [visible, setVisible] = useContext(VisibleContext);
  console.log('Action.Popover', schema, fieldSchema);
  const componentProps =
    (schema.parent && schema.parent['x-component-props']) || {};
  return (
    <Popover
      visible={visible}
      trigger={['click']}
      onVisibleChange={setVisible}
      {...props}
      title={schema.title}
      content={
        <div>
          {props.children}
          {isFormDecorator && (
            <div>
              <Space>
                <Button
                  onClick={() => {
                    form.clearErrors();
                    setVisible(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type={'primary'}
                  onClick={async () => {
                    await form.submit();
                    setVisible(false);
                  }}
                >
                  Ok
                </Button>
              </Space>
            </div>
          )}
        </div>
      }
    >
      <Button {...componentProps}>{schema.parent.title || schema.title}</Button>
    </Popover>
  );
});

Action.DesignableBar = () => {
  const field = useField();
  // const schema = useFieldSchema();
  const { schema, insertAfter, refresh } = useDesignable();
  const [visible, setVisible] = useState(false);
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
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
                  // console.log({ field, schema });
                  schema.title = '按钮文案被修改了';
                  // field.setTitle('按钮文案被修改了');
                  // setVisible(false);
                  refresh();
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
