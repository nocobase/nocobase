import { MenuOutlined } from '@ant-design/icons';
import React, { FC } from 'react';
import { useGetAriaLabelOfDesigner } from '../../../schema-settings/hooks/useGetAriaLabelOfDesigner';
import { SchemaSettingOptions } from '../types';

export interface SchemaSettingsIconProps {
  options: SchemaSettingOptions;
}

export const SchemaSettingsIcon: FC<SchemaSettingOptions> = React.memo((props) => {
  const { name } = props;
  const { getAriaLabel } = useGetAriaLabelOfDesigner();
  return <MenuOutlined role="button" aria-label={getAriaLabel('schema-settings', name)} />;
});
