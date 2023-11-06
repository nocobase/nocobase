import { FC, useMemo } from 'react';
import { SchemaSettings } from '../../../schema-settings';
import { SchemaSettingOptions } from '../types';
import { SchemaSettingChildren } from './SchemaSettingsChildren';
import { SchemaSettingsIcon } from './SchemaSettingsIcon';
import React from 'react';

export interface SchemaSettingsWrapperProps extends SchemaSettingOptions<any> {
  designer: any;
}

export const SchemaSettingsWrapper: FC<SchemaSettingsWrapperProps> = (props) => {
  const { items, Component = SchemaSettingsIcon, componentProps, style, ...others } = props;
  const cProps = useMemo(
    () => ({
      options: props,
      style,
      ...componentProps,
    }),
    [componentProps, props, style],
  );

  return (
    <SchemaSettings title={React.createElement(Component, cProps)} {...others}>
      <SchemaSettingChildren>{items}</SchemaSettingChildren>
    </SchemaSettings>
  );
};
