import { observer, useForm } from '@formily/react';
import { Input } from 'antd';
import moment from 'moment';
import React, { useState } from 'react';
import { useToken } from '../../';

export const DateFormatCom = (props?) => {
  const date = moment();
  return (
    <div style={{ display: 'inline-flex' }}>
      <span>{props.format}</span>
      <DateTimeFormatPreview content={date.format(props.format)} />
    </div>
  );
};

const DateTimeFormatPreview = ({ content }) => {
  const { token } = useToken();
  return (
    <span
      style={{
        display: 'inline-block',
        background: token.colorBgTextHover,
        marginLeft: token.marginMD,
        lineHeight: '1',
        padding: token.paddingXXS,
        borderRadius: token.borderRadiusOuter,
      }}
    >
      {content}
    </span>
  );
};

export const CustomFormatCom = observer((props: any) => {
  const { defaultValue, name } = props;
  const date = moment();
  const [customFormatPreview, setCustomFormatPreview] = useState(
    props.defaultValue ? date.format(props.defaultValue) : null,
  );
  const form = useForm();
  return (
    <div style={{ display: 'inline-flex' }}>
      <Input
        style={{ width: '150px' }}
        defaultValue={defaultValue}
        onChange={(e) => {
          if (e.target.value && moment(date.toLocaleString(), e.target.value).isValid()) {
            setCustomFormatPreview(date.format(e.target.value));
            form.setValuesIn(name, e.target.value);
          } else {
            setCustomFormatPreview(null);
          }
        }}
      />
      <DateTimeFormatPreview content={customFormatPreview} />
    </div>
  );
});
