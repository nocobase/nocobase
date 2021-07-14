import React, { useState } from 'react';
import {
  observer,
  connect,
  useField,
  RecursionField,
  ISchema,
  Schema,
  useFieldSchema,
} from '@formily/react';
import { ArrayCollapse } from '@formily/antd';
import { uid } from '@formily/shared';
import '@formily/antd/lib/form-tab/style';
import { Collapse, Button, Dropdown, Menu, Tag } from 'antd';
import { options, interfaces } from './interfaces';
import { DeleteOutlined } from '@ant-design/icons';

export const DatabaseField: any = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  console.log('DatabaseField', field.componentProps);
  const [activeKey, setActiveKey] = useState(null);
  return (
    <div>
      <Collapse
        activeKey={activeKey}
        onChange={(key) => {
          setActiveKey(key);
        }}
        accordion
      >
        {field.value?.map((item, index) => {
          const schema = interfaces.get(item.interface);
          console.log({ schema });
          return (
            <Collapse.Panel
              header={
                <>
                  {(item.ui && item.ui.title) || <i style={{color: 'rgba(0, 0, 0, 0.25)'}}>未命名</i>}{' '}
                  <Tag>{schema.title}</Tag>
                  <span style={{ color: 'rgba(0, 0, 0, 0.25)', fontSize: 14 }}>{item.name}</span>
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
            {options.map(option => (
              <Menu.ItemGroup title={option.label}>
                {
                  option.children.map(item => (
                    <Menu.Item key={item.name}>{item.title}</Menu.Item>
                  ))
                }
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
