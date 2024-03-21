import { MenuOutlined } from '@ant-design/icons';
import React, { FC, useMemo } from 'react';
import { useGetAriaLabelOfDesigner } from '../../../schema-settings/hooks/useGetAriaLabelOfDesigner';
import { SchemaSettingOptions } from '../types';

export interface SchemaSettingsIconProps {
  options: SchemaSettingOptions;
}

export const SchemaSettingsIcon: FC<SchemaSettingOptions> = React.memo((props) => {
  const { name } = props;
  const { getAriaLabel } = useGetAriaLabelOfDesigner();
  const style = useMemo(() => ({ cursor: 'pointer', fontSize: 12 }), []);
  return <MenuOutlined role="button" style={style} aria-label={getAriaLabel('schema-settings', name)} />;
});
SchemaSettingsIcon.displayName = 'SchemaSettingsIcon';
