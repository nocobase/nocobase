import React, { useEffect } from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { LoadingOutlined } from '@ant-design/icons';
import { useDynamicList } from 'ahooks';
import { Select } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { FilterItem } from './FilterItem';
import cls from 'classnames';
import './style.less';

const toValue = (value) => {
  if (!value) {
    return {
      logical: 'and',
      list: [{}],
    };
  }
  if (value.and) {
    return {
      logical: 'and',
      list: value.and,
    };
  }
  if (value.or) {
    return {
      logical: 'and',
      list: value.or,
    };
  }
  return {
    logical: 'and',
    list: [{}],
  };
};

export function FilterGroup(props) {
  const { bordered = true, onRemove, onChange } = props;
  const value = toValue(props.value);
  return (
    <div className={cls('nb-filter-group', { bordered })}>
      {onRemove && (
        <a className={'nb-filter-group-close'} onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )}
      <div style={{ marginBottom: 14 }}>
        满足组内{' '}
        <Select
          style={{ width: 80 }}
          onChange={(logical) => {
            onChange &&
              onChange({
                [logical]: value.list,
              });
          }}
          defaultValue={value.logical}
        >
          <Select.Option value={'and'}>全部</Select.Option>
          <Select.Option value={'or'}>任意</Select.Option>
        </Select>{' '}
        条件
      </div>
      <FilterList
        initialValue={value.list}
        onChange={(list: any[]) => {
          onChange &&
            onChange({
              [value.logical]: list.filter((item) => Object.keys(item).length),
            });
        }}
      />
    </div>
  );
}

export function FilterList(props) {
  const { initialValue } = props;
  const { list, push, remove, replace } = useDynamicList<any>(
    initialValue || [],
  );
  useEffect(() => {
    props.onChange && props.onChange(list);
  }, [list]);
  return (
    <div className={'nb-filter-list'}>
      <div>
        {list.map((item, index) => {
          if (item.and || item.or) {
            return (
              <FilterGroup
                key={index}
                value={item}
                onChange={(value: any) => replace(index, value)}
                onRemove={() => remove(index)}
              />
            );
          }
          return (
            <FilterItem
              key={index}
              value={item}
              onChange={(value: any) => replace(index, value)}
              onRemove={() => remove(index)}
            />
          );
        })}
      </div>
      <a
        onClick={() => {
          push({});
        }}
      >
        添加条件
      </a>{' '}
      <a
        onClick={() => {
          push({
            and: [{}],
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
    // console.log('Filter.props', { props });
    return (
      <div>
        <FilterGroup bordered={false} {...props} />
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
