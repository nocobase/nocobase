import { usePrefixCls } from '@formily/antd-v5/esm/__builtins__';
import type { ColorPickerProps as AntdColorPickerProps } from 'antd/es/color-picker';
import cls from 'classnames';
import React from 'react';

type Composed = {
  ColorPicker: React.FC<AntdColorPickerProps>;
};

export const ReadPretty: Composed = () => null;

ReadPretty.ColorPicker = function ColorPicker(props: any) {
  const prefixCls = usePrefixCls('description-color-picker', props);

  if (!props.value) {
    return <div></div>;
  }

  return (
    <div className={cls(prefixCls, props.className)}>
      <ColorPicker showText disabled value={props.value} size="small" />
    </div>
  );
};
