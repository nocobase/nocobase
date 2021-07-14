import React, { useContext, useState } from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  SchemaOptionsContext,
  useField,
  useFieldSchema,
} from '@formily/react';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { Dropdown, Menu, Space } from 'antd';
import classNames from 'classnames';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
// import './style.less';
import get from 'lodash/get';
import { GridBlockContext } from '../grid';
import { uid } from '@formily/shared';
import { useDesignable } from '../';
import { AddNew } from '../add-new';
import { BlockItem } from '../block-item';
import { DraggableBlockContext } from '../../components/drag-and-drop';

export const FormItem: any = connect((props) => {
  return (
    <BlockItem>
      <FormilyFormItem {...props} />
    </BlockItem>
  );
});

FormItem.DesignableBar = () => {
  const field = useField();
  const { schema, refresh } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(DraggableBlockContext);
  return (
    <div className={classNames('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={classNames('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
          <AddNew.FormItem defaultAction={'insertAfter'} ghost />
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
                  onClick={(e) => {
                    const title = uid();
                    schema.title = title;
                    field.title = title;
                    setVisible(false);
                    refresh();
                  }}
                >
                  点击修改按钮文案
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
