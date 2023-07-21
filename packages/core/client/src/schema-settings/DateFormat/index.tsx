import { observer, useForm } from '@formily/react';
import { Input, Radio } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useToken } from '../../';
export const DateFormatCom = (props?) => {
  const date = moment();
  const { token } = useToken();
  return (
    <div style={{ display: 'inline-flex' }}>
      <span>{props.format}</span>
      <span
        style={{
          display: 'inline-block',
          background: token.colorBgTextHover,
          marginLeft: token.marginMD,
          padding: token.paddingXXS,
          borderRadius: token.borderRadiusOuter,
          lineHeight: token.lineHeight,
        }}
      >
        {date.format(props.format)}
      </span>
    </div>
  );
};

export const CustomFormatCom = observer((props: any) => {
  const { value, formatField, customFormatField } = props;
  const date = moment();
  const [customFormatPreview, setCustomFormatPreview] = useState(props.value ? date.format(props.value) : null);
  const [state, setState] = React.useState(props.value);
  const form = useForm();
  const [checked, setChecked] = useState(value);
  const { token } = useToken();

  useEffect(() => {
    if (form.getValuesIn([formatField])) {
      form.setValuesIn([customFormatField], null);
      setChecked(false);
    }
  }, [form.getValuesIn([formatField])]);
  return (
    <Radio
      style={{ marginBottom: '20px' }}
      value={[customFormatField]}
      checked={checked && form.getValuesIn([formatField]) === null}
      onChange={(e) => {
        if (e.target.checked) {
          form.setValuesIn([formatField], null);
          form.setValuesIn([customFormatField], state);
          setChecked(state);
        }
      }}
    >
      <div style={{ display: 'inline-flex' }}>
        <Input
          style={{ width: '150px' }}
          defaultValue={state}
          onChange={(e) => {
            setState(e.target.value);
            if (e.target.value && moment(date.toLocaleString(), e.target.value).isValid()) {
              setCustomFormatPreview(date.format(e.target.value));
            } else {
              setCustomFormatPreview(null);
            }
          }}
        />
        <span
          style={{
            display: 'inline-block',
            background: token.colorBgTextHover,
            marginLeft: token.marginMD,
            lineHeight: token.lineHeight,
            padding: token.paddingXXS,
            borderRadius: token.borderRadiusOuter,
          }}
        >
          {customFormatPreview}
        </span>
      </div>
    </Radio>
  );
});
