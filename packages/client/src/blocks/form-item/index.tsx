import React, { useContext, useState } from 'react';
import { connect, mapProps, mapReadPretty, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { FormItem as FormilyFormItem } from '@formily/antd';
import { Dropdown, Menu } from 'antd';
import classNames from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import './style.less';
import get from 'lodash/get';
import { BlockContext } from '../SchemaField';

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
  const { dragRef } = useContext(BlockContext);
  return (
    <div className={'designable-form-item'}>
      <FormilyFormItem {...props} />
      {dragRef && <div ref={dragRef}>Drag</div>}
      <DesignableBar/>
    </div>
  );
});

FormItem.DesignableBar = () => {
  const field = useField();
  const [visible, setVisible] = useState(false);
  return (
    <div className={classNames('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={classNames('designable-bar-actions', { active: visible })}
      >
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
                  setVisible(false);
                }}
              >
                点击修改按钮文案
              </Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </span>
    </div>
  );
};
