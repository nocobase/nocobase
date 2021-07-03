import React, { useContext, useState } from 'react';
import { connect, mapProps, mapReadPretty, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { Dropdown, Menu, Space } from 'antd';
import classNames from 'classnames';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
import './style.less';
import get from 'lodash/get';
import { GridBlockContext } from '../grid';
import { uid } from '@formily/shared';
import { useDesignable } from '../DesignableSchemaField';

function Blank() {
  return null;
}

function useDesignableBar() {
  const schema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  const DesignableBar = get(options.components, schema['x-designable-bar']);

  return {
    DesignableBar: DesignableBar || Blank,
  };
}

export const FormItem: any = connect((props) => {
  const { DesignableBar } = useDesignableBar();
  return (
    <div className={'designable-form-item'}>
      <FormilyFormItem {...props} />
      {/* {dragRef && <div ref={dragRef}>Drag</div>} */}
      <DesignableBar/>
    </div>
  );
});

FormItem.DesignableBar = () => {
  const field = useField();
  const { schema, refresh } = useDesignable();
  const [visible, setVisible] = useState(false);
  const { dragRef } = useContext(GridBlockContext);
  return (
    <div className={classNames('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={classNames('designable-bar-actions', { active: visible })}
      >
        <Space size={'small'}>
        <DragOutlined ref={dragRef} />
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
          <MenuOutlined/>
        </Dropdown>
        </Space>
      </span>
    </div>
  );
};
