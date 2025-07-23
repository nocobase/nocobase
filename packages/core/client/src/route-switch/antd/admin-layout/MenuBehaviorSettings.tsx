/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { message } from 'antd';
import React from 'react';
import { useAPIClient, useSystemSettings, SchemaSettingsSwitchItem } from '../../..';

export const MenuBehaviorSettings: React.FC = () => {
  const result = useSystemSettings() || {};
  const api = useAPIClient();

  const handleChange = async (checked: boolean) => {
    try {
      const requestData = {
        options: {
          ...result?.data?.data?.options,
          menuDisableAccordion: checked,
        },
      };

      await api.request({
        url: 'systemSettings:put',
        method: 'post',
        data: requestData,
      });

      await result.refresh();

      message.success('Menu behavior updated successfully');
    } catch (error) {
      console.error('Failed to update menu behavior:', error);
      message.error('Failed to update menu behavior');
    }
  };

  return (
    <SchemaSettingsSwitchItem
      title="Disable Menu Accordion"
      checked={result?.data?.data?.options?.menuDisableAccordion ?? false}
      onChange={handleChange}
    />
  );
};
