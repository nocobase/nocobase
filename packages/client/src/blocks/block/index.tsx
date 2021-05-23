import React from 'react';
import { Dropdown, Menu, Card, Button, Popover } from 'antd';
import { useDynamicList } from 'ahooks';
import { MenuOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import './style.less';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaField } from '../../fields';

export function AddNewAction(props) {
  const { insert, children } = props;
  const menu = (
    <Menu>
      <Menu.Item
        key="page"
        onClick={() => {
          FormDialog(`新建区块`, () => {
            return (
              <FormLayout labelCol={6} wrapperCol={10}>
                <SchemaField>
                  <SchemaField.String
                    name="name"
                    required
                    title="数据源"
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
        <MenuOutlined /> 新建区块
      </Menu.Item>
    </Menu>
  );
  return <Dropdown overlay={menu}>{children || <PlusOutlined />}</Dropdown>;
}

export function SettingAction(props) {
  const { remove } = props;
  const menu = (
    <Menu>
      <Menu.Item onClick={() => remove()} key="delete">
        <DeleteOutlined /> 删除区块
      </Menu.Item>
    </Menu>
  );
  return (
    <Dropdown overlay={menu}>
      <MenuOutlined />
    </Dropdown>
  );
}

export function BlockItem(props) {
  const { remove, insert, replace } = props;
  return (
    <div className={'block-item'}>
      <div className={'block-item-actions'}>
        <SettingAction replace={replace} remove={remove} />
        <AddNewAction insert={insert} />
      </div>
      <div className={'block-item-body'}>
        <Card bordered={false} title={'这是测试区块'}>
          这是内容区
        </Card>
      </div>
    </div>
  );
}

export default (props) => {
  const { list, push, remove, replace, insert } = useDynamicList(props.items);
  return (
    <div className={'block-list'}>
      {list.map((item, index) => (
        <BlockItem
          insert={(data) => insert(index + 1, data)}
          replace={(data) => replace(index, data)}
          remove={() => remove(index)}
          key={index}
          schema={item}
        />
      ))}
      <br />
      <AddNewAction insert={(data) => push(data)}>
        <Button block type={'dashed'} icon={<PlusOutlined />}></Button>
      </AddNewAction>
    </div>
  );
};
