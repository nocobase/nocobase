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
import {
  Button,
  Dropdown,
  Menu,
  Popover,
  Space,
  Drawer,
  Modal,
  Select,
  Tooltip,
} from 'antd';
import { Link, useHistory, LinkProps, Switch } from 'react-router-dom';
import {
  useDesignable,
  useDefaultAction,
  updateSchema,
  removeSchema,
} from '..';
import './style.less';
import { uid } from '@formily/shared';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import IconPicker from '../../components/icon-picker';
import {
  findPropertyByPath,
  getSchemaPath,
  SchemaField,
  useSchemaComponent,
} from '../../components/schema-renderer';
import { VisibleContext } from '../../context';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { ActionBar } from './ActionBar';
import { DragHandle, SortableItem } from '../../components/Sortable';
import { useDisplayedMapContext } from '../../constate';
import { Trans, useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';

export const ButtonComponentContext = createContext(null);

function getTooltipProps(tooltip) {
  const { t } = useTranslation();
  const compile = useCompile();
  if (typeof tooltip === 'string') {
    return { title: compile(tooltip) };
  }
  return tooltip;
}

export const Action: any = observer((props: any) => {
  const {
    tooltip,
    confirm,
    useAction = useDefaultAction,
    icon,
    ...others
  } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const { run } = useAction();
  const field = useField();
  const { schema, DesignableBar } = useDesignable();
  const [visible, setVisible] = useState(false);
  const child = Object.values(schema.properties || {}).shift();
  const isDropdownOrPopover =
    child &&
    ['Action.Dropdown', 'Action.Popover'].includes(child['x-component']);
  let button = (
    <Button
      {...others}
      icon={<IconPicker type={icon} />}
      onClick={async () => {
        setVisible(true);
        if (confirm) {
          Modal.confirm({
            ...confirm,
            async onOk() {
              await run();
            },
          });
        } else {
          await run();
        }
      }}
    >
      {compile(schema.title)}
      <DesignableBar path={getSchemaPath(schema)} />
    </Button>
  );
  console.log('tooltip', tooltip);
  if (tooltip) {
    button = <Tooltip {...getTooltipProps(tooltip)}>{button}</Tooltip>;
  }
  return (
    <ButtonComponentContext.Provider value={button}>
      <VisibleContext.Provider value={[visible, setVisible]}>
        {!isDropdownOrPopover && button}
        <RecursionField schema={schema} onlyRenderProperties />
      </VisibleContext.Provider>
    </ButtonComponentContext.Provider>
  );
});

Action.Link = observer((props: any) => {
  const { schema } = useDesignable();
  const compile = useCompile();
  return <Link {...props}>{compile(schema.title)}</Link>;
});

Action.URL = observer((props: any) => {
  const { schema } = useDesignable();
  const compile = useCompile();
  return (
    <a target={'_blank'} {...props}>
      {compile(schema.title)}
    </a>
  );
});

Action.Group = observer((props: any) => {
  const { type = 'button' } = props;
  const { root, schema, insertAfter, remove } = useDesignable();
  const moveToAfter = (path1, path2) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(data.toJSON(), path2);
  };
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <DndContext
      onDragStart={(event) => {
        console.log({ event });
        setDragOverlayContent(event.active.data?.current?.title || '');
      }}
      onDragEnd={async (event) => {
        const path1 = event.active?.data?.current?.path;
        const path2 = event.over?.data?.current?.path;
        const data = moveToAfter(path1, path2);
        await updateSchema(data);
      }}
    >
      {createPortal(
        <DragOverlay
          zIndex={2222}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          dropAnimation={{
            duration: 10,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {dragOverlayContent}
        </DragOverlay>,
        document.body,
      )}
      <div className={cls(`ant-btn-group-${type}`)}>
        <Space size={16}>
          {schema.mapProperties((s) => {
            return (
              <SortableItem
                id={s.name}
                data={{
                  title: s.title,
                  path: getSchemaPath(s),
                }}
              >
                <RecursionField name={s.name} schema={s} />
              </SortableItem>
            );
          })}
        </Space>
      </div>
    </DndContext>
  );
});

Action.Modal = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
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
  const field = useField();
  console.log('Action.Modal.field', schema['x-read-pretty']);
  return (
    <Modal
      title={compile(schema.title)}
      destroyOnClose
      maskClosable
      width={'50%'}
      footer={
        isFormDecorator && !schema['x-read-pretty']
          ? [
              <Button
                onClick={async () => {
                  if (isFormDecorator) {
                    form.clearErrors();
                  }
                  runCancel && (await runCancel());
                  setVisible(false);
                  if (isFormDecorator) {
                    await form.reset();
                  }
                }}
              >
                {t('Cancel')}
              </Button>,
              <Button
                type={'primary'}
                onClick={async () => {
                  if (isFormDecorator) {
                    await form.submit();
                  }
                  runOk && (await runOk());
                  setVisible(false);
                  if (isFormDecorator) {
                    await form.reset();
                  }
                }}
              >
                {t('Submit')}
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
        if (isFormDecorator) {
          await form.reset();
        }
      }}
      visible={visible}
    >
      <FormLayout layout={'vertical'}>{props.children}</FormLayout>
    </Modal>
  );
});

Action.Drawer = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
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
  console.log('Action.Modal.field', schema['x-read-pretty']);
  return (
    <>
      {createPortal(
        <Drawer
          width={'50%'}
          title={compile(schema.title)}
          maskClosable
          destroyOnClose
          footer={
            isFormDecorator &&
            !schema['x-read-pretty'] && (
              <Space style={{ float: 'right' }}>
                <Button
                  onClick={async (e) => {
                    form.clearErrors();
                    props.onClose && (await props.onClose(e));
                    runCancel && (await runCancel());
                    setVisible(false);
                    if (isFormDecorator) {
                      await form.reset();
                    }
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  onClick={async (e) => {
                    await form.submit();
                    props.onOk && (await props.onOk(e));
                    runOk && (await runOk());
                    setVisible(false);
                    if (isFormDecorator) {
                      await form.reset();
                    }
                  }}
                  type={'primary'}
                >
                  {t('Submit')}
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
            if (isFormDecorator) {
              await form.reset();
            }
          }}
        >
          <FormLayout layout={'vertical'}>{props.children}</FormLayout>
        </Drawer>,
        document.body,
      )}
    </>
  );
});

Action.Dropdown = observer((props: any) => {
  const button = useContext(ButtonComponentContext);
  const { root, schema, insertAfter, remove } = useDesignable();
  const moveToAfter = (path1, path2) => {
    if (!path1 || !path2) {
      return;
    }
    if (path1.join('.') === path2.join('.')) {
      return;
    }
    const data = findPropertyByPath(root, path1);
    if (!data) {
      return;
    }
    remove(path1);
    return insertAfter(data.toJSON(), path2);
  };
  const [dragOverlayContent, setDragOverlayContent] = useState('');
  return (
    <DndContext
      onDragStart={(event) => {
        console.log({ event });
        setDragOverlayContent(event.active.data?.current?.title || '');
      }}
      onDragEnd={async (event) => {
        const path1 = event.active?.data?.current?.path;
        const path2 = event.over?.data?.current?.path;
        const data = moveToAfter(path1, path2);
        await updateSchema(data);
      }}
    >
      {createPortal(
        <DragOverlay
          zIndex={2222}
          style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
          dropAnimation={{
            duration: 10,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
        >
          {dragOverlayContent}
        </DragOverlay>,
        document.body,
      )}
      <Dropdown
        trigger={['hover']}
        {...props}
        overlay={
          <Menu>
            <RecursionField schema={schema} onlyRenderProperties />
          </Menu>
        }
      >
        <span>{button}</span>
      </Dropdown>
    </DndContext>
  );
});

Action.Popover = observer((props) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { schema } = useDesignable();
  const form = useForm();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  const [visible, setVisible] = useContext(VisibleContext);
  const button = useContext(ButtonComponentContext);
  return (
    <Popover
      visible={visible}
      trigger={['click']}
      onVisibleChange={setVisible}
      {...props}
      title={compile(schema.title)}
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
                  {t('Cancel')}
                </Button>
                <Button
                  type={'primary'}
                  onClick={async () => {
                    await form.submit();
                    setVisible(false);
                  }}
                >
                  {t('Submit')}
                </Button>
              </Space>
            </div>
          )}
        </div>
      }
    >
      {button}
    </Popover>
  );
});

Action.DesignableBar = (props: any) => {
  const { t } = useTranslation();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const isPopup = Object.keys(schema.properties || {}).length > 0;
  const displayed = useDisplayedMapContext();
  const field = useField();
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={2}>
          <DragHandle />
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  onClick={async (e) => {
                    const values = await FormDialog(t('Edit button'), () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField
                            schema={{
                              type: 'object',
                              properties: {
                                title: {
                                  type: 'string',
                                  title: t('Display name'),
                                  required: true,
                                  'x-decorator': 'FormItem',
                                  'x-component': 'Input',
                                },
                                icon: {
                                  type: 'string',
                                  title: t('Icon'),
                                  'x-decorator': 'FormItem',
                                  'x-component': 'IconPicker',
                                },
                              },
                            }}
                          />
                        </FormLayout>
                      );
                    }).open({
                      initialValues: {
                        title: schema['title'],
                        icon: schema['x-component-props']?.['icon'],
                      },
                    });
                    schema['title'] = values.title;
                    schema['x-component-props']['icon'] = values.icon;
                    field.componentProps.icon = values.icon;
                    field.title = values.title;
                    updateSchema(schema);
                    refresh();
                  }}
                >
                  {t('Edit button')}
                </Menu.Item>
                {isPopup && (
                  <Menu.Item>
                    <Trans>
                      Open in
                      <Select
                        bordered={false}
                        size={'small'}
                        defaultValue={'Action.Modal'}
                        onChange={(value) => {
                          const s = Object.values(schema.properties).shift();
                          s['x-component'] = value;
                          refresh();
                          updateSchema(s);
                        }}
                      >
                        <Select.Option value={'Action.Modal'}>
                          Modal
                        </Select.Option>
                        <Select.Option value={'Action.Drawer'}>
                          Drawer
                        </Select.Option>
                        <Select.Option value={'Action.Window'}>
                          Window
                        </Select.Option>
                      </Select>
                    </Trans>
                  </Menu.Item>
                )}
                <Menu.Divider />
                <Menu.Item
                  onClick={async () => {
                    const displayName =
                      schema?.['x-decorator-props']?.['displayName'];
                    const data = remove();
                    await removeSchema(data);
                    if (displayName) {
                      displayed.remove(displayName);
                    }
                    setVisible(false);
                  }}
                >
                  {t('Hide')}
                </Menu.Item>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
};

Action.Bar = ActionBar;
