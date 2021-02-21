import React, { useEffect, useState } from 'react';
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
    node = (node[children] || []).find(item => item[value] === values[i][value]);
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

  const { loading, run } = useRequest(async (selectedOptions = []) => {
    if (scale !== -1 && selectedOptions.length >= scale) {
      return;
    }

    const last = selectedOptions[selectedOptions.length - 1] || null;
    if (last) {
      if (last.isLeaf) {
        return;
      }
      last.loading = true;
    }

    return api.resource(target).list({
      filter: {
        [parentField]: last && last[valueField]
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
    manual: true,
    onSuccess(result, [selectedOptions = []]) {
      if (!result) {
        return;
      }

      const data = result.map(item => ({
        ...item,
        isLeaf: scale !== -1 && item.level >= scale
      }));
      // 找到已有值指向的 options 节点
      const root = { [fieldNames.children]: options };
      const node = findTreeNode(root, selectedOptions, fieldNames);

      if (node && node !== root) {
        node.children = data;
        node.loading = false;
        // use spread array to avoid popup to be collapsed
        setOptions([...options]);
      } else {
        setOptions(data);
      }
    }
  });

  // 根据 value 的值，按需预加载相应的数据
  useEffect(() => {
    if (value.length) {
      value.reduce((promise, option, i) => promise.then(() => run(value.slice(0, i))), Promise.resolve());
    } else {
      run([]);
    }
  }, []);

  return (
    <AntdCascader
      disabled={disabled}
      options={options}
      value={value.map(item => item[valueField])}
      onChange={(v, selected) => {
        if (scale !== -1 && v.length < scale) {
          run(selected);
        }
        if (changeOnSelect || v.length >= scale) {
          onChange(selected, selected);
        }
      }}
      loadData={run}
      changeOnSelect={changeOnSelect}
      fieldNames={fieldNames}
    />
  );
})

export default Cascader
