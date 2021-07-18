import React, { useState } from 'react';
import {
  observer,
  connect,
  useField,
  RecursionField,
  ISchema,
  Schema,
  useFieldSchema,
  useForm,
} from '@formily/react';
import { ArrayCollapse, FormLayout } from '@formily/antd';
import { uid } from '@formily/shared';
import '@formily/antd/lib/form-tab/style';
import {
  Collapse,
  Button,
  Dropdown,
  Menu,
  Tag,
  Select,
  Divider,
  Input,
} from 'antd';
import { options, interfaces } from './interfaces';
import {
  DeleteOutlined,
  DatabaseOutlined,
  PlusOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import cls from 'classnames';
import './style.less';
import Modal from 'antd/lib/modal/Modal';
import { get } from 'lodash';
import { useEffect } from 'react';
import { useRequest } from 'ahooks';
import { createOrUpdateCollection, deleteCollection } from '..';

export const DatabaseCollection = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const schema = useFieldSchema();
  const [activeIndex, setActiveIndex] = useState(0);
  const form = useForm();
  const [newValue, setNewValue] = useState('');

  useRequest('collections:list?sort=-created_at', {
    formatResult: (result) => result?.data,
    onSuccess(data) {
      field.setValue(data);
      console.log('onSuccess', data);
    },
  });

  return (
    <div>
      <Button
        onClick={() => {
          setVisible(true);
        }}
        type={'primary'}
      >
        <DatabaseOutlined />
      </Button>
      <Modal
        title={
          <div style={{ textAlign: 'center' }}>
            <Select
              value={activeIndex}
              style={{ minWidth: 300, textAlign: 'center' }}
              onChange={(value) => {
                setActiveIndex(value as any);
              }}
              open={open}
              onDropdownVisibleChange={setOpen}
              optionLabelProp={'label'}
              dropdownRender={(menu) => {
                return (
                  <div>
                    {menu}
                    <Divider style={{ margin: '5px 0 4px' }} />
                    <div
                      style={{
                        cursor: 'pointer',
                        padding: '5px 12px',
                      }}
                    >
                      <Input.Search
                        size={'middle'}
                        placeholder={'新增数据表'}
                        enterButton={<PlusOutlined />}
                        value={newValue}
                        onChange={(e) => {
                          setNewValue(e.target.value);
                        }}
                        onSearch={async (value) => {
                          const data = {
                            name: uid(),
                            title: value,
                          };
                          field.push(data);
                          setActiveIndex(field.value.length - 1);
                          setOpen(false);
                          setNewValue('');
                          await createOrUpdateCollection(data);
                        }}
                      />
                    </div>
                  </div>
                );
              }}
            >
              {field.value?.map((item, index) => {
                return (
                  <Select.Option value={index} label={item.title || '未命名'}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {item.title || '未命名'}
                      <DeleteOutlined
                        onClick={async (e) => {
                          e.stopPropagation();
                          field.remove(index);
                          if (activeIndex === index) {
                            setActiveIndex(0);
                          } else if (activeIndex > index) {
                            setActiveIndex(activeIndex - 1);
                          }
                          await deleteCollection(item.name);
                        }}
                      />
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </div>
        }
        visible={visible}
        onCancel={() => {
          setVisible(false);
        }}
        onOk={async () => {
          try {
            form.clearErrors();
            await form.validate(`${field.address.entire}.${activeIndex}.*`);
            setVisible(false);
            await createOrUpdateCollection(field.value[activeIndex]);
            console.log(
              `${field.address.entire}.${activeIndex}.*`,
              field.value[activeIndex],
            );
          } catch (error) {}
        }}
      >
        <FormLayout layout={'vertical'}>
          <RecursionField
            name={activeIndex}
            schema={
              new Schema({
                type: 'object',
                properties: schema.properties,
              })
            }
          />
        </FormLayout>
      </Modal>
    </div>
  );
});

export const DatabaseField: any = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  console.log('DatabaseField', field.value);
  const [activeKey, setActiveKey] = useState(null);
  return (
    <div>
      <Collapse
        activeKey={activeKey}
        onChange={(key) => {
          setActiveKey(key);
        }}
        className={cls({ empty: !field.value?.length })}
        accordion
      >
        {field.value?.map((item, index) => {
          const schema = interfaces.get(item.interface);
          console.log({ schema });
          return (
            <Collapse.Panel
              header={
                <>
                  {(item.ui && item.ui.title) || (
                    <i style={{ color: 'rgba(0, 0, 0, 0.25)' }}>未命名</i>
                  )}{' '}
                  <Tag>{schema.title}</Tag>
                  <span style={{ color: 'rgba(0, 0, 0, 0.25)', fontSize: 14 }}>
                    {item.name}
                  </span>
                </>
              }
              extra={[
                <DeleteOutlined
                  onClick={() => {
                    field.remove(index);
                  }}
                />,
              ]}
              key={item.id}
            >
              <RecursionField
                key={`${item.id}_${index}`}
                name={index}
                schema={
                  new Schema({
                    type: 'object',
                    properties: {
                      layout: {
                        type: 'void',
                        'x-component': 'FormLayout',
                        'x-component-props': {
                          layout: 'vertical',
                          // labelCol: 4,
                          // wrapperCol: 20,
                        },
                        properties: schema.properties,
                      },
                    },
                  })
                }
              />
            </Collapse.Panel>
          );
        })}
      </Collapse>
      <Dropdown
        placement={'bottomCenter'}
        overlayStyle={{
          minWidth: 200,
        }}
        overlay={
          <Menu
            onClick={(info) => {
              const schema = interfaces.get(info.key);
              if (!schema) {
                return;
              }
              const data = {
                ...schema.default,
                id: uid(),
                name: uid(),
                interface: info.key,
              };
              field.push(data);
              setActiveKey(data.id);
              console.log('info.key', info.key, schema);
            }}
          >
            {options.map((option) => (
              <Menu.ItemGroup title={option.label}>
                {option.children.map((item) => (
                  <Menu.Item key={item.name}>{item.title}</Menu.Item>
                ))}
              </Menu.ItemGroup>
            ))}
          </Menu>
        }
      >
        <Button block type={'dashed'} style={{ marginTop: 10 }}>
          新增
        </Button>
      </Dropdown>
    </div>
  );
});
