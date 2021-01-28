
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Tag, Popover, Table, Drawer, Modal, Checkbox, message } from 'antd';
import Icon from '@/components/icons';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import findIndex from 'lodash/findIndex';
import { fields2columns } from '../SortableTable';
import ViewFactory from '..';
import './style.less';
import { getImageByUrl, testUrl } from '@/components/form.fields';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import marked from 'marked';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import api from '@/api-client';
import { useRequest } from 'umi';

marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderer = new marked.Renderer();
renderer.link = ( href, title, text ) => `<a target="_blank" href="${ href }" title="${ title||'' }">${ text }</a>`;

export function markdown(text: string) {
  return marked(text, {
    renderer,
  });
}

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
  const { value, viewType } = props;
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (viewType === 'table' && value.length > 20) {
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

export function TextareaField(props: any) {
  const { value, viewType } = props;
  if (!value) {
    return null;
  }
  if (viewType !== 'table') {
    return <div className={'textarea-field-content'} dangerouslySetInnerHTML={{__html: markdown(value)}}/>;
  }
  if (value.length > 20) {
    return (
      <Popover content={(
        <div onClick={(e) => e.stopPropagation()} className={'textarea-field-content'} style={{maxWidth: 300}} dangerouslySetInnerHTML={{__html: markdown(value)}}/>
      )}>{value.substring(0, 15)}...</Popover>
    );
  }
  return (
    <>{value}</>
  );
}
// const { data = [], loading = true } = useRequest(() => {
//   return api.resource('collections.actions').list({
//     associatedKey: resourceKey,
//   });
// }, {
//   refreshDeps: [resourceKey]
// });
export function BooleanField(props: any) {
  const { data = {}, value, schema: { name, editable, resource } } = props;
  if (editable) {
    return <Checkbox defaultChecked={value} onChange={async (e) => {
      await api.resource(resource).update({
        associatedKey: data.associatedKey,
        resourceKey: data.id,
        tableName: data.tableName||'pages',
        values: {
          tableName: data.tableName||'pages',
          [name]: e.target.checked,
        },
      });
      message.success('保存成功');
      // console.log(props);
    }}/>
  }
  // console.log(props);
  return (
    <>{value ? <CheckOutlined style={{color: '#52c41a'}}/> : <CloseOutlined style={{color: '#f5222d'}}/>}</>
  );
}

export function NumberField(props: any) {
  const { schema: { precision = 0 }, value } = props;
  if (!isNumber(value)) {
    return null;
  }
  return (
    <div className={'number-field'}>{new Intl.NumberFormat().format(value)}</div>
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
  const { schema: { precision = 0 }, value } = props;
  if (!isNumber(value)) {
    return null;
  }
  return (
    <div className={'percent-field'}>{new Intl.NumberFormat().format(value)}%</div>
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
      return item ? (
        <Tag color={item.color}>
          {item ? item.label : val}
        </Tag>
      ) : <Tag>{val}</Tag>;
    });
  }
  const item = items.find(item => item.value === value);
  return item ? (
    <Tag color={item.color}>
      {item ? item.label : value}
    </Tag>
  ) : <Tag>{value}</Tag>;
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
    <div className={'sub-table-field'}>
      <Table size={'small'} columns={fields2columns(children)} dataSource={value} pagination={false}/>
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
        className={'noco-drawer'}
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

function getImgUrls(value) {
  const values = Array.isArray(value) ? value : [value];
  return values.filter(item => testUrl(item.url, {
    exclude: ['.png', '.jpg', '.jpeg', '.gif']
  })).map(item => item);
}

export function AttachmentField(props: any) {
  const { value, schema } = props;
  const [imgIndex, setImgIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  if (!value) {
    return null;
  }
  const values = Array.isArray(value) ? value : [value];
  const images = getImgUrls(values);
  console.log(images);
  return (
    <div onClick={(e) => {
      e.stopPropagation();
    }} className={'attachment-field'}>
      {values.map(item => <AttachmentFieldItem onClick={() => {
        setVisible(true);
        const index = findIndex(images, img => item.id === img.id);
        setImgIndex(index);
      }} data={item} schema={schema}/>)}
      {visible && <Lightbox
        mainSrc={get(images, [imgIndex, 'url'])}
        nextSrc={get(images, [imgIndex + 1, 'url'])}
        prevSrc={get(images, [imgIndex - 1, 'url'])}
        onCloseRequest={() => setVisible(false)}
        onMovePrevRequest={() => {
          setImgIndex((imgIndex + images.length - 1) % images.length);
        }}
        onMoveNextRequest={() => {
          setImgIndex((imgIndex + 1) % images.length);
        }}
      />}
    </div>
  );
}

export function AttachmentFieldItem(props: any) {
  const { title, url } = props.data || {};
  const img = getImageByUrl(url, {
    exclude: ['.png', '.jpg', '.jpeg', '.gif']
  })
  // const [visible, setVisible] = useState(false);
  return (
    <>
      <a onClick={(e) => {
        e.stopPropagation();
        if (testUrl(url, {
          exclude: ['.png', '.jpg', '.jpeg', '.gif']
        })) {
          props.onClick && props.onClick();
          // setVisible(true);
          e.preventDefault();
        }
      }} className={'attachment-field-item'} target={'_blank'} href={url}>
        <img height={20} alt={title} title={title} src={`${img}?x-oss-process=style/thumbnail`}/>
      </a>
      {/* <Modal
          className={'attachment-modal'}
          onCancel={(e) => {
            e.stopPropagation();
            setVisible(false);
          }}
          // @ts-ignore
          onClick={(e) => {
            e.stopPropagation();
          }}
          bodyStyle={{padding: 0}}
          footer={null}
          visible={visible}>
          <img onClick={(e) => {
            e.stopPropagation();
          }} style={{height: 'auto', width: '100%'}} alt={title} title={title} src={url}/>
        </Modal> */}
    </>
  );
}

function LogField(props) {
  const { value = {} } = props;
  return (
    <div>{value.title||value.name}</div>
  )
}

function LogFieldValue(props) {
  const { value, schema, data } = props;
  return (
    <div>{value}</div>
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
  createdBy: RealtionField,
  updatedBy: RealtionField,
  subTable: SubTableField,
  linkTo: LinkToField,
  attachment: AttachmentField,
  'logs.field': LogField,
  'logs.fieldValue': LogFieldValue,
});

export default function Field(props: any) {
  const { schema = {} } = props;
  const Component = getFieldComponent(schema.interface||get(schema, 'component.type'));
  return <Component {...props}/>;
}
