import React, { useState } from 'react';
import { connect } from '@formily/react-schema-renderer'
import { Cascader as AntdCascader } from 'antd'
import { useRequest } from 'umi';
import api from '@/api-client';
import {
  transformDataSourceKey,
  mapStyledProps,
  mapTextComponent
} from '../shared'

function findTreeNode(tree, values, { value = 'value', children = 'children' }) {
  let node, i;
  for (node = tree, i = 0; node && values[i]; i++ ) {
    node = node[children].find(item => item[value] === values[i]);
  }

  return node;
}

export const Cascader = connect({
  getProps: mapStyledProps,
  getComponent: mapTextComponent,
})(function (props) {
  const {
    disabled,
    target,
    labelField,
    valueField = 'id',
    parentField,
    scale = -1,
    changeOnSelect,
    value = [],
    onChange,
    // TODO(feature): 增加静态数据支持
    // dataSource: []
  } = props;
  const fieldNames = {
    label: labelField,
    value: valueField,
    children: 'children'
  };
  const [options, setOptions] = useState([]);
  const { loading, run } = useRequest(async (v = [], selectedOptions) => {
    onChange(v);

    if (v.length >= scale) {
      return;
    }

    const last = v[v.length - 1] || null;
    if (last) {
      selectedOptions[v.length - 1].loading = true;
    }
    return api.resource(target).list({
      filter: {
        [parentField]: last
      },
      perPage: -1,
      sort: ['sort']
    });
    // TODO(bug): 关联资源加载问题较多，暂时先用 filter 解决
    // return api.resource(`${target}.${target}`).list({
    //   associatedKey: last,
    //   perPage: -1
    // });
  }, {
    onSuccess(result) {
      // 找到已有值指向的 options 节点
      if (value.length) {
        const node = findTreeNode({ [fieldNames.children]: options }, value, fieldNames);

        if (node) {
          node.children = result;
          node.loading = false;
        }

        setOptions([...options]);
      } else {
        setOptions(result);
      }
    }
  });

  return (
    <AntdCascader
      disabled={disabled}
      options={options}
      value={value}
      onChange={run}
      changeOnSelect={changeOnSelect}
      fieldNames={fieldNames}
    />
  );
})

export default Cascader
