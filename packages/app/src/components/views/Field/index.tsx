
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Tag, Popover, Table, Drawer } from 'antd';
import Icon from '@/components/icons';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { fields2columns } from '../SortableTable';
import ViewFactory from '..';
import './style.less';
import { getImageByUrl } from '@/components/form.fields';

const InterfaceTypes = new Map<string, any>();

function registerFieldComponent(type, Component) {
  InterfaceTypes.set(type, Component);
}

function registerFieldComponents(components) {
  Object.keys(components).forEach(key => {
    registerFieldComponent(key, components[key]);
  });
}

function getFieldComponent(type) {
  if (InterfaceTypes.has(type)) {
    return InterfaceTypes.get(type);
  }
  return InterfaceTypes.get('string');
}

export function StringField(props: any) {
  const { value } = props;
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return (
    <>{value}</>
  );
}

export function TextareaField(props: any) {
  const { value, viewType } = props;
  if (!value) {
    return null;
  }
  if (viewType !== 'table') {
    return value;
  }
  if (value.length > 20) {
    return (
      <Popover content={<div onClick={(e) => {
        e.stopPropagation();
      }} style={{maxWidth: 300}}>{value}</div>}>{value.substring(0, 15)}...</Popover>
    );
  }
  return (
    <>{value}</>
  );
}

export function BooleanField(props: any) {
  const { value } = props;
  return (
    <>{value ? '是' : '否'}</>
  );
}

export function NumberField(props: any) {
  const { schema: { precision }, value } = props;
  return (
    <>{value}</>
  );
}

export function isNumber(num) {
  if (typeof num === 'number') {
    return num - num === 0;
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
};

export function PercentField(props: any) {
  const { schema: { precision }, value } = props;
  if (!isNumber(value)) {
    return null;
  }
  return (
    <>{value}%</>
  );
}

export function DateTimeField(props: any) {
  const { schema: { dateFormat, showTime, timeFormat }, value } = props;
  const m = moment(value);
  if (!m.isValid()) {
    return null;
  }
  let format = dateFormat;
  if (showTime) {
    format += ` ${timeFormat}`;
  }
  return (
    <>{m.format(`${format}`)}</>
  );
}

export function IconField(props) {
  const { value } = props;
  return <Icon type={value}/>;
}

function toFlat(items = []): Array<any> {
  let flat = [];
  items.forEach(item => {
    flat.push(item);
    if (Array.isArray(item.children) && item.children.length) {
      flat = flat.concat(toFlat(item.children));
    }
  });
  return flat;
}

export function DataSourceField(props: any) {
  const { schema: { dataSource = [] }, value } = props;
  const items = toFlat(dataSource);
  // console.log(items);
  if (isEmpty(value)) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map(val => {
      const item = items.find(item => item.value === val);
      return (
        <Tag>
          {item ? item.label : val}
        </Tag>
      )
    });
  }
  const item = items.find(item => item.value === value);
  return (
    <Tag>
      {item ? item.label : value}
    </Tag>
  )
}

export function RealtionField(props: any) {
  const { schema: { labelField }, value } = props;
  if (!value) {
    return null;
  }
  const items = Array.isArray(value) ? value : [value];
  return (
    <>
      {items.map(item => (
        <span>{get(item, labelField)}</span>
      ))}
    </>
  );
}

export function SubTableField(props: any) {
  const { schema: { children }, value } = props;
  console.log(value);
  if (!Array.isArray(value)) {
    return null;
  }
  return (
    <div>
      <Table size={'middle'} columns={fields2columns(children)} dataSource={value} pagination={false}/>
    </div>
  );
}

export function LinkToField(props: any) {
  const { schema, value } = props;
  if (!value) {
    return null;
  }
  const values = Array.isArray(value) ? value : [value];
  return (
    <div className={'link-to-field'}>
      {values.map(item => <LinkToFieldLink data={item} schema={schema}/>)}
    </div>
  );
}

export function LinkToFieldLink(props) {
  const { data, schema, schema: { title, labelField } } = props;
  const [visible, setVisible] = useState(false);
  // console.log(schema);
  return (
    <span className={'link-to-field-tag'}>
      <a onClick={(e) => {
        e.stopPropagation();
        setVisible(true);
      }}>{data[labelField]}</a>
      <Drawer 
        // @ts-ignore
        onClick={(e) => {
          e.stopPropagation();
        }}
        bodyStyle={{padding: 0}} 
        width={'40%'}
        title={`查看${title}详情`}
        visible={visible}
        onClose={() => setVisible(false)}
      >
        <ViewFactory
          resourceName={schema.target}
          viewName={'details'}
          resourceKey={data.id}
        />
      </Drawer>
    </span>
  );
}

export function AttachmentField(props: any) {
  const { value, schema } = props;
  if (!value) {
    return null;
  }
  const values = Array.isArray(value) ? value : [value];
  return (
    <div className={'attachment-field'}>
      {values.map(item => <AttachmentFieldItem data={item} schema={schema}/>)}
    </div>
  );
}

export function AttachmentFieldItem(props: any) {
  const { title, url } = props.data || {};
  const img = getImageByUrl(url, {
    exclude: ['.png', '.jpg', '.jpeg', '.gif']
  })
  return (
    <a onClick={(e) => e.stopPropagation()} className={'attachment-field-item'} target={'_blank'} href={url}>
      <img style={{marginRight: 5}} height={20} alt={title} title={title} src={img}/>
    </a>
  );
}

registerFieldComponents({
  string: StringField,
  textarea: TextareaField,
  boolean: BooleanField,
  select: DataSourceField,
  multipleSelect: DataSourceField,
  radio: DataSourceField,
  checkboxes: DataSourceField,
  number: NumberField,
  percent: PercentField,
  datetime: DateTimeField,
  createdAt: DateTimeField,
  updatedAt: DateTimeField,
  icon: IconField,
  createdBy: RealtionField,
  updatedBy: RealtionField,
  subTable: SubTableField,
  linkTo: LinkToField,
  attachment: AttachmentField,
});

export default function Field(props: any) {
  const { schema = {} } = props;
  const Component = getFieldComponent(schema.interface);
  return <Component {...props}/>;
}
