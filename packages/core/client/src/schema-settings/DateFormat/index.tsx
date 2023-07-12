import { observer, useForm } from '@formily/react';
import { Input, Radio } from 'antd';
import moment from 'moment';
import React, { useEffect, useState } from 'react';

export const DateFormatCom = (props?) => {
  const date = moment();
  return (
    <div style={{ display: 'inline-flex' }}>
      <span>{props.format}</span>
      <span style={{ display: 'inline-block', background: '#f2f2f2', marginLeft: '20px' }}>
        {date.format(props.format)}
      </span>
    </div>
  );
};

export const CustomFormatCom = observer((props: any) => {
  const { value, formatField, customFormatField } = props;
  const date = moment();
  const [customFormatPreview, setCustomFormatPreview] = useState(date.format(props.value));
  const [state, setState] = React.useState(props.value);
  const form = useForm();
  const [checked, setChecked] = useState(value);
  useEffect(() => {
    if (form.getValuesIn([formatField])) {
      form.setValuesIn([customFormatField], null);
      setChecked(false);
    }
  }, [form.getValuesIn([formatField])]);
  return (
    <Radio
      value={[customFormatField]}
      checked={checked}
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
            setCustomFormatPreview(date.format(e.target.value));
          }}
        />
        <span style={{ display: 'inline-block', background: '#f2f2f2', marginLeft: '20px', lineHeight: '30px' }}>
          {customFormatPreview}
        </span>
      </div>
    </Radio>
  );
});
