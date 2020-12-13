
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Tag } from 'antd';
import Icon from '@/components/icons';

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
  return (
    <>{value}</>
  );
}

export function TextareaField(props: any) {
  const { value } = props;
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

export function PercentField(props: any) {
  const { schema: { precision }, value } = props;
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
  console.log(items);
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
});

export default function Field(props: any) {
  const { schema = {} } = props;
  const Component = getFieldComponent(schema.interface);
  return <Component {...props}/>;
}
