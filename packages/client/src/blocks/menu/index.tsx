import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  connect,
  observer,
  mapProps,
  mapReadPretty,
  useField,
  useFieldSchema,
  RecursionField,
  Schema,
  SchemaOptionsContext,
} from '@formily/react';
import {
  Menu as AntdMenu,
  MenuProps,
  MenuItemProps,
  SubMenuProps,
  DividerProps,
  Dropdown,
  Modal,
  Button,
} from 'antd';
import get from 'lodash/get';
import { FormDialog, FormLayout } from '@formily/antd';
import { uid } from '@formily/shared';
// import { useSchemaQuery } from '../grid';
import {
  DesignableSchemaContext,
  RefreshDesignableSchemaContext,
  SchemaField,
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
} from '@ant-design/icons';
import './style.less';
import { Icon } from '../icon-picker';
import { useHistory } from 'react-router-dom';
import cls from 'classnames';

export type MenuType = React.FC<MenuProps & { hideSubMenu?: boolean }> & {
  Item?: React.FC<MenuItemProps>;
  SubMenu?: React.FC<SubMenuProps>;
  Divider?: React.FC<DividerProps>;
  DesignableBar?: React.FC<any>;
  AddNew?: React.FC<any>;
  Link?: React.FC<MenuItemProps>;
  Url?: React.FC<MenuItemProps & { url: string }>;
};

function Blank() {
  return null;
}

function useDesignableBar() {
  const schema = useFieldSchema();

  let s = schema;
  let DesignableBarName;
  while (s.parent) {
    if (s.parent['x-component'] === 'Menu') {
      DesignableBarName = s.parent['x-designable-bar'];
      break;
    }
    s = s.parent;
  }

  const options = useContext(SchemaOptionsContext);
  const DesignableBar = DesignableBarName ? get(options.components, DesignableBarName) : null;

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

export function removeProperty(property: Schema) {
  property.parent.removeProperty(property.name);
}

export function addPropertyBefore(target, prop) {
  Object.keys(target.parent.properties).forEach((name) => {
    if (name === target.name) {
      target.parent.addProperty(prop.name, prop);
    }
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
  });
}

export function addPropertyAfter(target, prop) {
  Object.keys(target.parent.properties).forEach((name) => {
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
    if (name === target.name) {
      target.parent.addProperty(prop.name, prop);
    }
  });
}

export function useSchemaQuery(segments?: any[]) {
  const context = useContext(DesignableSchemaContext);
  const refresh = useContext(RefreshDesignableSchemaContext);
  const fieldSchema = useFieldSchema();
  const field = useField();

  const getSchemaByPath = (path) => {
    let s: Schema = context;
    const names = [...path];
    console.log('names', [...names], path, context);
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
    appendChild(data) {
      schema.addProperty(data.name, data);
      refresh();
    },
    insertAfter(data) {
      addPropertyAfter(schema, data);
      refresh();
    },
    insertBefore(data) {
      addPropertyBefore(schema, data);
      refresh();
    },
    push(data) {
      addPropertyBefore(schema, data);
    },
    remove() {
      removeProperty(schema);
      refresh();
    },
  };
}

const AddNewAction = () => {
  const field = useField();
  const segments = [...field.address.segments];
  // add new 节点是后加的，并不在菜单树上，要通过父节点处理 add 逻辑
  segments.pop();
  const { appendChild } = useSchemaQuery(segments);
  return (
    <Dropdown
      overlayStyle={{
        minWidth: 150,
      }}
      trigger={['click']}
      overlay={
        <AntdMenu>
          <AntdMenu.Item
            onClick={() => {
              FormDialog(`新建菜单`, () => {
                return (
                  <FormLayout layout={'vertical'}>
                    <SchemaField>
                      <SchemaField.String
                        name="title"
                        required
                        title="名称"
                        x-decorator="FormItem"
                        x-component="Input"
                      />
                      <SchemaField.String
                        name="icon"
                        title="图标"
                        x-decorator="FormItem"
                        x-component="IconPicker"
                      />
                    </SchemaField>
                  </FormLayout>
                );
              })
                .open({})
                .then((data) => {
                  appendChild({
                    name: `m_${uid()}`,
                    type: 'void',
                    title: data.title,
                    'x-component': 'Menu.Item',
                    'x-component-props': {
                      icon: data.icon,
                    },
                  });
                });
            }}
            style={{ minWidth: 150 }}
          >
            <MenuOutlined /> 新建菜单
          </AntdMenu.Item>
          <AntdMenu.Item
            onClick={() => {
              FormDialog(`新建菜单组`, () => {
                return (
                  <FormLayout layout={'vertical'}>
                    <SchemaField>
                      <SchemaField.String
                        name="title"
                        required
                        title="名称"
                        x-decorator="FormItem"
                        x-component="Input"
                      />
                      <SchemaField.String
                        name="icon"
                        title="图标"
                        x-decorator="FormItem"
                        x-component="IconPicker"
                      />
                    </SchemaField>
                  </FormLayout>
                );
              })
                .open({})
                .then((data) => {
                  appendChild({
                    name: `m_${uid()}`,
                    type: 'void',
                    title: data.title,
                    'x-component': 'Menu.SubMenu',
                    'x-component-props': {
                      icon: data.icon,
                    },
                    properties: {
                      [`m_${uid()}`]: {
                        type: 'void',
                        title: `菜单 ${uid()}`,
                        'x-component': 'Menu.Item',
                      },
                    },
                  });
                });
            }}
          >
            <GroupOutlined /> 新建分组
          </AntdMenu.Item>
          <AntdMenu.Item>
            <LinkOutlined /> 添加链接
          </AntdMenu.Item>
        </AntdMenu>
      }
    >
      <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
    </Dropdown>
  );
};

const SettingAction = () => {
  const field = useField();
  const [visible, setVisible] = useState(false);
  const { schema, refresh, remove, insertBefore, insertAfter, appendChild } =
    useSchemaQuery();
  const text =
    schema['x-component'] === 'Menu.SubMenu' ? '当前菜单组' : '当前菜单';
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={'designable-bar-actions'}
      >
        <Dropdown
          overlayStyle={{
            minWidth: 150,
          }}
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          trigger={['click']}
          overlay={
            <AntdMenu>
              <AntdMenu.Item
                onClick={() => {
                  FormDialog('编辑菜单', () => {
                    return (
                      <FormLayout layout={'vertical'}>
                        <SchemaField>
                          <SchemaField.String
                            name="title"
                            required
                            title="菜单名称"
                            x-decorator="FormItem"
                            x-component="Input"
                          />
                          <SchemaField.String
                            name=".icon"
                            title="图标"
                            x-decorator="FormItem"
                            x-component="IconPicker"
                          />
                        </SchemaField>
                        {/* <FormDialog.Footer>
                    <span style={{ marginLeft: 4 }}>扩展文案</span>
                  </FormDialog.Footer> */}
                      </FormLayout>
                    );
                  })
                    .open({
                      initialValues: {
                        title: schema.title,
                        icon: schema['x-component-props']?.['icon'],
                      },
                    })
                    .then((data) => {
                      schema.title = data.title;
                      const componentProps = schema['x-component-props'] || {};
                      componentProps['icon'] = data.icon;
                      field.setTitle(data.title);
                      field.setComponentProps(componentProps);
                      refresh();
                    });
                }}
              >
                <EditOutlined /> 编辑菜单
              </AntdMenu.Item>
              <AntdMenu.Item>
                <ArrowRightOutlined /> 移动到
              </AntdMenu.Item>
              <AntdMenu.Divider />
              <AntdMenu.SubMenu icon={<ArrowUpOutlined />} title={`${text}前`}>
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertBefore({
                          name: `m_${uid()}`,
                          type: 'void',
                          title: data.title,
                          'x-component': 'Menu.Item',
                          'x-component-props': {
                            icon: data.icon,
                          },
                        });
                      });
                  }}
                  style={{ minWidth: 150 }}
                >
                  <MenuOutlined /> 新建菜单
                </AntdMenu.Item>
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单组`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertBefore({
                          name: `m_${uid()}`,
                          type: 'void',
                          title: data.title,
                          'x-component': 'Menu.SubMenu',
                          'x-component-props': {
                            icon: data.icon,
                          },
                          properties: {
                            [`m_${uid()}`]: {
                              type: 'void',
                              title: `菜单 ${uid()}`,
                              'x-component': 'Menu.Item',
                            },
                          },
                        });
                      });
                  }}
                >
                  <GroupOutlined /> 新建分组
                </AntdMenu.Item>
                <AntdMenu.Item>
                  <LinkOutlined /> 添加链接
                </AntdMenu.Item>
              </AntdMenu.SubMenu>
              <AntdMenu.SubMenu
                icon={<ArrowDownOutlined />}
                title={`${text}后`}
              >
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertAfter(
                          new Schema({
                            name: `m_${uid()}`,
                            type: 'void',
                            title: data.title,
                            'x-component': 'Menu.Item',
                            'x-component-props': {
                              icon: data.icon,
                            },
                          }),
                        );
                      });
                  }}
                  style={{ minWidth: 150 }}
                >
                  <MenuOutlined /> 新建菜单
                </AntdMenu.Item>
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单组`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertAfter(
                          new Schema({
                            name: `m_${uid()}`,
                            type: 'void',
                            title: data.title,
                            'x-component': 'Menu.SubMenu',
                            'x-component-props': {
                              icon: data.icon,
                            },
                            properties: {
                              [`m_${uid()}`]: {
                                type: 'void',
                                title: `菜单 ${uid()}`,
                                'x-component': 'Menu.Item',
                              },
                            },
                          }),
                        );
                      });
                  }}
                >
                  <GroupOutlined /> 新建分组
                </AntdMenu.Item>
                <AntdMenu.Item>
                  <LinkOutlined /> 添加链接
                </AntdMenu.Item>
              </AntdMenu.SubMenu>
              {schema['x-component'] === 'Menu.SubMenu' ? (
                <AntdMenu.SubMenu
                  icon={<ArrowRightOutlined />}
                  title={`${text}里`}
                >
                  <AntdMenu.Item
                    onClick={() => {
                      FormDialog(`新建菜单`, () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField>
                              <SchemaField.String
                                name="title"
                                required
                                title="名称"
                                x-decorator="FormItem"
                                x-component="Input"
                              />
                              <SchemaField.String
                                name="icon"
                                title="图标"
                                x-decorator="FormItem"
                                x-component="IconPicker"
                              />
                            </SchemaField>
                          </FormLayout>
                        );
                      })
                        .open({})
                        .then((data) => {
                          appendChild(
                            new Schema({
                              name: `m_${uid()}`,
                              type: 'void',
                              title: data.title,
                              'x-component': 'Menu.Item',
                              'x-component-props': {
                                icon: data.icon,
                              },
                            }),
                          );
                        });
                    }}
                    style={{ minWidth: 150 }}
                  >
                    <MenuOutlined /> 新建菜单
                  </AntdMenu.Item>
                  <AntdMenu.Item
                    onClick={() => {
                      FormDialog(`新建菜单组`, () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField>
                              <SchemaField.String
                                name="title"
                                required
                                title="名称"
                                x-decorator="FormItem"
                                x-component="Input"
                              />
                              <SchemaField.String
                                name="icon"
                                title="图标"
                                x-decorator="FormItem"
                                x-component="IconPicker"
                              />
                            </SchemaField>
                          </FormLayout>
                        );
                      })
                        .open({})
                        .then((data) => {
                          appendChild(
                            new Schema({
                              name: `m_${uid()}`,
                              type: 'void',
                              title: data.title,
                              'x-component': 'Menu.SubMenu',
                              'x-component-props': {
                                icon: data.icon,
                              },
                              properties: {
                                [`m_${uid()}`]: {
                                  type: 'void',
                                  title: `菜单 ${uid()}`,
                                  'x-component': 'Menu.Item',
                                },
                              },
                            }),
                          );
                        });
                    }}
                  >
                    <GroupOutlined /> 新建分组
                  </AntdMenu.Item>
                  <AntdMenu.Item>
                    <LinkOutlined /> 添加链接
                  </AntdMenu.Item>
                </AntdMenu.SubMenu>
              ) : null}
              <AntdMenu.Divider />
              <AntdMenu.Item
                onClick={() => {
                  Modal.confirm({
                    title: '删除菜单',
                    content: '确认删除此菜单项吗？',
                    onOk: remove,
                  });
                }}
              >
                <DeleteOutlined /> 删除菜单
              </AntdMenu.Item>
            </AntdMenu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </div>
    </div>
  );
};

export const Menu: MenuType = observer((props) => {
  const { hideSubMenu, ...others } = props;
  // const schema = useFieldSchema();
  // console.log({ schema }, 'Menu');
  return <AntdMenu {...others} />;
});

Menu.AddNew = observer((props) => {
  const field = useField();
  const { schema } = useSchemaQuery();
  console.log('AddNew', field.address.segments);
  return (
    <AntdMenu.ItemGroup
      key="add"
      className={'menu-add'}
      title={<AddNewAction />}
    ></AntdMenu.ItemGroup>
  );
});

Menu.Url = observer((props) => {
  const field = useField();
  const { schema, refresh } = useSchemaQuery();
  return (
    <AntdMenu.Item
      {...props}
      schema={schema}
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      onClick={(e) => {
        window.open(props.url);
      }}
      icon={props.icon ? <Icon type={props.icon as string} /> : undefined}
    >
      {field.title} <SettingAction />
    </AntdMenu.Item>
  );
});

Menu.Link = observer((props) => {
  const history = useHistory();
  const field = useField();
  const { schema, refresh } = useSchemaQuery();
  return (
    <AntdMenu.Item
      {...props}
      schema={schema}
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      onClick={(e) => {
        history.push(schema.name as string);
      }}
      icon={props.icon ? <Icon type={props.icon as string} /> : undefined}
    >
      {field.title} <SettingAction />
    </AntdMenu.Item>
  );
});

Menu.Item = observer((props) => {
  const field = useField();
  const { DesignableBar } = useDesignableBar();
  const { schema, refresh } = useSchemaQuery();
  return (
    <AntdMenu.Item
      {...props}
      onMouseEnter={(e) => {
        const el = e.domEvent.target as HTMLElement;
        console.log(
          'onMouseEnter',
          el.offsetTop,
          el.offsetLeft,
          el.clientWidth,
          el.clientHeight,
        );
      }}
      onMouseLeave={() => {
        console.log('onMouseLeave');
      }}
      schema={schema}
      // @ts-ignore
      eventKey={schema.name}
      key={schema.name}
      icon={props.icon ? <Icon type={props.icon as string} /> : undefined}
    >
      {field.title}
      <DesignableBar />
    </AntdMenu.Item>
  );
});

Menu.DesignableBar = (props) => {
  const field = useField();
  const [visible, setVisible] = useState(false);
  const { schema, refresh, remove, insertBefore, insertAfter, appendChild } =
    useSchemaQuery();
  const text =
    schema['x-component'] === 'Menu.SubMenu' ? '当前菜单组' : '当前菜单';
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={'designable-bar-actions'}
      >
        <Dropdown
          overlayStyle={{
            minWidth: 150,
          }}
          visible={visible}
          onVisibleChange={(visible) => {
            setVisible(visible);
          }}
          trigger={['click']}
          overlay={
            <AntdMenu>
              <AntdMenu.Item
                onClick={() => {
                  FormDialog('编辑菜单', () => {
                    return (
                      <FormLayout layout={'vertical'}>
                        <SchemaField>
                          <SchemaField.String
                            name="title"
                            required
                            title="菜单名称"
                            x-decorator="FormItem"
                            x-component="Input"
                          />
                          <SchemaField.String
                            name=".icon"
                            title="图标"
                            x-decorator="FormItem"
                            x-component="IconPicker"
                          />
                        </SchemaField>
                        {/* <FormDialog.Footer>
                    <span style={{ marginLeft: 4 }}>扩展文案</span>
                  </FormDialog.Footer> */}
                      </FormLayout>
                    );
                  })
                    .open({
                      initialValues: {
                        title: schema.title,
                        icon: schema['x-component-props']?.['icon'],
                      },
                    })
                    .then((data) => {
                      schema.title = data.title;
                      const componentProps = schema['x-component-props'] || {};
                      componentProps['icon'] = data.icon;
                      field.setTitle(data.title);
                      field.setComponentProps(componentProps);
                      refresh();
                    });
                }}
              >
                <EditOutlined /> 编辑菜单
              </AntdMenu.Item>
              <AntdMenu.Item>
                <ArrowRightOutlined /> 移动到
              </AntdMenu.Item>
              <AntdMenu.Divider />
              <AntdMenu.SubMenu icon={<ArrowUpOutlined />} title={`${text}前`}>
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertBefore({
                          name: `m_${uid()}`,
                          type: 'void',
                          title: data.title,
                          'x-component': 'Menu.Item',
                          'x-component-props': {
                            icon: data.icon,
                          },
                        });
                      });
                  }}
                  style={{ minWidth: 150 }}
                >
                  <MenuOutlined /> 新建菜单
                </AntdMenu.Item>
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单组`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertBefore({
                          name: `m_${uid()}`,
                          type: 'void',
                          title: data.title,
                          'x-component': 'Menu.SubMenu',
                          'x-component-props': {
                            icon: data.icon,
                          },
                          properties: {
                            [`m_${uid()}`]: {
                              type: 'void',
                              title: `菜单 ${uid()}`,
                              'x-component': 'Menu.Item',
                            },
                          },
                        });
                      });
                  }}
                >
                  <GroupOutlined /> 新建分组
                </AntdMenu.Item>
                <AntdMenu.Item>
                  <LinkOutlined /> 添加链接
                </AntdMenu.Item>
              </AntdMenu.SubMenu>
              <AntdMenu.SubMenu
                icon={<ArrowDownOutlined />}
                title={`${text}后`}
              >
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertAfter(
                          new Schema({
                            name: `m_${uid()}`,
                            type: 'void',
                            title: data.title,
                            'x-component': 'Menu.Item',
                            'x-component-props': {
                              icon: data.icon,
                            },
                          }),
                        );
                      });
                  }}
                  style={{ minWidth: 150 }}
                >
                  <MenuOutlined /> 新建菜单
                </AntdMenu.Item>
                <AntdMenu.Item
                  onClick={() => {
                    FormDialog(`新建菜单组`, () => {
                      return (
                        <FormLayout layout={'vertical'}>
                          <SchemaField>
                            <SchemaField.String
                              name="title"
                              required
                              title="名称"
                              x-decorator="FormItem"
                              x-component="Input"
                            />
                            <SchemaField.String
                              name="icon"
                              title="图标"
                              x-decorator="FormItem"
                              x-component="IconPicker"
                            />
                          </SchemaField>
                        </FormLayout>
                      );
                    })
                      .open({})
                      .then((data) => {
                        insertAfter(
                          new Schema({
                            name: `m_${uid()}`,
                            type: 'void',
                            title: data.title,
                            'x-component': 'Menu.SubMenu',
                            'x-component-props': {
                              icon: data.icon,
                            },
                            properties: {
                              [`m_${uid()}`]: {
                                type: 'void',
                                title: `菜单 ${uid()}`,
                                'x-component': 'Menu.Item',
                              },
                            },
                          }),
                        );
                      });
                  }}
                >
                  <GroupOutlined /> 新建分组
                </AntdMenu.Item>
                <AntdMenu.Item>
                  <LinkOutlined /> 添加链接
                </AntdMenu.Item>
              </AntdMenu.SubMenu>
              {schema['x-component'] === 'Menu.SubMenu' ? (
                <AntdMenu.SubMenu
                  icon={<ArrowRightOutlined />}
                  title={`${text}里`}
                >
                  <AntdMenu.Item
                    onClick={() => {
                      FormDialog(`新建菜单`, () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField>
                              <SchemaField.String
                                name="title"
                                required
                                title="名称"
                                x-decorator="FormItem"
                                x-component="Input"
                              />
                              <SchemaField.String
                                name="icon"
                                title="图标"
                                x-decorator="FormItem"
                                x-component="IconPicker"
                              />
                            </SchemaField>
                          </FormLayout>
                        );
                      })
                        .open({})
                        .then((data) => {
                          appendChild(
                            new Schema({
                              name: `m_${uid()}`,
                              type: 'void',
                              title: data.title,
                              'x-component': 'Menu.Item',
                              'x-component-props': {
                                icon: data.icon,
                              },
                            }),
                          );
                        });
                    }}
                    style={{ minWidth: 150 }}
                  >
                    <MenuOutlined /> 新建菜单
                  </AntdMenu.Item>
                  <AntdMenu.Item
                    onClick={() => {
                      FormDialog(`新建菜单组`, () => {
                        return (
                          <FormLayout layout={'vertical'}>
                            <SchemaField>
                              <SchemaField.String
                                name="title"
                                required
                                title="名称"
                                x-decorator="FormItem"
                                x-component="Input"
                              />
                              <SchemaField.String
                                name="icon"
                                title="图标"
                                x-decorator="FormItem"
                                x-component="IconPicker"
                              />
                            </SchemaField>
                          </FormLayout>
                        );
                      })
                        .open({})
                        .then((data) => {
                          appendChild(
                            new Schema({
                              name: `m_${uid()}`,
                              type: 'void',
                              title: data.title,
                              'x-component': 'Menu.SubMenu',
                              'x-component-props': {
                                icon: data.icon,
                              },
                              properties: {
                                [`m_${uid()}`]: {
                                  type: 'void',
                                  title: `菜单 ${uid()}`,
                                  'x-component': 'Menu.Item',
                                },
                              },
                            }),
                          );
                        });
                    }}
                  >
                    <GroupOutlined /> 新建分组
                  </AntdMenu.Item>
                  <AntdMenu.Item>
                    <LinkOutlined /> 添加链接
                  </AntdMenu.Item>
                </AntdMenu.SubMenu>
              ) : null}
              <AntdMenu.Divider />
              <AntdMenu.Item
                onClick={() => {
                  Modal.confirm({
                    title: '删除菜单',
                    content: '确认删除此菜单项吗？',
                    onOk: remove,
                  });
                }}
              >
                <DeleteOutlined /> 删除菜单
              </AntdMenu.Item>
            </AntdMenu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </div>
    </div>
  );
};

Menu.SubMenu = observer((props) => {
  const { DesignableBar } = useDesignableBar();
  const schema = useFieldSchema();
  let s = schema;
  let hideSubMenu;
  while (s.parent) {
    if (s.parent['x-component'] === 'Menu') {
      hideSubMenu = s.parent['x-component-props']?.['hideSubMenu'];
      break;
    }
    s = s.parent;
  }
  if (hideSubMenu) {
    return <Menu.Item {...props} />;
  }
  return (
    <AntdMenu.SubMenu
      {...props}
      // @ts-ignore
      schema={schema}
      title={
        <>
          {schema.title} <DesignableBar />
        </>
      }
      eventKey={schema.name}
      key={schema.name}
      icon={
        props.icon ? (
          <RecursionField
            name={schema.name}
            schema={
              new Schema({
                type: 'string',
                'x-read-pretty': true,
                default: props.icon,
                'x-component': 'IconPicker',
              })
            }
            onlyRenderProperties
          />
        ) : undefined
      }
    />
  );
});

Menu.Divider = observer(AntdMenu.Divider);

export default Menu;
