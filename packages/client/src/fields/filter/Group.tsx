import React, { createContext, useContext, useEffect } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useDynamicList } from 'ahooks';
import { Select } from 'antd';
import { FilterItem } from './FilterItem';
import './style.less';

export const FilterSourceFieldsContext = createContext([]);
export const FilterTargetFieldsContext = createContext([]);

export function Group(props) {
  const { onRemove } = props;
  return (
    <div className={'filter-group'}>
      {onRemove && (
        <a onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )}
      <div style={{ marginBottom: 14 }}>
        满足组内{' '}
        <Select
          style={{ width: 80 }}
          onChange={value => {
          }}
          defaultValue={'and'}
        >
          <Select.Option value={'and'}>全部</Select.Option>
          <Select.Option value={'or'}>任意</Select.Option>
        </Select>{' '}
        条件
      </div>
      <List
        initialValue={[{}]}
        onChange={(list) => {
          console.log({ list });
        }}
      />
    </div>
  );
}

export function List(props) {
  const { initialValue } = props;
  const { list, push, remove } = useDynamicList<any>(initialValue || []);
  useEffect(() => {
    props.onChange && props.onChange(list);
  }, [list]);
  const fields = useContext(FilterSourceFieldsContext);
  return (
    <div>
      <div>
        {list.map((item, index) => {
          if (item.type === 'group') {
            return <Group key={index} onRemove={() => remove(index)} />;
          }
          return <FilterItem key={index} fields={fields} onRemove={() => remove(index)} />;
        })}
      </div>
      <a
        onClick={() => {
          push({
            type: 'item',
            key: new Date().toTimeString(),
          });
        }}
      >
        添加条件
      </a>{' '}
      <a
        onClick={() => {
          push({
            type: 'group',
            key: new Date().toTimeString(),
          });
        }}
      >
        添加条件组
      </a>
    </div>
  );
}
