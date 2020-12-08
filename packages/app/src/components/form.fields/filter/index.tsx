import React, { useEffect, useState } from 'react';
import { Button, Select, Input, Space, Form, InputNumber, DatePicker } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import useDynamicList from './useDynamicList';
import { connect } from '@formily/react-schema-renderer'
import { mapStyledProps } from '../shared'
import moment from 'moment';

export function FilterGroup(props: any) {
  const { showDeleteButton = false, fields = [], onDelete, onChange, onAdd, dataSource = {} } = props;
  const { list, getKey, push, remove, replace } = useDynamicList<any>(dataSource.list || [
    {
      type: 'item',
    },
  ]);
  return (
    <div style={{marginBottom: 14, padding: 14, border: '1px dashed #dedede'}}>
      <div style={{marginBottom: 14}}>
        满足组内
        {' '}
        <Select style={{width: 80}} onChange={(value) => {
          onChange({...dataSource, andor: value});
        }} defaultValue={'and'}>
          <Select.Option value={'and'}>全部</Select.Option>
          <Select.Option value={'or'}>任意</Select.Option>
        </Select>
        {' '}
        条件
      </div>
      <div>
        {list.map((item, index) => {
          // console.log(item);
          const Component = item.type === 'group' ? FilterGroup : FilterItem;
          return (
            <div style={{marginBottom: 14}}>
              {<Component
                fields={fields}
                dataSource={item}
                showDeleteButton={list.length > 1}
                onChange={(value) => {
                  replace(index, value);
                  const newList = [...list];
                  newList[index] = value;
                  onChange({...dataSource, list: newList});
                  // console.log(list, value, index);
                }}
                onDelete={() => {
                  remove(index);
                  const newList = [...list];
                  newList.splice(index, 1);
                  onChange({...dataSource, list: newList});
                  // console.log(list, index);
                }}
              />}
            </div>
          );
        })}
      </div>
      <div>
        <Space>
          <Button onClick={() => {
            const data = {
              type: 'item'
            };
            push(data);
            const newList = [...list];
            newList.push(data);
            onChange({...dataSource, list: newList});
          }}>
            添加条件
          </Button>
          <Button onClick={() => {
            const data = {
              type: 'group',
              list: [
                {
                  type: 'item',
                },
              ],
            };
            push(data);
            const newList = [...list];
            newList.push(data);
            onChange({...dataSource, list: newList});
          }}>
            添加条件组
          </Button>
          {showDeleteButton && <Button onClick={(e) => {
            onDelete && onDelete(e);
          }}>
            删除组
          </Button>}
        </Space>
      </div>
    </div>
  );
}

interface FieldOptions {
  name: string;
  title: string;
  interface: string;
  [key: string]: any;
}

interface FilterItemProps {
  fields: FieldOptions[];
  [key: string]: any;
}

const OP_MAP = {
  string: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '包含', value: 'cont'},
    {label: '不包含', value: 'ncont'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  number: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '大于', value: 'gt'},
    {label: '大于等于', value: 'gte'},
    {label: '小于', value: 'lt'},
    {label: '小于等于', value: 'lte'},
    {label: '介于', value: 'between'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  file: [
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  boolean: [
    {label: '等于', value: 'eq'},
  ],
  choices: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '包含', value: 'cont'},
    {label: '不包含', value: 'ncont'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
  datetime: [
    {label: '等于', value: 'eq'},
    {label: '不等于', value: 'neq'},
    {label: '大于', value: 'gt'},
    {label: '大于等于', value: 'gte'},
    {label: '小于', value: 'lt'},
    {label: '小于等于', value: 'lte'},
    {label: '介于', value: 'between'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
    {label: '是今天', value: 'now'},
    {label: '在今天之前', value: 'before_today'},
    {label: '在今天之后', value: 'after_today'},
  ],
  linkTo: [
    {label: '包含', value: 'cont'},
    {label: '不包含', value: 'ncont'},
    {label: '非空', value: 'notnull'},
    {label: '为空', value: 'null'},
  ],
};

const op = {
  string: OP_MAP.string,
  textarea: OP_MAP.string,
  number: OP_MAP.number,
  datetime: OP_MAP.datetime,
};

const StringInput = (props) => {
  const { onChange, ...restProps } = props;
  return (
    <Input {...restProps} onChange={(e) => {
      onChange(e.target.value);
    }}/>
  );
}

const controls = {
  string: StringInput,
  textarea: StringInput,
  number: InputNumber,
  // datetime: DatePicker,
  datetime: (props) => {
    const { value, onChange, ...restProps } = props;
    const m = moment(value, 'YYYY-MM-DD HH:mm:ss');
    return (
      <DatePicker value={m.isValid() ? m : null} onChange={(value) => {
        onChange(value ? value.format('YYYY-MM-DD HH:mm:ss') : null)
        console.log(value.format('YYYY-MM-DD HH:mm:ss'));
      }}/>
    );
  },
};

export function FilterItem(props: FilterItemProps) {
  const { index, fields = [], showDeleteButton = false, onDelete, onChange, dataSource = {} } = props;
  const [type, setType] = useState('string');
  useEffect(() => {
    const field = fields.find(field => field.name === dataSource.column);
    if (field) {
      setType(field.interface);
    }
  }, [
    dataSource,
  ]);
  const ValueControl = controls[type]||controls.string;
  return (
    <Input.Group compact>
      <Select value={dataSource.column}
        onChange={(value) => {
          const field = fields.find(field => field.name === value);
          if (field) {
            setType(field.interface);
          }
          onChange({...dataSource, column: value});
        }}
        style={{ width: '30%' }} placeholder={'选择字段'}>
        {fields.map(field => (
          <Select.Option value={field.name}>{field.title}</Select.Option>
        ))}
      </Select>
      <Select value={dataSource.op} style={{ minWidth: 100 }}
        onChange={(value) => {
          onChange({...dataSource, op: value});
        }}
      >
        {(op[type]||op.string).map(option => (
          <Select.Option value={option.value}>{option.label}</Select.Option>
        ))}
      </Select>
      <ValueControl value={dataSource.value} onChange={(value) => {
        onChange({...dataSource, value: value});
      }} style={{ width: '30%' }}/>
      {showDeleteButton && (
        <Button onClick={(e) => {
          onDelete && onDelete(e);
        }}>删除</Button>
      )}
    </Input.Group>
  );
}

export const Filter = connect({
  getProps: mapStyledProps,
})((props) => {
  const dataSource = {
    type: 'group',
    list: [
      {
        type: 'item',
      }
    ],
  };
  return <FilterGroup dataSource={dataSource} {...props}/>
});

export default Filter;
