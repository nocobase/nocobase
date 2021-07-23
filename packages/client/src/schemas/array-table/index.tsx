import React from 'react';
import { ArrayTable as Table } from '@formily/antd';
import { useField, Schema } from '@formily/react';
import { Button } from 'antd';
import cls from 'classnames';
import { isValid, uid } from '@formily/shared';
import { PlusOutlined } from '@ant-design/icons';
import { usePrefixCls } from '@formily/antd/lib/__builtins__';

export const ArrayTable = Table;

const getDefaultValue = (defaultValue: any, schema: Schema) => {
  if (isValid(defaultValue)) return defaultValue;
  if (Array.isArray(schema?.items))
    return getDefaultValue(defaultValue, schema.items[0]);
  if (schema?.items?.type === 'array') return [];
  if (schema?.items?.type === 'boolean') return true;
  if (schema?.items?.type === 'date') return '';
  if (schema?.items?.type === 'datetime') return '';
  if (schema?.items?.type === 'number') return 0;
  if (schema?.items?.type === 'object') return {};
  if (schema?.items?.type === 'string') return '';
  return null;
};

ArrayTable.Addition = (props: any) => {
  const { randomValue } = props;
  const self = useField();
  const array = Table.useArray();
  const prefixCls = usePrefixCls('formily-array-base');
  if (!array) return null;
  if (array.field?.pattern !== 'editable') return null;
  return (
    <Button
      type="dashed"
      block
      {...props}
      className={cls(`${prefixCls}-addition`, props.className)}
      onClick={(e) => {
        if (array.props?.disabled) return;
        const defaultValue = getDefaultValue(props.defaultValue, array.schema);
        if (randomValue) {
          defaultValue.value = uid();
        }
        if (props.method === 'unshift') {
          array.field?.unshift?.(defaultValue);
          array.props?.onAdd?.(0);
        } else {
          array.field?.push?.(defaultValue);
          array.props?.onAdd?.(array?.field?.value?.length - 1);
        }
        if (props.onClick) {
          props.onClick(e);
        }
      }}
      icon={<PlusOutlined />}
    >
      {props.title || self.title}
    </Button>
  );
};

export default ArrayTable;
