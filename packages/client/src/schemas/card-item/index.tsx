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
import { Card, Dropdown, Menu, Space } from 'antd';
import classNames from 'classnames';
import { MenuOutlined, DragOutlined } from '@ant-design/icons';
// import './style.less';
import get from 'lodash/get';
import { uid } from '@formily/shared';
import { useDesignable } from '../';
import { AddNew } from '../add-new';
import { BlockItem } from '../block-item';
import { DraggableBlockContext } from '../../components/drag-and-drop';
import { BlockSchemaContext } from '../../context';

export const CardItem: any = connect((props) => {
  const { schema } = useDesignable();
  return (
    <BlockSchemaContext.Provider value={schema}>
      <BlockItem className={'nb-card-item'}>
        <Card bordered={false} {...props}>
          {props.children}
        </Card>
      </BlockItem>
    </BlockSchemaContext.Provider>
  );
});
