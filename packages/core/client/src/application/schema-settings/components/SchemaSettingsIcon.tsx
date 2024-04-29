/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
