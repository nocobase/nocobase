import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Dropdown } from 'antd';
import {
  AppstoreOutlined,
  MenuOutlined,
  SettingOutlined,
  PlusOutlined,
  DashboardOutlined,
  LinkOutlined,
  GroupOutlined,
  EditOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import './style.less';
import Icon from '../Icon';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaField } from '../../fields';
import { useDynamicList } from 'ahooks';

const { SubMenu } = Menu;

export function generateName(): string {
  return `${Math.random()
    .toString(36)
    .replace('0.', '')
    .slice(-4)
    .padStart(4, '0')}`;
}

export function AddNewAction(props) {
  const { data } = props;
  const insert = (values: MenuItemOptions) => {
    props.insert && props.insert({ ...values, name: generateName() });
  };
  const prefix = data ? `在${data.title}后面` : '';
  const menu = (
    <Menu>
      <Menu.Item
        key="page"
        onClick={() => {
          FormDialog(`${prefix}新建菜单`, () => {
            return (
              <FormLayout labelCol={6} wrapperCol={10}>
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
            .then(insert);
        }}
      >
        <MenuOutlined /> 新建菜单
      </Menu.Item>
      <Menu.Item
        key="group"
        onClick={() => {
          FormDialog(`${prefix}新建分组`, () => {
            return (
              <FormLayout labelCol={6} wrapperCol={10}>
                <SchemaField>
                  <SchemaField.String
                    name="title"
                    required
                    title="分组名称"
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
            .then((data) =>
              insert({ ...data, name: generateName(), children: [] }),
            );
        }}
      >
        <GroupOutlined /> 新建分组
      </Menu.Item>
      <Menu.Item
        key="link"
        onClick={() => {
          FormDialog(`${prefix}添加链接`, () => {
            return (
              <FormLayout labelCol={6} wrapperCol={10}>
                <SchemaField>
                  <SchemaField.String
                    name="title"
                    required
                    title="标题"
                    x-decorator="FormItem"
                    x-component="Input"
                  />
                  <SchemaField.String
                    name="link"
                    title="链接"
                    x-decorator="FormItem"
                    x-component="Input"
                  />
                </SchemaField>
              </FormLayout>
            );
          })
            .open({})
            .then(insert);
        }}
      >
        <LinkOutlined /> 添加链接
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu}>{props.children || <PlusOutlined />}</Dropdown>
  );
}

export function SettingAction(props) {
  const { initialValues, replace, remove } = props;
  const menu = (
    <Menu>
      <Menu.Item
        onClick={() => {
          console.log({ initialValues });
          FormDialog('编辑菜单', () => {
            return (
              <FormLayout labelCol={6} wrapperCol={10}>
                <SchemaField>
                  <SchemaField.String
                    name="title"
                    required
                    title="菜单名称"
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
                {/* <FormDialog.Footer>
                <span style={{ marginLeft: 4 }}>扩展文案</span>
              </FormDialog.Footer> */}
              </FormLayout>
            );
          })
            .open({
              initialValues,
            })
            .then(replace);
        }}
        key="edit"
      >
        <EditOutlined /> 编辑菜单
      </Menu.Item>
      <Menu.Item key="move">
        <ArrowRightOutlined /> 移动到
      </Menu.Item>
      <Menu.Item onClick={() => remove()} key="delete">
        <DeleteOutlined /> 删除菜单
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu}>
      <MenuOutlined />
    </Dropdown>
  );
}

export interface MenuItemOptions {
  name: string;
  title: string;
  icon: string;
  children?: MenuItemOptions[];
  [key: string]: any;
}

export interface MenuProps {
  mode?: 'vertical' | 'mix';
  defaultValue?: string;
  items?: MenuItemOptions[];
  children?: any;
  [key: string]: any;
}

export function VerticalMenu(props: MenuProps) {
  const { items, style, onSelect } = props;
  const { list, remove, replace, insert, push, resetList } =
    useDynamicList(items);

  useEffect(() => {
    resetList(items);
  }, [items]);

  const renderItems = (items: MenuItemOptions[]) => {
    return items.map((item, index) => {
      if (item.children) {
        return (
          <SubMenu
            key={item.name}
            title={
              <span>
                {item.icon && <Icon type={item.icon} />}
                {item.title}{' '}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className={'menu-icons'}
                >
                  <SettingAction
                    data={item}
                    initialValues={item}
                    remove={() => remove(index)}
                    replace={(data: MenuItemOptions) => replace(index, data)}
                  />
                  <AddNewAction
                    data={item}
                    insert={(data: MenuItemOptions) => insert(index + 1, data)}
                  />
                </span>
              </span>
            }
          >
            {renderItems(item.children)}
          </SubMenu>
        );
      }

      return (
        <Menu.Item
          key={item.name}
          icon={item.icon && <Icon type={item.icon} />}
        >
          {item.title}{' '}
          <span
            onClick={(e) => {
              e.stopPropagation();
            }}
            className={'menu-icons'}
          >
            <SettingAction
              data={item}
              initialValues={item}
              remove={() => remove(index)}
              replace={(data: MenuItemOptions) => replace(index, data)}
            />
            <AddNewAction
              data={item}
              insert={(data: MenuItemOptions) => insert(index + 1, data)}
            />
          </span>
        </Menu.Item>
      );
    });
  };

  return (
    <Menu onSelect={onSelect} style={style} mode={'inline'}>
      {renderItems(list)}
      <Menu.ItemGroup
        key="add"
        className={'menu-add'}
        title={
          <AddNewAction insert={(data: MenuItemOptions) => push(data)}>
            <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
          </AddNewAction>
        }
      ></Menu.ItemGroup>
    </Menu>
  );
}

export function MixMenu(props: MenuProps) {
  const { items, defaultValue, children, onSelect } = props;
  const { list, insert, replace, remove, resetList } = useDynamicList(items);
  const [value, setValue] = useState<any>(defaultValue);
  const currentItem = list.find((item) => item.name === value);

  useEffect(() => {
    resetList(items);
  }, [items]);

  console.log({ list, currentItem });

  return (
    <Layout>
      <Layout.Header>
        <Menu
          onSelect={(info) => {
            setValue(info.key);
            onSelect && onSelect(info);
          }}
          defaultSelectedKeys={[value]}
          theme={'dark'}
          mode={'horizontal'}
        >
          {list.map((item, index) => (
            <Menu.Item
              key={item.name}
              icon={item.icon && <Icon type={item.icon} />}
            >
              {item.title}{' '}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className={'menu-icons'}
              >
                <SettingAction
                  data={item}
                  initialValues={item}
                  remove={() => remove(index)}
                  replace={(data: MenuItemOptions) => replace(index, data)}
                />
                <AddNewAction
                  data={item}
                  insert={(data: MenuItemOptions) => insert(index + 1, data)}
                />
              </span>
            </Menu.Item>
          ))}
        </Menu>
      </Layout.Header>
      <Layout>
        {currentItem && currentItem.children && (
          <Layout.Sider width={256}>
            <VerticalMenu onSelect={onSelect} items={currentItem.children} />
          </Layout.Sider>
        )}
        <Layout.Content>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}

export default (props: MenuProps) => {
  return props.mode === 'vertical' ? (
    <VerticalMenu {...props} />
  ) : (
    <MixMenu {...props} />
  );
};
