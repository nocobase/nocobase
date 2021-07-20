import React, { useContext, useMemo, useRef, useState } from 'react';
import { createForm } from '@formily/core';
import {
  SchemaOptionsContext,
  Schema,
  useFieldSchema,
  observer,
  SchemaExpressionScopeContext,
  FormProvider,
  ISchema,
  useField,
} from '@formily/react';
import { useSchemaPath, SchemaField, useDesignable, removeSchema } from '../';
import get from 'lodash/get';
import { Dropdown, Menu, Space } from 'antd';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import cls from 'classnames';
import { FormLayout } from '@formily/antd';
import './style.less';
import AddNew from '../add-new';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { isGridRowOrCol } from '../grid';

export const Form: any = observer((props: any) => {
  const { useValues = () => ({}), ...others } = props;
  const initialValues = useValues();
  const form = useMemo(() => {
    console.log('Form.useMemo', initialValues);
    return createForm({ initialValues });
  }, []);
  const { schema } = useDesignable();
  const path = useSchemaPath();
  const scope = useContext(SchemaExpressionScopeContext);
  return (
    <FormProvider form={form}>
      {schema['x-decorator'] === 'Form' ? (
        <SchemaField
          scope={scope}
          schema={{
            type: 'object',
            properties: {
              [schema.name]: {
                ...schema.toJSON(),
                'x-path': path,
                // 避免死循环
                'x-decorator': 'Form.__Decorator',
              },
            },
          }}
        />
      ) : (
        <FormLayout layout={'vertical'} {...others}>
          <SchemaField
            scope={scope}
            schema={{
              type: 'object',
              properties: schema.properties,
            }}
          />
        </FormLayout>
      )}
    </FormProvider>
  );
});

Form.__Decorator = ({ children }) => children;

Form.DesignableBar = observer((props) => {
  const field = useField();
  const { schema, refresh, deepRemove } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
          <AddNew.CardItem defaultAction={'insertAfter'} ghost />
          {dragRef && <DragOutlined ref={dragRef} />}
          <Dropdown
            trigger={['click']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item
                  key={'update'}
                  onClick={() => {
                    field.readPretty = false;
                  }}
                >
                  编辑Markdown
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    const removed = deepRemove();
                    // console.log({ removed })
                    const last = removed.pop();
                    if (isGridRowOrCol(last)) {
                      await removeSchema(last);
                    }
                  }}
                >
                  删除当前区块
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
});
