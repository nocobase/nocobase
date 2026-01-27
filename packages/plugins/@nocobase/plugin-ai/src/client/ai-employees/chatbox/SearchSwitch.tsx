/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useChatConversationOptions } from './hooks/useChatConversationOptions';
import { useT } from '../../locale';

export const SearchSwitch: React.FC = () => {
  const t = useT();
  const { loading, webSearch, updateWebSearch } = useChatConversationOptions();
  const switchChecked = () => {
    updateWebSearch(!webSearch);
  };

  return webSearch ? (
    <Tooltip title={t('Disable search')} arrow={false}>
      <Button color="primary" variant="filled" icon={<GlobalOutlined />} onClick={switchChecked} loading={loading} />
    </Tooltip>
  ) : (
    <Tooltip title={t('Enable search')} arrow={false}>
      <Button type="text" icon={<GlobalOutlined />} onClick={switchChecked} loading={loading} />
    </Tooltip>
  );
};
