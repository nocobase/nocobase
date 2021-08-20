import React from 'react'
import { connect, mapProps, mapReadPretty, observer, useField, useFieldSchema } from '@formily/react'
import { Input as AntdInput } from 'antd'
import { InputProps, TextAreaProps } from 'antd/lib/input'
import { Display } from '../display';
import { DesignableBar } from './DesignableBar';
import { Dropdown, Menu, Space } from 'antd';
import { LoadingOutlined, MenuOutlined, DragOutlined } from '@ant-design/icons';
import { getSchemaPath, useDesignable } from '../../components/schema-renderer';
import { useContext, useState } from 'react';
import AddNew from '../add-new';
import cls from 'classnames';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { uid } from '@formily/shared';
import { removeSchema, updateSchema } from '..';
import { isGridRowOrCol } from '../grid';
import { DragHandle } from '../../components/Sortable';

type ComposedInput = React.FC<InputProps> & {
  TextArea?: React.FC<TextAreaProps>
  URL?: React.FC<InputProps>
  DesignableBar?: React.FC<any>
}

export const Input: ComposedInput = connect(
  AntdInput,
  mapProps((props, field) => {
    return {
      ...props,
      suffix: (
        <span>
          {field?.['loading'] || field?.['validating'] ? (
            <LoadingOutlined />
          ) : (
            props.suffix
          )}
        </span>
      ),
    }
  }),
  mapReadPretty(Display.Input)
)

Input.TextArea = connect(AntdInput.TextArea, mapReadPretty(Display.TextArea))
Input.URL = connect(AntdInput, mapReadPretty(Display.URL))

Input.DesignableBar = observer((props) => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { root, currentSchema, schema, refresh, deepRemove, remove } = useDesignable();
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
          <DragHandle />
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
                    const title = uid();
                    schema['title'] = title;
                    field.title = title;
                    refresh();
                    console.log({ root, currentSchema, schema, fieldSchema }, getSchemaPath(fieldSchema));
                  }}
                >
                  修改 Input
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  key={'delete'}
                  onClick={async () => {
                    remove();
                    // const removed = deepRemove();
                    // // console.log({ removed })
                    // const last = removed.pop();
                    // if (isGridRowOrCol(last)) {
                    //   await removeSchema(last);
                    // }
                  }}
                >
                  移除
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

export default Input
