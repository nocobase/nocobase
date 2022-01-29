import { CloseCircleOutlined } from '@ant-design/icons';
import { useForm } from '@formily/react';
import { isValid } from '@formily/shared';
import { Select } from 'antd';
import cls from 'classnames';
import React from 'react';
import { Trans } from 'react-i18next';
import { FilterList } from './FilterList';

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
  const form = useForm();
  console.log('list', form.values, value);

  return (
    <div className={cls('nb-filter-group', { bordered })}>
      {onRemove && (
        <a className={'nb-filter-group-close'} onClick={() => onRemove()}>
          <CloseCircleOutlined />
        </a>
      )}
      <div style={{ marginBottom: 14 }}>
        <Trans>
          <Select
            style={{ width: 80 }}
            onChange={(logical) => {
              onChange?.({
                [logical]: value.list,
              });
            }}
            defaultValue={value.logical}
          >
            <Select.Option value={'and'}>All</Select.Option>
            <Select.Option value={'or'}>Any</Select.Option>
          </Select>
        </Trans>
      </div>
      <FilterList
        initialValue={value.list}
        onChange={(list: any[]) => {
          const values = {
            [value.logical]: list.filter((item) => isValid(item) && Object.keys(item).length),
          };
          onChange?.(values);
        }}
      />
    </div>
  );
}
