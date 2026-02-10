/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatBoxStore } from './stores/chat-box';
import { useLLMServicesRepository } from '../../llm-services/hooks/useLLMServicesRepository';
import { useT } from '../../locale';

export const SearchSwitch: React.FC = observer(
  () => {
    const t = useT();
    const webSearch = useChatConversationsStore.use.webSearch();
    const setWebSearch = useChatConversationsStore.use.setWebSearch();
    const modelOverride = useChatBoxStore.use.modelOverride();
    const repo = useLLMServicesRepository();

    const currentService = modelOverride
      ? repo.services.find((s) => s.llmService === modelOverride.llmService)
      : undefined;
    const supportWebSearch = currentService?.supportWebSearch ?? false;

    useEffect(() => {
      if (!supportWebSearch && webSearch) {
        setWebSearch(false);
      }
    }, [supportWebSearch, webSearch, setWebSearch]);

    if (!supportWebSearch) {
      return null;
    }

    const switchChecked = () => {
      setWebSearch(!webSearch);
    };

    return webSearch ? (
      <Tooltip title={t('Disable search')} arrow={false}>
        <Button color="primary" variant="filled" icon={<GlobalOutlined />} onClick={switchChecked} />
      </Tooltip>
    ) : (
      <Tooltip title={t('Enable search')} arrow={false}>
        <Button type="text" icon={<GlobalOutlined />} onClick={switchChecked} />
      </Tooltip>
    );
  },
  { displayName: 'SearchSwitch' },
);
