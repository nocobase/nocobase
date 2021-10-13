import React from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
  observer,
  useField,
  useFieldSchema,
} from '@formily/react';
import { Input as AntdInput } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
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
  TextArea?: React.FC<TextAreaProps>;
  URL?: React.FC<InputProps>;
  DesignableBar?: React.FC<any>;
};

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
    };
  }),
  mapReadPretty(Display.Input),
);

Input.TextArea = connect(AntdInput.TextArea, mapReadPretty(Display.TextArea));
Input.URL = connect(AntdInput, mapReadPretty(Display.URL));

export default Input;
