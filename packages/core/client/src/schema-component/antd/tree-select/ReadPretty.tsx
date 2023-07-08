import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import { Field } from '@formily/core';
import { observer, useField } from '@formily/react';
import { isArr } from '@formily/shared';
import { Tag } from 'antd';
import { TreeSelectProps } from 'antd/es/tree-select';
import cls from 'classnames';
import React from 'react';

export const ReadPretty: React.FC<TreeSelectProps<any>> = observer(
  (props) => {
    const field = useField<Field>();
    const { placeholder } = props;
    const prefixCls = usePrefixCls('description-tree-select', props);
    const dataSource = field?.dataSource?.length ? field.dataSource : props?.treeData?.length ? props.treeData : [];
    const getSelected = () => {
      const value = props.value;
      if (props.multiple) {
        if (props.labelInValue) {
          return isArr(value) ? value : [];
        } else {
          return isArr(value) ? value.map((val) => ({ label: val, value: val })) : [];
        }
      } else {
        if (props.labelInValue) {
          return value ? [value] : [];
        } else {
          return value ? [{ label: value, value }] : [];
        }
      }
    };

    const findLabel = (value: any, dataSource: any[]) => {
      for (let i = 0; i < dataSource?.length; i++) {
        const item = dataSource[i];
        if (item?.value === value) {
          return item?.label;
        } else {
          const childLabel = findLabel(value, item?.children);
          if (childLabel) return childLabel;
        }
      }
    };

    const getLabels = () => {
      const selected = getSelected();
      if (!selected?.length) return <Tag>{placeholder}</Tag>;
      return selected.map(({ value, label }, key) => {
        return <Tag key={key}>{findLabel(value, dataSource) || label || placeholder}</Tag>;
      });
    };
    return (
      <div className={cls(prefixCls, props.className)} style={props.style}>
        {getLabels()}
      </div>
    );
  },
  { displayName: 'ReadPretty' },
);
