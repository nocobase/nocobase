import React, { useEffect } from 'react';
import {
  connect,
  mapProps,
  mapReadPretty,
} from '@formily/react';
import { LoadingOutlined } from '@ant-design/icons';
import { useDynamicList } from 'ahooks';
import { Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { FilterItem } from './FilterItem';
import './style.less';

export function FilterGroup(props) {
  const { onRemove } = props;
  return (
    <div className={'nb-filter-group'}>
      {onRemove && (
        <a className={'nb-filter-group-close'} onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )}
      <div style={{ marginBottom: 14 }}>
        满足组内{' '}
        <Select
          style={{ width: 80 }}
          onChange={(value) => {}}
          defaultValue={'and'}
        >
          <Select.Option value={'and'}>全部</Select.Option>
          <Select.Option value={'or'}>任意</Select.Option>
        </Select>{' '}
        条件
      </div>
      <FilterList
        initialValue={[{}]}
        onChange={(list) => {
          console.log({ list });
        }}
      />
    </div>
  );
}

export function FilterList(props) {
  const { initialValue } = props;
  const { list, push, remove } = useDynamicList<any>(initialValue || []);
  useEffect(() => {
    props.onChange && props.onChange(list);
  }, [list]);
  return (
    <div className={'nb-filter-list'}>
      <div>
        {list.map((item, index) => {
          if (item.type === 'group') {
            return <FilterGroup key={index} onRemove={() => remove(index)} />;
          }
          return <FilterItem key={index} onRemove={() => remove(index)} />;
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

export const Filter = connect(
  (props) => {
    return (
      <div>
        <FilterGroup />
      </div>
    );
  },
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
  mapReadPretty((props) => {
    return null;
  }),
);

export default Filter;
