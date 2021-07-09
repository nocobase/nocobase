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
import { interfaces } from './interfaces';
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
              // extra={[
              //   <Button onClick={() => field.moveUp(index)}>Up</Button>,
              //   <Button
              //     onClick={() => {
              //       field.remove(index);
              //       field.insert(index, {
              //         ...item,
              //         interface: 'textarea',
              //       });
              //     }}
              //   >
              //     Update
              //   </Button>,
              // ]}
              header={
                <>
                  {(item.ui && item.ui.title) || <i style={{color: 'rgba(0, 0, 0, 0.25)'}}>未命名</i>}{' '}
                  <Tag>{schema.title}</Tag>
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
                id: uid(),
                name: uid(),
                interface: info.key,
                ...schema.default,
              };
              field.push(data);
              setActiveKey(data.id);
              console.log('info.key', info.key, schema);
            }}
          >
            {Array.from(interfaces).map(([key, schema]) => (
              <Menu.Item key={key}>{schema.title}</Menu.Item>
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
