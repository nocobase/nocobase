/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';

export const SearchSwitch: React.FC<{ disabled?: boolean }> = observer(({ disabled }) => {
  const t = useT();
  const repository = useAIConfigRepository();
  const webSearch = useChatConversationsStore.use.webSearch();
  const setWebSearch = useChatConversationsStore.use.setWebSearch();
  const model = useChatBoxStore.use.model();
  const services = repository.llmServices;

  useEffect(() => {
    repository.getLLMServices().catch(console.error);
  }, [repository]);

  const currentService = useMemo(() => {
    if (!model) {
      return null;
    }
    return services.find((service) => service.llmService === model.llmService) || null;
  }, [model, services]);

  const supportWebSearch = currentService?.supportWebSearch ?? false;

  useEffect(() => {
    if (!supportWebSearch && webSearch) {
      setWebSearch(false);
    }
  }, [setWebSearch, supportWebSearch, webSearch]);

  const switchChecked = () => {
    if (supportWebSearch) {
      setWebSearch(!webSearch);
    }
  };

  if (disabled) {
    return <Button type="text" icon={<GlobalOutlined />} disabled />;
  }

  if (webSearch) {
    return (
      <Tooltip title={t('Disable search')} arrow={false}>
        <Button color="primary" variant="filled" icon={<GlobalOutlined />} onClick={switchChecked} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={supportWebSearch ? t('Enable search') : t('Web search not supported')} arrow={false}>
      <Button type="text" icon={<GlobalOutlined />} onClick={switchChecked} disabled={!supportWebSearch} />
    </Tooltip>
  );
});
