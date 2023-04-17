import { useField, useFieldSchema } from '@formily/react';
import { SchemaSettings, useDesignable } from '@nocobase/client';
import _ from 'lodash';
import React, { useState } from 'react';
import { Switch } from 'antd';

export const SSSwitchItem = (props) => {
  const { title, onChange, name, ...others } = props;
  const field = useField();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  const defaultChecked = name ? _.get(field.componentProps, name) || false : props.checked;
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <SchemaSettings.Item
      {...others}
      onClick={async () => {
        _.set(fieldSchema['x-component-props'], name, !checked);
        field.componentProps[name] = !checked;
        await dn.emit('patch', {
          schema: {
            'x-uid': fieldSchema['x-uid'],
            'x-component-props': fieldSchema['x-component-props'],
          },
        });
        setChecked(!checked);
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
        {title}
        <Switch size={'small'} checked={checked} style={{ marginLeft: 32 }} />
      </div>
    </SchemaSettings.Item>
  );
};
