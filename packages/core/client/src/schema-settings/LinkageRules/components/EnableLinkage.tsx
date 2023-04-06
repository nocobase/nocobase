import React from 'react';
import { Switch } from 'antd';
import { ArrayBase } from '@formily/antd';

export const EnableLinkage = React.forwardRef((props: any, ref) => {
  const array = ArrayBase.useArray();
  const index = ArrayBase.useIndex(props.index);
  return (
    <Switch
      {...props}
      checked={!array?.field?.value[index].disabled}
      size={'small'}
      style={{
        transition: 'all 0.25s ease-in-out',
        color: 'rgba(0, 0, 0, 0.8)',
        fontSize: 16,
        marginLeft: 6,
        marginBottom: 3,
      }}
      onChange={(checked, e) => {
        e.stopPropagation();
        array.field.value.splice(index, 1, { ...array?.field?.value[index], disabled: !checked });
      }}
      onClick={(checked, e) => {
        e.stopPropagation();
      }}
    />
  );
});
