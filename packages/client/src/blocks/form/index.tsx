import React, { useContext, useMemo, useRef, useState } from 'react';
import { createForm } from '@formily/core';
import { SchemaOptionsContext, Schema, useFieldSchema } from '@formily/react';
import { SchemaRenderer, useDesignable } from '../DesignableSchemaField';
import get from 'lodash/get';
import { Dropdown, Menu } from 'antd';
import {
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useMouseEvents } from 'beautiful-react-hooks';
import cls from 'classnames';

import './style.less';

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

export const Form = (props) => {
  const schema = useFieldSchema();
  const { schema: designableSchema, refresh } = useDesignable();
  const { DesignableBar } = useDesignableBar();
  const ref = useRef();
  const [active, setActive] = useState(false);
  const { onMouseEnter, onMouseLeave, onMouseMove } = useMouseEvents(ref);
  onMouseEnter((e: React.MouseEvent) => {
    setActive(true);
  });

  onMouseLeave((e: React.MouseEvent) => {
    setActive(false);
  });

  onMouseMove((e: React.MouseEvent) => {
    
  });
  return (
    <div ref={ref} className={'nb-form'}>
      <SchemaRenderer
        onRefresh={(subSchema: Schema) => {
          designableSchema.properties = subSchema.properties;
          refresh();
        }}
        schema={schema.toJSON()}
        onlyRenderProperties
      />
      <DesignableBar active={active}/>
    </div>
  );
};

Form.DesignableBar = (props) => {
  const { active } = props;
  return (
    <div className={cls('designable-bar', { active })}>
      <div className={'designable-bar-actions'}>
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item>表单配置</Menu.Item>
            </Menu>
          }
        >
          <MenuOutlined />
        </Dropdown>
      </div>
    </div>
  );
};
