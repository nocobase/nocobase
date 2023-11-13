import { FC, useMemo } from 'react';
import { SchemaSettings } from '../../../schema-settings';
import { SchemaSettingOptions } from '../types';
import { SchemaSettingChildren } from './SchemaSettingsChildren';
import { SchemaSettingsIcon } from './SchemaSettingsIcon';
import React from 'react';

export const SchemaSettingsWrapper: FC<SchemaSettingOptions<any>> = (props) => {
  const { items, Component = SchemaSettingsIcon, name, componentProps, style, ...others } = props;
  const cProps = useMemo(
    () => ({
      options: props,
      style,
      ...componentProps,
    }),
    [componentProps, props, style],
  );
  Component.displayName = `${Component.displayName || Component.name}(${name})`;

  return (
    <SchemaSettings title={React.createElement(Component, cProps)} {...others}>
      <SchemaSettingChildren>{items}</SchemaSettingChildren>
    </SchemaSettings>
  );
};
